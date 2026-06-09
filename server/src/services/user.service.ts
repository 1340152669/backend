import bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { User, UserStatus } from '../entities/user.entity.js';
import { Role } from '../entities/role.entity.js';
import { RoleRepository } from '../repositories/role.repository.js';
import { UserRepository } from '../repositories/user.repository.js';
import type { PaginatedData, PaginationQuery } from '../types/index.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import { paginationMeta } from '../utils/response.js';

/**
 * UserService — 用户管理的业务逻辑
 *
 * @remarks
 * - 设计原理：封装用户 CRUD、状态管理、角色分配等用户领域操作
 * - 依赖：UserRepository、RoleRepository
 *
 * @example
 * const userService = new UserService(dataSource);
 * const users = await userService.list({ page: 1, pageSize: 20 });
 */
export class UserService {
  private userRepo: UserRepository;
  private roleRepo: RoleRepository;

  constructor(private readonly dataSource: DataSource) {
    this.userRepo = new UserRepository(dataSource.getRepository(User));
    this.roleRepo = new RoleRepository(dataSource.getRepository(Role));
  }

  /**
   * 用户分页列表（支持关键词模糊搜索和状态过滤）
   *
   * @param params - 分页及过滤参数
   * @returns 分页数据，含用户列表和分页元信息
   */
  async list(params: PaginationQuery): Promise<PaginatedData<User>> {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const skip = (page - 1) * pageSize;

    const [list, total] = await this.userRepo.searchUsers({
      keyword: params.keyword,
      status: params.status,
      skip,
      take: pageSize,
    });

    return { list, meta: paginationMeta(total, page, pageSize) };
  }

  /**
   * 用户详情（含角色、权限、部门关联）
   *
   * @param id - 用户 ID
   * @throws NotFoundError - 用户不存在
   */
  async getById(id: string): Promise<User> {
    const user = await this.userRepo.findById(id, {
      relations: { roles: { permissions: true }, departments: true },
    });
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    return user;
  }

  /**
   * 创建用户
   *
   * @param data - 用户信息（用户名、邮箱、密码、可选昵称、手机号、角色和部门）
   * @throws ConflictError - 用户名或邮箱重复
   */
  async create(data: {
    username: string;
    email: string;
    password: string;
    nickname?: string;
    phone?: string;
    roleIds?: string[];
    departmentIds?: string[];
  }): Promise<User> {
    // 原因：用户名和邮箱在数据库有 UNIQUE 约束，包含软删除记录避免 TypeORM 默认过滤后 DB 层抛 ER_DUP_ENTRY
    const existingUser = await this.userRepo.findByUsername(data.username, true);
    if (existingUser) {
      throw new ConflictError('用户名已存在');
    }

    const existingEmail = await this.userRepo.findByEmail(data.email, true);
    if (existingEmail) {
      throw new ConflictError('邮箱已被使用');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 查询角色
    let roles: Role[] = [];
    if (data.roleIds && data.roleIds.length > 0) {
      roles = await this.roleRepo.findByIds(data.roleIds);
    }

    const user = await this.userRepo.create({
      username: data.username,
      email: data.email,
      password: hashedPassword,
      nickname: data.nickname,
      phone: data.phone,
      roles,
    });

    // 同步部门关联
    if (data.departmentIds && data.departmentIds.length > 0) {
      await this.syncDepartments(user.id, data.departmentIds);
    }

    return this.getById(user.id);
  }

  /**
   * 更新用户信息
   *
   * @param id - 用户 ID
   * @param data - 可更新字段（邮箱、昵称、手机号、状态、部门）
   * @throws NotFoundError - 用户不存在
   * @throws ConflictError - 邮箱被其他用户占用
   */
  async update(
    id: string,
    data: { email?: string; nickname?: string; phone?: string; status?: UserStatus; departmentIds?: string[] },
  ): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    // 原因：仅邮箱被修改时才需唯一性检查，避免未改邮箱时误判
    if (data.email && data.email !== user.email) {
      // 原因：使用 withDeleted 包含软删除记录，防止 TypeORM 默认过滤后 DB 层抛 ER_DUP_ENTRY
      // 且排除当前用户自身（MySQL 大小写不敏感 vs JS 严格比较可能误判为不同邮箱）
      const existingEmail = await this.userRepo.findByEmail(data.email, true);
      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictError('邮箱已被使用');
      }
    }

    // 原因：兜底捕获并发写入时的数据库唯一约束冲突，转为业务错误
    try {
      await this.userRepo.update(id, {
        email: data.email,
        nickname: data.nickname,
        phone: data.phone,
        status: data.status,
      });
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        // 原因：应用层检查通过后仍可能因并发请求导致重复键冲突，给出明确提示
        throw new ConflictError('邮箱已被其他用户占用');
      }
      throw err;
    }

    // 同步部门关联（全量覆盖）
    if (data.departmentIds !== undefined) {
      await this.syncDepartments(id, data.departmentIds);
    }

    return this.getById(id);
  }

  /** 删除用户（软删除，仅标记 deletedAt 时间戳） */
  async delete(id: string): Promise<void> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    await this.userRepo.softDelete(id);
  }

  /** 启用/禁用用户账号 */
  async toggleStatus(id: string, status: UserStatus): Promise<User> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    await this.userRepo.update(id, { status });
    return this.getById(id);
  }

  /**
   * 为用户分配角色（覆盖式：传入的角色列表会替换原有角色）
   *
   * @param userId - 用户 ID
   * @param roleIds - 角色 ID 列表
   */
  async assignRoles(userId: string, roleIds: string[]): Promise<User> {
    const user = await this.userRepo.findById(userId, { relations: { roles: true } });
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const roles = await this.roleRepo.findByIds(roleIds);
    user.roles = roles;
    await this.userRepo.save(user);

    return this.getById(userId);
  }

  /**
   * 重置用户密码（管理员操作）
   *
   * @param id - 用户 ID
   * @param newPassword - 新密码（明文）
   * @throws NotFoundError - 用户不存在
   */
  async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(id, { password: hashedPassword });
  }

  /**
   * 同步用户的部门关联（全量覆盖）
   *
   * @param userId - 用户 ID
   * @param departmentIds - 部门 ID 列表
   * @remarks
   * 由于 Department 是 user_departments 关系的拥有侧（@JoinTable），
   * 此处直接操作中间表来同步用户-部门关联。
   */
  private async syncDepartments(userId: string, departmentIds: string[]): Promise<void> {
    // 去重，防止重复 departmentId 导致 user_departments 唯一约束冲突
    const uniqueIds = [...new Set(departmentIds)];

    // 清除原有部门关联
    await this.dataSource.createQueryBuilder()
      .delete()
      .from('user_departments')
      .where('userId = :userId', { userId })
      .execute();

    // 插入新的部门关联
    if (uniqueIds.length > 0) {
      await this.dataSource.createQueryBuilder()
        .insert()
        .into('user_departments')
        .values(uniqueIds.map(departmentId => ({ userId, departmentId })))
        .execute();
    }
  }
}

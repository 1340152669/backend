import { DataSource } from 'typeorm';
import { Role } from '../entities/role.entity.js';
import { Permission } from '../entities/permission.entity.js';
import { PermissionRepository } from '../repositories/permission.repository.js';
import { RoleRepository } from '../repositories/role.repository.js';
import { ConflictError, ForbiddenError, NotFoundError } from '../utils/errors.js';

/**
 * RoleService — 角色管理的业务逻辑
 *
 * @remarks
 * - 设计原理：封装角色 CRUD、权限分配等角色领域操作
 * - 系统预置角色（isSystem=true）不可删除
 *
 * @example
 * const roleService = new RoleService(dataSource);
 * const roles = await roleService.list();
 */
export class RoleService {
  private roleRepo: RoleRepository;
  private permissionRepo: PermissionRepository;

  constructor(private readonly dataSource: DataSource) {
    this.roleRepo = new RoleRepository(dataSource.getRepository(Role));
    this.permissionRepo = new PermissionRepository(
      dataSource.getRepository(Permission),
    );
  }

  /** 角色列表（全部，含权限关联） */
  async list(): Promise<Role[]> {
    return this.roleRepo.findAllWithPermissions();
  }

  /**
   * 角色详情（含权限关联）
   *
   * @param id - 角色 ID
   * @throws NotFoundError - 角色不存在
   */
  async getById(id: string): Promise<Role> {
    const role = await this.roleRepo.findByIdWithPermissions(id);
    if (!role) {
      throw new NotFoundError('角色不存在');
    }
    return role;
  }

  /**
   * 创建角色
   *
   * @param data - 角色信息（名称、显示名、描述、状态）
   * @throws ConflictError - 角色名称已存在
   */
  async create(data: {
    name: string;
    label: string;
    description?: string;
    status?: 0 | 1;
  }): Promise<Role> {
    // 原因：包含软删除记录，避免 TypeORM 默认过滤后 DB 层抛 unique violation
    const existing = await this.roleRepo.findByName(data.name, true);
    if (existing) {
      throw new ConflictError('角色名称已存在');
    }

    // 原因：兜底捕获并发写入时的数据库唯一约束冲突
    try {
      return this.roleRepo.create({
        name: data.name,
        label: data.label,
        description: data.description,
        status: data.status ?? 1,
      });
    } catch (err: any) {
      if (err.code === '23505') {
        throw new ConflictError('角色名称已存在');
      }
      throw err;
    }
  }

  /** 更新角色信息（显示名、描述、状态） */
  async update(
    id: string,
    data: { label?: string; description?: string; status?: 0 | 1 },
  ): Promise<Role> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new NotFoundError('角色不存在');
    }

    const updateData: Record<string, unknown> = {};
    if (data.label !== undefined) updateData.label = data.label;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) {
      // 禁止禁用系统预置角色
      if (data.status === 0 && role.isSystem) {
        throw new ForbiddenError('系统预置角色不可禁用');
      }
      updateData.status = data.status;
    }

    if (Object.keys(updateData).length > 0) {
      await this.roleRepo.update(id, updateData as any);
    }
    return this.getById(id);
  }

  /**
   * 删除角色
   *
   * @throws ForbiddenError - 系统预置角色不可删除
   * @throws NotFoundError - 角色不存在
   */
  async delete(id: string): Promise<void> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new NotFoundError('角色不存在');
    }
    if (role.isSystem) {
      throw new ForbiddenError('系统预置角色不可删除');
    }
    await this.roleRepo.softDelete(id);
  }

  /**
   * 启用/禁用角色
   *
   * @param id - 角色 ID
   * @param status - 1=启用 / 0=禁用
   * @throws NotFoundError - 角色不存在
   * @throws ForbiddenError - 系统预置角色不可禁用
   */
  async toggleStatus(id: string, status: 0 | 1): Promise<Role> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new NotFoundError('角色不存在');
    }
    if (status === 0 && role.isSystem) {
      throw new ForbiddenError('系统预置角色不可禁用');
    }
    await this.roleRepo.update(id, { status });
    return this.getById(id);
  }

  /**
   * 查询绑定到此角色的用户数量
   *
   * @param roleId - 角色 ID
   * @returns 绑定用户数量
   */
  async countBoundUsers(roleId: string): Promise<number> {
    return this.roleRepo.countBoundUsers(roleId);
  }

  /**
   * 为角色绑定权限（覆盖式：传入的权限列表会替换原有权限）
   *
   * @param roleId - 角色 ID
   * @param permissionIds - 权限 ID 列表
   */
  async assignPermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.roleRepo.findById(roleId, {
      relations: { permissions: true },
    });
    if (!role) {
      throw new NotFoundError('角色不存在');
    }

    // 原因：去重防止 role_permissions 唯一约束冲突
    const uniqueIds = [...new Set(permissionIds)];
    const permissions = await this.permissionRepo.findByIds(uniqueIds);
    role.permissions = permissions;

    return this.roleRepo.save(role);
  }
}

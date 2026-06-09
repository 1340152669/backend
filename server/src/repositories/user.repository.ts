import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { User } from '../entities/user.entity.js';
import { BaseRepository } from './base.repository.js';

/** 包含密码的用户字段选择（默认 select 不包含 password，此常量用于登录场景显式查询密码） */
const WITH_PASSWORD_SELECT = {
  id: true,
  username: true,
  email: true,
  password: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * 用户仓库 — 用户实体的数据访问层
 *
 * @remarks
 * - 设计原理：封装 User 实体的独特查询方法
 * - 默认查询不包含 password 字段（安全设计）
 * - 登录相关方法显式指定 select 以获取密码
 */
export class UserRepository extends BaseRepository<User> {
  constructor(repo: Repository<User>) {
    super(repo);
  }

  /**
   * 按用户名精确查询（用户名字段有唯一约束）
   *
   * @param username - 目标用户名
   * @param withDeleted - 是否包含软删除记录（默认 false）
   */
  async findByUsername(username: string, withDeleted = false): Promise<User | null> {
    return this.findOneBy({ username } as FindOptionsWhere<User>, withDeleted ? { withDeleted: true } : undefined);
  }

  /**
   * 按邮箱精确查询
   *
   * @param email - 目标邮箱
   * @param withDeleted - 是否包含软删除记录（默认 false，用于唯一性检查时需包含软删除，防止 ER_DUP_ENTRY）
   */
  async findByEmail(email: string, withDeleted = false): Promise<User | null> {
    return this.findOneBy({ email } as FindOptionsWhere<User>, withDeleted ? { withDeleted: true } : undefined);
  }

  /** 按 ID 查询用户并包含密码字段（仅用于认证场景） */
  async findByIdWithPassword(id: string): Promise<User | null> {
    return this.repo.findOne({
      where: { id } as FindOptionsWhere<User>,
      select: WITH_PASSWORD_SELECT,
    });
  }

  /** 按用户名查询并包含密码字段（仅用于登录场景） */
  async findByUsernameWithPassword(username: string): Promise<User | null> {
    return this.repo.findOne({
      where: { username } as FindOptionsWhere<User>,
      select: WITH_PASSWORD_SELECT,
    });
  }

  /**
   * 搜索用户（分页 + 关键词模糊匹配）
   *
   * @param params.keyword - 用户名模糊搜索关键词（可选）
   * @param params.status - 状态过滤（可选）
   * @param params.skip - 分页偏移量
   * @param params.take - 每页条数
   * @returns [用户列表, 总记录数]
   */
  async searchUsers(params: {
    keyword?: string;
    status?: string;
    skip: number;
    take: number;
  }): Promise<[User[], number]> {
    const where: FindOptionsWhere<User> = {};

    if (params.keyword) {
      where.username = ILike(`%${params.keyword}%`) as any;
    }
    if (params.status) {
      where.status = params.status as any;
    }

    return this.repo.findAndCount({
      where,
      skip: params.skip,
      take: params.take,
      relations: { roles: true, departments: true },
      order: { createdAt: 'DESC' },
    });
  }
}

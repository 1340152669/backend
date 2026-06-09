import { FindOptionsWhere, Repository } from 'typeorm';
import { Role } from '../entities/role.entity.js';
import { BaseRepository } from './base.repository.js';

/**
 * 角色仓库 — 角色实体的数据访问层
 *
 * @remarks
 * - 设计原理：封装 Role 实体的独特查询方法
 * - 提供常用预加载关联关系的查询（含权限）
 */
export class RoleRepository extends BaseRepository<Role> {
  constructor(repo: Repository<Role>) {
    super(repo);
  }

  /**
   * 按角色名称精确查询（角色名有唯一约束）
   *
   * @param name - 目标角色名
   * @param withDeleted - 是否包含软删除记录（用于唯一性检查）
   */
  async findByName(name: string, withDeleted = false): Promise<Role | null> {
    return this.findOneBy({ name } as FindOptionsWhere<Role>, withDeleted ? { withDeleted: true } : undefined);
  }

  /** 查询所有角色并加载权限关联 */
  async findAllWithPermissions(): Promise<Role[]> {
    return this.repo.find({
      relations: { permissions: true },
      order: { createdAt: 'DESC' },
    });
  }

  /** 按 ID 查询角色并加载权限关联 */
  async findByIdWithPermissions(id: string): Promise<Role | null> {
    return this.repo.findOne({
      where: { id } as FindOptionsWhere<Role>,
      relations: { permissions: true },
    });
  }

  /** 按 ID 列表批量查询角色（不含关联） */
  async findByIds(ids: string[]): Promise<Role[]> {
    return this.repo.find({
      where: ids.map((id) => ({ id })) as FindOptionsWhere<Role>[],
    });
  }

  /** 查询绑定到此角色的用户数量 */
  async countBoundUsers(roleId: string): Promise<number> {
    return this.repo
      .createQueryBuilder('role')
      .innerJoin('role.users', 'user')
      .where('role.id = :roleId', { roleId })
      .andWhere('user.deletedAt IS NULL')
      .getCount();
  }
}

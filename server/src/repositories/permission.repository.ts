import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity.js';
import { BaseRepository } from './base.repository.js';

/** 权限分页查询允许的排序字段白名单 */
const SORTABLE_FIELDS = new Set<(keyof Permission) | string>([
  'code', 'label', 'menuType', 'sort', 'path', 'componentPath',
  'status', 'isShow', 'isExternalLink', 'createdAt', 'updatedAt',
]);

/**
 * 权限仓库 — 权限实体的数据访问层
 *
 * @remarks
 * - 设计原理：封装 Permission 实体的独特查询方法
 * - 支持权限树查询（通过 parentId 自关联）
 * - 分页查询通过 sortBy/sortOrder 白名单校验，防止无效字段注入
 */
export class PermissionRepository extends BaseRepository<Permission> {
  constructor(repo: Repository<Permission>) {
    super(repo);
  }

  /**
   * 按权限代码精确查询（code 有唯一约束）
   *
   * @param code - 目标权限代码
   * @param withDeleted - 是否包含软删除记录
   */
  async findByCode(code: string, withDeleted = false): Promise<Permission | null> {
    return this.findOneBy({ code } as FindOptionsWhere<Permission>, withDeleted ? { withDeleted: true } : undefined);
  }

  /** 按 ID 列表批量查询权限 */
  async findByIds(ids: string[]): Promise<Permission[]> {
    return this.repo.find({
      where: { id: In(ids) },
    });
  }

  /**
   * 分页查询权限列表（支持排序）
   *
   * @param params.skip - 偏移量
   * @param params.take - 每页条数
   * @param params.sortBy - 排序字段（必须在白名单内）
   * @param params.sortOrder - 排序方向 ASC | DESC
   * @returns [权限列表, 总记录数]
   *
   * @remarks
   * sortBy 通过白名单校验，防止无效或恶意字段名传入。
   * 默认按 sort ASC、code ASC 排序。
   */
  async findPaginated(params: {
    skip: number;
    take: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<[Permission[], number]> {
    const order: Record<string, 'ASC' | 'DESC'> = {};

    // 仅当 sortBy 在白名单内时使用，否则回退默认排序
    if (params.sortBy && SORTABLE_FIELDS.has(params.sortBy)) {
      order[params.sortBy] = params.sortOrder ?? 'ASC';
    }

    // 默认按 sort 升序、code 升序
    order['sort'] = 'ASC';
    if (params.sortBy !== 'code') {
      order['code'] = 'ASC';
    }

    return this.repo.findAndCount({
      skip: params.skip,
      take: params.take,
      order,
    });
  }

  /**
   * 查询权限树（全量加载后在内存中建树，支持排序）
   *
   * @param params.sortBy - 排序字段（必须在白名单内）
   * @param params.sortOrder - 排序方向 ASC | DESC
   * @returns 树形权限列表，每级子节点按指定字段排序
   *
   * @remarks
   * 全量加载后在内存中建树，突破 TypeORM relations 仅加载1层的限制。
   * 排序作用于树的每一级节点（同级按 sortBy 排序）。
   */
  async findTree(params?: {
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<Permission[]> {
    const all = await this.repo.find({
      order: { code: 'ASC' },
    });

    // 全量加载后在内存中建树，突破 TypeORM relations 仅加载1层的限制
    const permMap = new Map<string, Permission>();
    const roots: Permission[] = [];

    for (const perm of all) {
      perm.children = [];
      permMap.set(perm.id, perm);
    }

    for (const perm of all) {
      if (perm.parentId && permMap.has(perm.parentId)) {
        permMap.get(perm.parentId)!.children!.push(perm);
      } else if (!perm.parentId) {
        roots.push(perm);
      }
    }

    // 按 sortBy/sortOrder 对每级子节点重新排序
    if (params?.sortBy && SORTABLE_FIELDS.has(params.sortBy)) {
      const sortKey = params.sortBy as keyof Permission;
      const dir = params.sortOrder === 'DESC' ? -1 : 1;

      const sortRecursive = (nodes: Permission[]): void => {
        // 同级排序
        nodes.sort((a, b) => {
          const av = a[sortKey];
          const bv = b[sortKey];
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          return av < bv ? -dir : av > bv ? dir : 0;
        });
        // 递归排序子节点
        for (const node of nodes) {
          if (node.children?.length) {
            sortRecursive(node.children);
          }
        }
      };

      sortRecursive(roots);
    }

    return roots;
  }

  /** 查询指定父权限下的子权限列表 */
  async findChildren(parentId: string): Promise<Permission[]> {
    return this.repo.find({
      where: { parentId } as FindOptionsWhere<Permission>,
    });
  }

  /**
   * 查询指定用户有权限访问的菜单权限（只含 directory / menu 类型）
   *
   * @param userId - 用户 ID
   * @returns 菜单权限列表（平铺，需在 service 层组装树），按 sort ASC 排序
   *
   * @remarks
   * 通过用户的角色 → 角色权限关联表 → 权限表 JOIN 查询，
   * 仅返回 status = 1（启用）且 menuType = 'directory' | 'menu' 的权限。
   */
  async findUserMenus(userId: string): Promise<Permission[]> {
    return this.repo
      .createQueryBuilder('p')
      .innerJoin('role_permissions', 'rp', 'rp.permissionId = p.id')
      .innerJoin('roles', 'r', 'r.id = rp.roleId')
      .innerJoin('user_roles', 'ur', 'ur.roleId = r.id')
      .where('ur.userId = :userId', { userId })
      .andWhere('p.status = 1')
      .andWhere("p.menuType IN ('directory', 'menu')")
      .orderBy('p.sort', 'ASC')
      .addOrderBy('p.code', 'ASC')
      .getMany();
  }

  /**
   * 查询所有权限及其关联的角色数
   *
   * @remarks
   * 通过 LEFT JOIN role_permissions 关联表统计每个权限被多少个角色绑定。
   * 返回平铺列表，每项包含 permission 字段和 roleCount 计数字段。
   *
   * @returns 权限列表，每项扩展了 roleCount 属性
   */
  async findAllWithRoleCounts(): Promise<(Permission & { roleCount: number })[]> {
    return this.repo
      .createQueryBuilder('p')
      .leftJoin('role_permissions', 'rp', 'rp.permissionId = p.id')
      .select('p.*')
      .addSelect('COUNT(DISTINCT rp.roleId)', 'roleCount')
      .groupBy('p.id')
      .orderBy('p.code', 'ASC')
      .getRawMany();
  }
}

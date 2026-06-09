import { DataSource } from 'typeorm';
import { Permission } from '../entities/permission.entity.js';
import type { MenuType } from '../entities/permission.entity.js';
import { PermissionRepository } from '../repositories/permission.repository.js';
import type { PaginatedData, PaginationQuery } from '../types/index.js';
import { paginationMeta } from '../utils/response.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';

/**
 * PermissionService — 权限管理的业务逻辑
 *
 * @remarks
 * - 设计原理：封装权限 CRUD、权限树查询等权限领域操作
 * - 删除权限时需先确认没有子权限
 *
 * @example
 * const permissionService = new PermissionService(dataSource);
 * const tree = await permissionService.getTree();
 */
export class PermissionService {
  private permissionRepo: PermissionRepository;

  constructor(private readonly dataSource: DataSource) {
    this.permissionRepo = new PermissionRepository(
      dataSource.getRepository(Permission),
    );
  }

  /**
   * 获取权限树（按父子结构组织，用于前端菜单/权限配置）
   *
   * @param sortBy - 排序字段（默认 code，可选 label、sort 等）
   * @param sortOrder - 排序方向 ASC | DESC
   */
  async getTree(sortBy?: string, sortOrder?: 'ASC' | 'DESC'): Promise<Permission[]> {
    return this.permissionRepo.findTree({ sortBy, sortOrder });
  }

  /**
   * 获取权限分页列表（支持排序）
   *
   * @param params - 分页及排序参数
   * @returns 分页数据，含权限列表和分页元信息
   */
  async list(params: PaginationQuery): Promise<PaginatedData<Permission>> {
    const page = params.page ?? 1;
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const skip = (page - 1) * pageSize;

    const [list, total] = await this.permissionRepo.findPaginated({
      skip,
      take: pageSize,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });

    return { list, meta: paginationMeta(total, page, pageSize) };
  }

  /** 权限详情 */
  async getById(id: string): Promise<Permission> {
    const permission = await this.permissionRepo.findById(id);
    if (!permission) {
      throw new NotFoundError('权限不存在');
    }
    return permission;
  }

  /**
   * 创建权限
   *
   * @param data - 权限信息
   * @throws ConflictError - 权限代码已存在
   *
   * @remarks
   * 支持字段：code、label、description、menuType、icon、sort、isExternalLink、
   * path、routeName、componentPath、routeParams、isCache、isShow、status、parentId
   */
  async create(data: {
    code: string;
    label: string;
    description?: string;
    menuType?: MenuType;
    icon?: string;
    sort?: number;
    isExternalLink?: boolean;
    path?: string;
    routeName?: string;
    componentPath?: string;
    routeParams?: string;
    isCache?: boolean;
    isShow?: boolean;
    status?: number;
    parentId?: string;
  }): Promise<Permission> {
    // 原因：包含软删除记录，避免 TypeORM 默认过滤后 DB 层抛 ER_DUP_ENTRY
    const existing = await this.permissionRepo.findByCode(data.code, true);
    if (existing) {
      throw new ConflictError('权限代码已存在');
    }

    try {
      return await this.permissionRepo.create(data);
    } catch (err: any) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new ConflictError('权限代码已存在');
      }
      throw err;
    }
  }

    /**
     * 更新权限信息（支持所有字段部分更新）
     *
     * @throws ConflictError - 权限代码已被其他权限使用
     */
    async update(
      id: string,
      data: {
        code?: string;
        label?: string;
        description?: string;
        menuType?: MenuType;
        icon?: string;
        sort?: number;
        isExternalLink?: boolean;
        path?: string;
        routeName?: string;
        componentPath?: string;
        routeParams?: string;
        isCache?: boolean;
        isShow?: boolean;
        status?: number;
        parentId?: string | null;
      },
    ): Promise<Permission> {
      const permission = await this.permissionRepo.findById(id);
      if (!permission) {
        throw new NotFoundError('权限不存在');
      }

      // 原因：变更权限代码时检查唯一性（含软删除），且排除自身
      if (data.code && data.code !== permission.code) {
        const existing = await this.permissionRepo.findByCode(data.code, true);
        if (existing && existing.id !== id) {
          throw new ConflictError('权限代码已存在');
        }
      }

      try {
        // 原因：data.parentId 可能为 null（清除父级），TypeORM 需要 as any 兼容 DeepPartial
        await this.permissionRepo.update(id, data as any);
      } catch (err: any) {
        if (err.code === 'ER_DUP_ENTRY') {
          throw new ConflictError('权限代码已存在');
        }
        throw err;
      }
      return this.getById(id);
    }

  /**
   * 删除权限
   *
   * @throws ConflictError - 该权限有子权限，需先删除子权限
   */
  async delete(id: string): Promise<void> {
    const permission = await this.permissionRepo.findById(id);
    if (!permission) {
      throw new NotFoundError('权限不存在');
    }

    // 检查是否有子权限
    const children = await this.permissionRepo.findChildren(id);
    if (children.length > 0) {
      throw new ConflictError('请先删除子权限');
    }

    await this.permissionRepo.softDelete(id);
  }

  // ──── 用户菜单查询 ────

  /**
   * 获取当前用户有权限访问的菜单树（directory + menu 类型）
   *
   * @param userId - 当前用户 ID
   * @returns 树形菜单权限列表，每级子节点按 sort ASC 排序
   *
   * @remarks
   * 仅返回 status = 1 的启用菜单，由用户角色关联的权限决定可见范围。
   * 返回数据包含完整路由/组件信息，供前端动态生成路由和侧边栏菜单。
   */
  async getUserMenus(userId: string): Promise<Permission[]> {
    const all = await this.permissionRepo.findUserMenus(userId);

    // 在内存中组装树（与 findTree 相同模式）
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

    return roots;
  }

  // ──── 维度统计 ────

  /**
   * 获取权限维度统计数据
   *
   * @remarks
   * 按 code 的 menu:function 前缀分组（如 system:user、system:role），
   * 统计每个维度下的权限数量及每个权限的角色绑定数。
   *
   * @returns 维度分组数组，按维度名排序
   */
  async getDimensionStats(): Promise<{
    dimension: string;
    totalPermissions: number;
    totalRoleBindings: number;
    items: { id: string; code: string; label: string; dimension: string; roleCount: number }[];
  }[]> {
    const permissions = await this.permissionRepo.findAllWithRoleCounts();

    // 按 menu:function 前缀分组（取 code 前两段）
    const groups = new Map<string, {
      dimension: string;
      totalRoleBindings: number;
      items: { id: string; code: string; label: string; dimension: string; roleCount: number }[];
    }>();

    for (const perm of permissions) {
      const parts = perm.code.split(':');
      // 取前两段作为维度名（system:user），单段 code 归为 other
      const dimension = parts.length >= 2 ? `${parts[0]}:${parts[1]}` : 'other';

      if (!groups.has(dimension)) {
        groups.set(dimension, { dimension, totalRoleBindings: 0, items: [] });
      }

      const group = groups.get(dimension)!;
      group.items.push({
        id: perm.id,
        code: perm.code,
        label: perm.label,
        dimension,
        roleCount: perm.roleCount ?? 0,
      });
      group.totalRoleBindings += perm.roleCount ?? 0;
    }

    // 转为数组，按维度名排序
    const result = Array.from(groups.values())
      .map((g) => ({
        ...g,
        totalPermissions: g.items.length,
        items: g.items.sort((a, b) => a.code.localeCompare(b.code)),
      }))
      .sort((a, b) => a.dimension.localeCompare(b.dimension));

    return result;
  }
}

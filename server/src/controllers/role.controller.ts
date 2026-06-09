import type { RequestHandler } from 'express';
import { DataSource } from 'typeorm';
import { RoleService } from '../services/role.service.js';
import { success } from '../utils/response.js';

/**
 * RoleController — 角色管理 HTTP 请求处理器
 *
 * @remarks
 * - 设计原理：角色 CRUD、权限分配的请求入口
 * - 职责：参数提取 → 委托 RoleService → 响应发送
 *
 * @example
 * const controller = new RoleController(dataSource);
 * router.get('/', requirePermission(Permissions.RoleRead), asyncHandler(controller.list));
 */
export class RoleController {
  private roleService: RoleService;

  constructor(dataSource: DataSource) {
    this.roleService = new RoleService(dataSource);
  }

  /** GET /api/v1/roles — 角色列表 */
  list: RequestHandler = async (req, res) => {
    const roles = await this.roleService.list();
    success(res, roles);
  };

  /** GET /api/v1/roles/:id — 角色详情 */
  getById: RequestHandler = async (req, res) => {
    const id = req.params.id as string;
    const role = await this.roleService.getById(id);
    success(res, role);
  };

  /** POST /api/v1/roles — 创建角色 */
  create: RequestHandler = async (req, res) => {
    const role = await this.roleService.create(req.body);
    success(res, role, '创建成功');
  };

  /** PUT /api/v1/roles/:id — 更新角色 */
  update: RequestHandler = async (req, res) => {
    const id = req.params.id as string;
    const role = await this.roleService.update(id, req.body);
    success(res, role, '更新成功');
  };

  /** DELETE /api/v1/roles/:id — 删除角色 */
  delete: RequestHandler = async (req, res) => {
    const id = req.params.id as string;
    await this.roleService.delete(id);
    success(res, null, '删除成功');
  };

  /** PUT /api/v1/roles/:id/permissions — 为角色绑定权限 */
  assignPermissions: RequestHandler = async (req, res) => {
    const id = req.params.id as string;
    const role = await this.roleService.assignPermissions(
      id,
      req.body.permissionIds,
    );
    success(res, role, '权限绑定成功');
  };

  /** PATCH /api/v1/roles/:id/status — 启用/禁用角色 */
  toggleStatus: RequestHandler = async (req, res) => {
    const id = req.params.id as string;
    const role = await this.roleService.toggleStatus(id, req.body.status);
    success(res, role, '状态更新成功');
  };

  /** GET /api/v1/roles/:id/users/count — 查询绑定此角色的用户数量 */
  countBoundUsers: RequestHandler = async (req, res) => {
    const id = req.params.id as string;
    const count = await this.roleService.countBoundUsers(id);
    success(res, { count });
  };
}

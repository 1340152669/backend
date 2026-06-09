import type { RequestHandler } from 'express';
import { DataSource } from 'typeorm';
import { UserService } from '../services/user.service.js';
import type { PaginationQuery } from '../types/index.js';
import { success, successWithPaginated } from '../utils/response.js';

/**
 * UserController — 用户管理 HTTP 请求处理器
 *
 * @remarks
 * - 设计原理：用户 CRUD、状态管理、角色分配的请求入口
 * - 职责：参数提取 → 委托 UserService → 响应发送
 *
 * @example
 * const controller = new UserController(dataSource);
 * router.get('/', requirePermission(Permissions.UserRead), asyncHandler(controller.list));
 */
export class UserController {
  private userService: UserService;

  constructor(dataSource: DataSource) {
    this.userService = new UserService(dataSource);
  }

  /** GET /api/v1/users — 用户分页列表 */
  list: RequestHandler = async (req, res) => {
    const params: PaginationQuery = {
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      keyword: req.query.keyword as string | undefined,
      status: req.query.status as string | undefined,
    };
    const result = await this.userService.list(params);
    successWithPaginated(res, result);
  };

  /** GET /api/v1/users/:id — 用户详情 */
  getById: RequestHandler = async (req, res) => {
    const id = req.params.id as string;
    const user = await this.userService.getById(id);
    success(res, user);
  };

  /** POST /api/v1/users — 创建用户 */
  create: RequestHandler = async (req, res) => {
    const user = await this.userService.create(req.body);
    success(res, user, '创建成功');
  };

  /** PUT /api/v1/users/:id — 更新用户 */
  update: RequestHandler = async (req, res) => {
    const id = req.params.id as string;
    const user = await this.userService.update(id, req.body);
    success(res, user, '更新成功');
  };

  /** DELETE /api/v1/users/:id — 删除用户 */
  delete: RequestHandler = async (req, res) => {
    const id = req.params.id as string;
    await this.userService.delete(id);
    success(res, null, '删除成功');
  };

  /** PATCH /api/v1/users/:id/status — 启用/禁用用户 */
  toggleStatus: RequestHandler = async (req, res) => {
    const id = req.params.id as string;
    const user = await this.userService.toggleStatus(id, req.body.status);
    success(res, user, '状态更新成功');
  };

  /** PUT /api/v1/users/:id/roles — 分配角色 */
  assignRoles: RequestHandler = async (req, res) => {
    const id = req.params.id as string;
    const user = await this.userService.assignRoles(id, req.body.roleIds);
    success(res, user, '角色分配成功');
  };

  /** PATCH /api/v1/users/:id/reset-password — 管理员重置密码 */
  resetPassword: RequestHandler = async (req, res) => {
    const id = req.params.id as string;
    await this.userService.resetPassword(id, req.body.password);
    success(res, null, '密码重置成功');
  };
}

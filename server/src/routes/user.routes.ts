/**
 * 用户管理路由
 *
 * 权限设计：
 * - Permissions.UserRead   → GET 列表/详情
 * - Permissions.UserCreate → POST 创建
 * - Permissions.UserUpdate → PUT 更新、PATCH 状态、PUT 角色分配
 * - Permissions.UserDelete → DELETE 删除
 */

import { Router } from 'express';
import { DataSource } from 'typeorm';
import { UserController } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { Permissions } from '../lib/permissions.js';
import {
  assignRolesSchema,
  createUserSchema,
  resetPasswordSchema,
  updateUserSchema,
  updateUserStatusSchema,
} from '../validators/user.validator.js';

export function createUserRouter(dataSource: DataSource): Router {
  const router = Router();
  const controller = new UserController(dataSource);

  // 所有用户路由需要认证
  router.use(authenticate);

  /** GET /api/v1/users — 用户列表 */
  router.get('/', requirePermission(dataSource, Permissions.UserRead), asyncHandler(controller.list));

  /** GET /api/v1/users/:id — 用户详情 */
  router.get('/:id', requirePermission(dataSource, Permissions.UserRead), asyncHandler(controller.getById));

  /** POST /api/v1/users — 创建用户 */
  router.post('/', requirePermission(dataSource, Permissions.UserCreate), validate(createUserSchema), asyncHandler(controller.create));

  /** PUT /api/v1/users/:id — 更新用户 */
  router.put('/:id', requirePermission(dataSource, Permissions.UserUpdate), validate(updateUserSchema), asyncHandler(controller.update));

  /** DELETE /api/v1/users/:id — 删除用户 */
  router.delete('/:id', requirePermission(dataSource, Permissions.UserDelete), asyncHandler(controller.delete));

  /** PATCH /api/v1/users/:id/status — 启用/禁用 */
  router.patch('/:id/status', requirePermission(dataSource, Permissions.UserUpdate), validate(updateUserStatusSchema), asyncHandler(controller.toggleStatus));

  /** PUT /api/v1/users/:id/roles — 分配角色 */
  router.put('/:id/roles', requirePermission(dataSource, Permissions.UserUpdate), validate(assignRolesSchema), asyncHandler(controller.assignRoles));

  /** PATCH /api/v1/users/:id/reset-password — 管理员重置密码 */
  router.patch('/:id/reset-password', requirePermission(dataSource, Permissions.UserUpdate), validate(resetPasswordSchema), asyncHandler(controller.resetPassword));

  return router;
}

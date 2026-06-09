/**
 * 角色管理路由
 *
 * 权限设计：
 * - Permissions.RoleRead   → GET 列表/详情
 * - Permissions.RoleCreate → POST 创建
 * - Permissions.RoleUpdate → PUT 更新、PUT 权限分配
 * - Permissions.RoleDelete → DELETE 删除
 */

import { Router } from 'express';
import { DataSource } from 'typeorm';
import { RoleController } from '../controllers/role.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { Permissions } from '../lib/permissions.js';
import {
  assignPermissionsSchema,
  createRoleSchema,
  updateRoleSchema,
  updateRoleStatusSchema,
} from '../validators/role.validator.js';

export function createRoleRouter(dataSource: DataSource): Router {
  const router = Router();
  const controller = new RoleController(dataSource);

  // 所有角色路由需要认证
  router.use(authenticate);

  /** GET /api/v1/roles — 角色列表 */
  router.get('/', requirePermission(dataSource, Permissions.RoleRead), asyncHandler(controller.list));

  /** GET /api/v1/roles/:id — 角色详情 */
  router.get('/:id', requirePermission(dataSource, Permissions.RoleRead), asyncHandler(controller.getById));

  /** POST /api/v1/roles — 创建角色 */
  router.post('/', requirePermission(dataSource, Permissions.RoleCreate), validate(createRoleSchema), asyncHandler(controller.create));

  /** PUT /api/v1/roles/:id — 更新角色 */
  router.put('/:id', requirePermission(dataSource, Permissions.RoleUpdate), validate(updateRoleSchema), asyncHandler(controller.update));

  /** DELETE /api/v1/roles/:id — 删除角色 */
  router.delete('/:id', requirePermission(dataSource, Permissions.RoleDelete), asyncHandler(controller.delete));

  /** PUT /api/v1/roles/:id/permissions — 绑定权限 */
  router.put('/:id/permissions', requirePermission(dataSource, Permissions.RoleUpdate), validate(assignPermissionsSchema), asyncHandler(controller.assignPermissions));

  /** PATCH /api/v1/roles/:id/status — 启用/禁用 */
  router.patch('/:id/status', requirePermission(dataSource, Permissions.RoleUpdate), validate(updateRoleStatusSchema), asyncHandler(controller.toggleStatus));

  /** GET /api/v1/roles/:id/users/count — 查询角色绑定用户数 */
  router.get('/:id/users/count', requirePermission(dataSource, Permissions.RoleRead), asyncHandler(controller.countBoundUsers));

  return router;
}

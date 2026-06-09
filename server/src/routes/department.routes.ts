/**
 * 部门管理路由
 *
 * 权限设计：
 * - Permissions.DeptRead   → GET 部门树/详情
 * - Permissions.DeptCreate → POST 创建
 * - Permissions.DeptUpdate → PUT 更新、PATCH 状态、PUT 用户分配
 * - Permissions.DeptDelete → DELETE 删除
 */

import { Router } from 'express';
import { DataSource } from 'typeorm';
import { DepartmentController } from '../controllers/department.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { Permissions } from '../lib/permissions.js';
import {
    assignDepartmentUsersSchema,
    createDepartmentSchema,
    updateDepartmentSchema,
    updateDepartmentStatusSchema,
} from '../validators/department.validator.js';

export function createDepartmentRouter(dataSource: DataSource): Router {
    const router = Router();
    const controller = new DepartmentController(dataSource);

    // 所有部门路由需要认证
    router.use(authenticate);

    /** GET /api/v1/departments — 部门树 */
    router.get('/', requirePermission(dataSource, Permissions.DeptRead), asyncHandler(controller.getTree));

    /** GET /api/v1/departments/:id — 部门详情 */
    router.get('/:id', requirePermission(dataSource, Permissions.DeptRead), asyncHandler(controller.getById));

    /** POST /api/v1/departments — 创建部门 */
    router.post('/', requirePermission(dataSource, Permissions.DeptCreate), validate(createDepartmentSchema), asyncHandler(controller.create));

    /** PUT /api/v1/departments/:id — 更新部门 */
    router.put('/:id', requirePermission(dataSource, Permissions.DeptUpdate), validate(updateDepartmentSchema), asyncHandler(controller.update));

    /** DELETE /api/v1/departments/:id — 删除部门 */
    router.delete('/:id', requirePermission(dataSource, Permissions.DeptDelete), asyncHandler(controller.delete));

    /** PATCH /api/v1/departments/:id/status — 启用/禁用 */
    router.patch('/:id/status', requirePermission(dataSource, Permissions.DeptUpdate), validate(updateDepartmentStatusSchema), asyncHandler(controller.toggleStatus));

    /** PUT /api/v1/departments/:id/users — 分配用户 */
    router.put('/:id/users', requirePermission(dataSource, Permissions.DeptUpdate), validate(assignDepartmentUsersSchema), asyncHandler(controller.assignUsers));

    return router;
}

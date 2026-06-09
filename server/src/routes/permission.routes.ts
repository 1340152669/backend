/**
 * 权限管理路由
 *
 * 权限设计：
 * - Permissions.PermissionRead   → GET 树/列表/详情
 * - Permissions.PermissionCreate → POST 创建
 * - Permissions.PermissionUpdate → PUT 更新
 * - Permissions.PermissionDelete → DELETE 删除
 */

import { Router } from 'express';
import { DataSource } from 'typeorm';
import { PermissionController } from '../controllers/permission.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/permission.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { Permissions } from '../lib/permissions.js';
import {
    createPermissionSchema,
    updatePermissionSchema,
} from '../validators/permission.validator.js';

export function createPermissionRouter(dataSource: DataSource): Router {
    const router = Router();
    const controller = new PermissionController(dataSource);

    // 所有权限路由需要认证
    router.use(authenticate);

    /** GET /api/v1/permissions — 权限树 */
    router.get(
        '/',
        requirePermission(dataSource, Permissions.PermissionRead),
        asyncHandler(controller.getTree),
    );

    /** GET /api/v1/permissions/list — 权限平铺列表 */
    router.get(
        '/list',
        requirePermission(dataSource, Permissions.PermissionRead),
        asyncHandler(controller.list),
    );

    /** GET /api/v1/permissions/dimensions — 权限维度统计 */
    router.get(
        '/dimensions',
        requirePermission(dataSource, Permissions.PermissionRead),
        asyncHandler(controller.dimensions),
    );

    /** GET /api/v1/permissions/:id — 权限详情 */
    router.get(
        '/:id',
        requirePermission(dataSource, Permissions.PermissionRead),
        asyncHandler(controller.getById),
    );

    /** POST /api/v1/permissions — 创建权限 */
    router.post(
        '/',
        requirePermission(dataSource, Permissions.PermissionCreate),
        validate(createPermissionSchema),
        asyncHandler(controller.create),
    );

    /** PUT /api/v1/permissions/:id — 更新权限 */
    router.put(
        '/:id',
        requirePermission(dataSource, Permissions.PermissionUpdate),
        validate(updatePermissionSchema),
        asyncHandler(controller.update),
    );

    /** DELETE /api/v1/permissions/:id — 删除权限 */
    router.delete(
        '/:id',
        requirePermission(dataSource, Permissions.PermissionDelete),
        asyncHandler(controller.delete),
    );

    return router;
}

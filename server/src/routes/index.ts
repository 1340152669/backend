/**
 * 路由聚合入口
 *
 * 所有 API 路由以 /api/v1 为前缀在此集中注册
 * 新增业务模块时在此追加 createXxxRouter(dataSource)
 */

import { Router } from 'express';
import { DataSource } from 'typeorm';
import { createAuthRouter } from './auth.routes.js';
import { createDepartmentRouter } from './department.routes.js';
import { createPermissionRouter } from './permission.routes.js';
import { createRoleRouter } from './role.routes.js';
import { createUserRouter } from './user.routes.js';

export function createRoutes(dataSource: DataSource): Router {
    const router = Router();

    router.use('/auth', createAuthRouter(dataSource));
    router.use('/users', createUserRouter(dataSource));
    router.use('/roles', createRoleRouter(dataSource));
    router.use('/permissions', createPermissionRouter(dataSource));
    router.use('/departments', createDepartmentRouter(dataSource));

    return router;
}

/**
 * 权限校验中间件
 *
 * 设计原则：
 * - 柯里化工厂模式：(dataSource, permissionCode) → RequestHandler
 * - dataSource 在路由初始化时传入，遵循项目 DI 模式
 * - 在 authenticate 之后使用，从 req.userId 获取用户
 * - 查询用户的所有角色 → 聚合权限 code → 判断是否包含目标权限
 * - admin 角色（系统内置）放行所有权限
 *
 * 用法：
 * ```typescript
 * router.get('/', authenticate, requirePermission(dataSource, Permissions.UserRead), handler);
 * ```
 */

import { type RequestHandler } from 'express';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity.js';
import { UserRepository } from '../repositories/user.repository.js';
import { ForbiddenError } from '../utils/errors.js';

/**
 * 创建权限校验中间件
 * @param dataSource TypeORM 数据源
 * @param permissionCode 所需权限码，如 Permissions.UserCreate
 */
export function requirePermission(
    dataSource: DataSource,
    permissionCode: string,
): RequestHandler {
    return async (_req, _res, next) => {
        try {
            const userId = _req.userId;
            if (!userId) {
                next(new ForbiddenError('未认证用户'));
                return;
            }

            const userRepo = new UserRepository(
                dataSource.getRepository(User),
            );
            const user = await userRepo.findById(userId, {
                relations: { roles: { permissions: true } },
            });

            if (!user) {
                next(new ForbiddenError('用户不存在'));
                return;
            }

            // 过滤已禁用的角色（不贡献权限）
            const activeRoles = user.roles.filter(
                (r) => r.status !== 0,
            );

            // admin 角色（系统内置）放行所有权限
            const hasAdminRole = activeRoles.some(
                (r) => r.name === 'admin' || r.isSystem,
            );
            if (hasAdminRole) {
                next();
                return;
            }

            // 聚合所有活跃角色的权限 code
            const permissionCodes = new Set<string>();
            for (const role of activeRoles) {
                for (const perm of role.permissions) {
                    permissionCodes.add(perm.code);
                }
            }

            if (!permissionCodes.has(permissionCode)) {
                next(
                    new ForbiddenError(`权限不足，需要权限：${permissionCode}`),
                );
                return;
            }

            next();
        } catch (err) {
            next(new ForbiddenError('权限校验失败'));
        }
    };
}

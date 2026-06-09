/**
 * 权限编码常量（menu:function:button 三级结构）
 *
 * 设计原则：
 * - 所有 permission code 在此统一管理，项目中禁止硬编码权限字符串
 * - 编码格式：system:功能:操作（如 system:user:read）
 * - 使用时通过 `Permissions.UserRead` 方式引用，确保全局一致
 *
 * @example
 * import { Permissions } from '../lib/permissions.js';
 * requirePermission(dataSource, Permissions.UserRead);
 */
export const Permissions = {
    /** 系统设置（菜单级） */
    System: 'system',

    // ──── 系统设置：用户管理 ────

    /** 用户管理（功能级） */
    User: 'system:user',
    /** 查看用户列表和详情（按钮级） */
    UserRead: 'system:user:read',
    /** 创建新用户（按钮级） */
    UserCreate: 'system:user:create',
    /** 编辑用户信息（按钮级） */
    UserUpdate: 'system:user:update',
    /** 删除用户（按钮级） */
    UserDelete: 'system:user:delete',

    // ──── 系统设置：角色管理 ────

    /** 角色管理（功能级） */
    Role: 'system:role',
    /** 查看角色列表和详情（按钮级） */
    RoleRead: 'system:role:read',
    /** 创建新角色（按钮级） */
    RoleCreate: 'system:role:create',
    /** 编辑角色信息（按钮级） */
    RoleUpdate: 'system:role:update',
    /** 删除角色（按钮级） */
    RoleDelete: 'system:role:delete',

    // ──── 系统设置：权限管理 ────

    /** 权限管理（功能级） */
    Permission: 'system:permission',
    /** 查看权限列表和详情（按钮级） */
    PermissionRead: 'system:permission:read',
    /** 创建新权限（按钮级） */
    PermissionCreate: 'system:permission:create',
    /** 编辑权限定义（按钮级） */
    PermissionUpdate: 'system:permission:update',
    /** 删除权限（按钮级） */
    PermissionDelete: 'system:permission:delete',

    // ──── 系统设置：部门管理 ────

    /** 部门管理（功能级） */
    Dept: 'system:dept',
    /** 查看部门树和详情（按钮级） */
    DeptRead: 'system:dept:read',
    /** 创建新部门（按钮级） */
    DeptCreate: 'system:dept:create',
    /** 编辑部门信息（按钮级） */
    DeptUpdate: 'system:dept:update',
    /** 删除部门（按钮级） */
    DeptDelete: 'system:dept:delete',
} as const;

/** 权限编码联合类型，用于类型安全的参数约束 */
export type PermissionCode = (typeof Permissions)[keyof typeof Permissions];

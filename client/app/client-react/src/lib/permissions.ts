/** 权限编码常量（menu:function:button 三级结构），所有 permission code 在此统一管理 */
export const Permissions = {
  System: 'system',
  User: 'system:user',
  UserRead: 'system:user:read',
  UserCreate: 'system:user:create',
  UserUpdate: 'system:user:update',
  UserDelete: 'system:user:delete',
  Role: 'system:role',
  RoleRead: 'system:role:read',
  RoleCreate: 'system:role:create',
  RoleUpdate: 'system:role:update',
  RoleDelete: 'system:role:delete',
  Permission: 'system:permission',
  PermissionRead: 'system:permission:read',
  PermissionCreate: 'system:permission:create',
  PermissionUpdate: 'system:permission:update',
  PermissionDelete: 'system:permission:delete',
  Dept: 'system:dept',
  DeptRead: 'system:dept:read',
  DeptCreate: 'system:dept:create',
  DeptUpdate: 'system:dept:update',
  DeptDelete: 'system:dept:delete',
} as const

export type PermissionCode = (typeof Permissions)[keyof typeof Permissions]

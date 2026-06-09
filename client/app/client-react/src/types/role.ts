import type { Permission } from './permission'

/** 角色实体 */
export interface Role {
  id: string
  name: string
  label: string
  description?: string
  status: 0 | 1
  isSystem: boolean
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

/** 创建角色请求参数 */
export interface CreateRoleParams {
  name: string
  label: string
  description?: string
  status?: 0 | 1
}

/** 更新角色请求参数 */
export interface UpdateRoleParams {
  label?: string
  description?: string
  status?: 0 | 1
}

/** 绑定角色权限参数（全量覆盖） */
export interface BindPermissionsParams {
  permissionIds: string[]
}

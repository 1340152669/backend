import type { PaginationParams } from './api'
import type { Role } from './role'
import type { Department } from './department'

/** 用户实体 */
export interface User {
  id: string
  username: string
  email: string
  phone?: string
  nickname: string
  status: 0 | 1
  roles: Pick<Role, 'id' | 'name' | 'label'>[]
  departments?: Pick<Department, 'id' | 'name'>[]
  createdAt: string
  updatedAt: string
}

/** 用户查询参数 */
export interface UserQueryParams extends PaginationParams {
  keyword?: string
  status?: 0 | 1
}

/** 创建用户请求参数 */
export interface CreateUserParams {
  username: string
  email: string
  password: string
  nickname: string
  phone?: string
  roleIds: string[]
  departmentIds?: string[]
}

/** 更新用户请求参数 */
export interface UpdateUserParams {
  email?: string
  nickname?: string
  phone?: string
  status?: 0 | 1
  departmentIds?: string[]
}

/** 更新用户状态参数 */
export interface UpdateUserStatusParams {
  status: 0 | 1
}

/** 分配用户角色参数 */
export interface AssignRolesParams {
  roleIds: string[]
}

/** 重置密码参数 */
export interface ResetPasswordParams {
  password: string
}

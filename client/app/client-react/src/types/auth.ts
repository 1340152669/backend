import type { Role } from './role'
import type { Permission } from './permission'

/** 注册请求参数 */
export interface RegisterParams {
  username: string
  email: string
  password: string
  nickname?: string
}

/** 登录请求参数 */
export interface LoginParams {
  username: string
  password: string
}

/** 登录响应数据 */
export interface LoginResult {
  token: string
  user: UserInfo
}

/** 当前用户信息（脱敏，不含 password） */
export interface UserInfo {
  id: string
  username: string
  email: string
  nickname: string
  status: 0 | 1
  createdAt?: string
  updatedAt?: string
}

/** 当前用户完整信息（含角色、权限和可访问的菜单树） */
export interface UserProfile extends UserInfo {
  roles: Array<Role & { permissions: PermissionInfo[] }>
  menus: Permission[]
}

/** 权限简略信息 */
export interface PermissionInfo {
  id: string
  code: string
  label: string
}

/** 修改密码请求参数 */
export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

/** Token 刷新响应 */
export interface RefreshResult {
  token: string
}

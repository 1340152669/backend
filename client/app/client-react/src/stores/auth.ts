/**
 * 认证 Store — 管理登录/登出状态、当前用户信息、权限判断
 *
 * 设计原则：Token 持久化到 localStorage；用户信息通过 GET /auth/me 懒加载；
 * 权限判断通过 hasPermission(code) 方法实现层级匹配。
 */
import { create } from 'zustand'
import { login as loginApi, register as registerApi, getMe, refreshToken as refreshTokenApi } from '@/api/auth'
import type { LoginParams, RegisterParams, UserProfile, LoginResult, RefreshResult } from '@/types'

interface AuthState {
  user: UserProfile | null
  loaded: boolean
  loading: boolean

  /** 登录状态：localStorage 中存在 Token 即视为已登录 */
  isAuthenticated: () => boolean
  /** 当前用户所有权限 code 集合（去重） */
  permissionCodes: () => Set<string>
  /** 层级权限判断 */
  hasPermission: (code: string) => boolean
  login: (params: LoginParams) => Promise<void>
  registerUser: (params: RegisterParams) => Promise<void>
  fetchUserProfile: () => Promise<void>
  refreshUserToken: () => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loaded: false,
  loading: false,

  isAuthenticated: () => !!localStorage.getItem('token'),

  permissionCodes: () => {
    const { user } = get()
    if (!user) return new Set<string>()
    const codes = new Set<string>()
    for (const role of user.roles) {
      for (const perm of role.permissions) codes.add(perm.code)
    }
    return codes
  },

  hasPermission: (code: string) => {
    const { user } = get()
    if (!user) return false
    const permCodes = get().permissionCodes()
    for (const permCode of permCodes) {
      if (code === permCode) return true
      const userLevel = permCode.split(':').length
      const reqLevel = code.split(':').length
      if (userLevel >= 2 && userLevel < reqLevel && code.startsWith(permCode + ':')) return true
      if (userLevel > reqLevel && permCode.startsWith(code + ':')) return true
    }
    return false
  },

  login: async (params: LoginParams) => {
    const res = await loginApi<LoginParams, LoginResult>(params)
    const { token } = res.data.data
    localStorage.setItem('token', token)
    await get().fetchUserProfile()
  },

  registerUser: async (params: RegisterParams) => {
    const res = await registerApi<RegisterParams, LoginResult>(params)
    const { token } = res.data.data
    localStorage.setItem('token', token)
    await get().fetchUserProfile()
  },

  fetchUserProfile: async () => {
    if (get().loading) return
    set({ loading: true })
    try {
      const res = await getMe<UserProfile>()
      set({ user: res.data.data, loaded: true })
    } finally {
      set({ loading: false })
    }
  },

  refreshUserToken: async () => {
    try {
      const res = await refreshTokenApi<RefreshResult>()
      localStorage.setItem('token', res.data.data.token)
      return true
    } catch { return false }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, loaded: false })
  },
}))

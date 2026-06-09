/**
 * 菜单 Store — 当前用户可访问的动态菜单
 *
 * 复用 /auth/me 接口获取菜单树，不新增独立 API 端点。
 */
import { create } from 'zustand'
import { useAuthStore } from './auth'
import type { Permission } from '@/types'

interface MenuState {
  menus: Permission[]
  loaded: boolean
  loading: boolean
  fetchMenus: () => Promise<Permission[]>
  reset: () => void
}

export const useMenuStore = create<MenuState>((set, get) => ({
  menus: [],
  loaded: false,
  loading: false,

  fetchMenus: async () => {
    if (get().loaded && get().menus.length > 0) return get().menus
    const authStore = useAuthStore.getState()
    if (authStore.user?.menus && Array.isArray(authStore.user.menus) && authStore.user.menus.length > 0) {
      set({ menus: authStore.user.menus, loaded: true })
      return get().menus
    }
    set({ loading: true })
    try {
      await authStore.fetchUserProfile()
      const userMenus = useAuthStore.getState().user?.menus
      set({ menus: Array.isArray(userMenus) ? userMenus : [], loaded: true })
    } catch { set({ menus: [], loaded: false }) }
    finally { set({ loading: false }) }
    return get().menus
  },

  reset: () => set({ menus: [], loaded: false }),
}))

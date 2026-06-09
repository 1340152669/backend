/**
 * 认证路由守卫 — 检查登录态并加载用户信息
 *
 * 设计原理：作为路由层级的 layout route 使用，确保 useLocation/useNavigate 在 Router 上下文中调用。
 * 公开路由（login/register）无需经过此守卫；受保护路由自动触发 auth check。
 */
import { useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'

export default function AuthRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  const authStore = useAuthStore()
  const menuStore = useMenuStore()
  const initialized = useRef(false)

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token')
      // 无 Token 时跳转登录页，带上当前路径作为 redirect 参数
      if (!token) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true })
        return
      }

      // 有 Token 但未加载用户信息时，先加载
      if (!authStore.loaded) {
        try {
          await authStore.fetchUserProfile()
        } catch {
          authStore.logout()
          navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`, { replace: true })
          return
        }
      }

      // 加载动态菜单
      if (!menuStore.loaded) {
        await menuStore.fetchMenus()
      }
    }

    if (!initialized.current) {
      initialized.current = true
      init()
    }
  }, [navigate, location.pathname, authStore, menuStore])

  return <Outlet />
}

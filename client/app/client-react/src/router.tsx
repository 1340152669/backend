/**
 * 路由配置 — 公开路由 + 受保护的路由（含认证守卫）
 *
 * 设计原则：
 * - 公开路由（login/register）不经过 AuthRoute，无需认证
 * - 受保护路由由 AuthRoute 统一检查登录态，再进入 AppLayout
 * - AuthRoute 在 Router 内部使用，确保 useLocation/useNavigate 可用
 */
import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import AuthRoute from './AuthRoute'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

const UserListPage = lazy(() => import('@/pages/user/UserListPage'))
const RoleListPage = lazy(() => import('@/pages/role/RoleListPage'))
const DepartmentListPage = lazy(() => import('@/pages/department/DepartmentListPage'))
const PermissionViewPage = lazy(() => import('@/pages/permission/PermissionViewPage'))
const PermissionDimensionPage = lazy(() => import('@/pages/permission/PermissionDimensionPage'))
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'))
const NotFoundPage = lazy(() => import('@/pages/error/NotFoundPage'))

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="flex items-center justify-center h-40 text-muted-foreground">加载中...</div>}>{children}</Suspense>
)

export const router = createBrowserRouter([
  // ──── 公开路由（无需认证） ────
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // ──── 受保护的路由（AuthRoute 检查登录态） ────
  {
    element: <AuthRoute />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/users" replace /> },
          { path: 'profile', element: <SuspenseWrapper><ProfilePage /></SuspenseWrapper> },
          { path: 'users', element: <SuspenseWrapper><UserListPage /></SuspenseWrapper> },
          { path: 'roles', element: <SuspenseWrapper><RoleListPage /></SuspenseWrapper> },
          { path: 'departments', element: <SuspenseWrapper><DepartmentListPage /></SuspenseWrapper> },
          { path: 'permissions', element: <SuspenseWrapper><PermissionViewPage /></SuspenseWrapper> },
          { path: 'permissions/dimensions', element: <SuspenseWrapper><PermissionDimensionPage /></SuspenseWrapper> },
        ],
      },
    ],
  },

  // ──── 404 兜底 ────
  { path: '*', element: <SuspenseWrapper><NotFoundPage /></SuspenseWrapper> },
])

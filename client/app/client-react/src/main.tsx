/**
 * 应用入口 — React Query + Router + Toast 全局基础设施
 *
 * 设计原则：
 * - React Query 管理所有服务端状态（缓存/重试/失效策略）
 * - 认证守卫（AuthRoute）在路由层级内部处理，确保 Router 上下文可用
 * - 全局错误处理将后端业务错误码自动映射为 Toast 提示
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { Toaster } from '@/components/ui/toaster'
import { setGlobalErrorHandler } from '@/lib/http'
import { toast } from '@/components/ui/use-toast'
import './index.css'

/**
 * React Query 客户端实例
 *
 * 默认策略：
 * - staleTime: 30s — 30 秒内认为数据新鲜，不重新请求
 * - gcTime: 5min — 缓存保留 5 分钟
 * - retry: 2 — 失败自动重试 2 次（偶发性网络抖动）
 * - refetchOnWindowFocus: false — 传统后台管理，不因聚焦刷新
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
})

// 全局错误提示：后端返回业务错误码时自动弹出 Toast
setGlobalErrorHandler((message) => toast({ title: message, variant: 'destructive' }))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
)

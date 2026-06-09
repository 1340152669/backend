/**
 * Axios 实例和拦截器 — 统一 Token 注入和错误处理
 *
 * 设计原则：从 localStorage 读取 Token 注入 Authorization 头；
 * Token 过期时自动静默续期，避免中断用户操作。
 */
import axios from 'axios'
import type { ApiResult } from '@/types'

let globalErrorHandler: ((message: string) => void) | null = null

export function setGlobalErrorHandler(handler: (message: string) => void): void {
  globalErrorHandler = handler
}

const http = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers = []
}

http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error),
)

http.interceptors.response.use(
  (response) => {
    const res = response.data as ApiResult
    if (res.code !== 0) {
      if (res.code === 1002 || res.code === 1008) return handleTokenExpired(response.config) as unknown as typeof response
      globalErrorHandler?.(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest?._retry && window.location.pathname !== '/login') {
      return handleTokenExpired(originalRequest)
    }
    const message = error.response?.data?.message || error.message || '网络异常'
    globalErrorHandler?.(message)
    return Promise.reject(error)
  },
)

async function handleTokenExpired(originalRequest: any) {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshSubscribers.push((token: string) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        resolve(http(originalRequest))
      })
    })
  }
  originalRequest._retry = true
  isRefreshing = true
  try {
    const res = await axios.post('/api/v1/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    const newToken = (res.data as ApiResult<{ token: string }>).data.token
    localStorage.setItem('token', newToken)
    onRefreshed(newToken)
    isRefreshing = false
    originalRequest.headers.Authorization = `Bearer ${newToken}`
    return http(originalRequest)
  } catch {
    isRefreshing = false
    refreshSubscribers = []
    localStorage.removeItem('token')
    if (window.location.pathname !== '/login') window.location.href = '/login'
    return Promise.reject(new Error('登录已过期'))
  }
}

export default http

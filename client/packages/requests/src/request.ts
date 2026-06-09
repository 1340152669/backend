/**
 * Axios 实例和拦截器
 *
 * 设计原则：
 * - 统一 Token 注入
 * - 统一错误处理（含静默 Token 续期）
 * - 统一响应类型解包
 * - 支持注册全局错误回调，消费方可将错误结果映射为 UI 提示（如 Toast）
 *
 * 用法：
 * ```ts
 * import http from './request'
 * const res = await http.get<ApiResult<User>>('/users')
 * ```
 *
 * 全局错误提示（在 main.ts 中注册一次即可）：
 * ```ts
 * import { setGlobalErrorHandler } from '@rbac/requests'
 * import { useToast } from '@rbac/ui'
 * setGlobalErrorHandler((message) => useToast().showToast(message, 'error'))
 * ```
 */

import axios from 'axios'
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiResult } from './types'

/** 全局错误回调：接口返回业务错误码时调用，消费方可用 Toast 等 UI 方式展示 */
let globalErrorHandler: ((message: string) => void) | null = null

/**
 * 注册全局 API 错误处理回调
 *
 * @param handler - 接收错误消息的回调函数，推荐传入 showToast(message, 'error')
 *
 * @example
 * ```ts
 * setGlobalErrorHandler((msg) => useToast().showToast(msg, 'error'))
 * ```
 */
export function setGlobalErrorHandler(handler: (message: string) => void): void {
    globalErrorHandler = handler
}

const http = axios.create({
    baseURL: '/api/v1',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
})

/** 是否正在刷新 Token（防重入锁） */
let isRefreshing = false
/** 等待 Token 刷新的请求队列：续期成功后依次重放 */
let refreshSubscribers: ((token: string) => void)[] = []

/**
 * Token 刷新成功后重放队列中的请求
 *
 * @param token - 新的 Token
 * @remarks
 * 遍历 refreshSubscribers 队列，逐个通知等待的请求用新 Token 重试。
 */
function onRefreshed(token: string) {
    refreshSubscribers.forEach((callback) => callback(token))
    refreshSubscribers = []
}

/**
 * 请求拦截器：从 localStorage 读取 Token 注入 Authorization 头
 */
http.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token')
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error),
)

/**
 * 响应拦截器：统一解包 + Token 过期自动续期
 *
 * @remarks
 * - 业务 code 非 0 时，判断是否为 Token 过期（1002 / 1008），是则触发静默续期
 * - HTTP 401 时，尝试静默续期，失败跳转登录页
 * - 已在登录页时不处理 Token 续期，避免循环
 */
http.interceptors.response.use(
    (response: AxiosResponse<ApiResult>) => {
        const res = response.data
        if (res.code !== 0) {
            // 原因：1002 = UNAUTHORIZED, 1008 = TOKEN_EXPIRED，触发静默续期
            if (res.code === 1002 || res.code === 1008) {
                return handleTokenExpired(response.config) as Promise<AxiosResponse<ApiResult>>
            }
            // 全局错误回调：确保业务错误结果能通过 UI（如 Toast）直接反馈给用户
            globalErrorHandler?.(res.message || '请求失败')
            return Promise.reject(new Error(res.message || '请求失败'))
        }
        return response
    },
    async (error) => {
        const originalRequest = error.config
        // 原因：401 时尝试续期，但若已在登录页则不处理（避免循环跳转）
        if (
            error.response?.status === 401 &&
            !originalRequest?._retry &&
            window.location.pathname !== '/login'
        ) {
            return handleTokenExpired(originalRequest) as Promise<AxiosResponse<ApiResult>>
        }
        // 全局错误回调：覆盖网络异常、服务器 5xx 等非业务错误
        const message = error.response?.data?.message || error.message || '网络异常，请稍后重试'
        globalErrorHandler?.(message)
        return Promise.reject(error)
    },
)

/**
 * Token 过期处理：尝试静默续期，失败则跳转登录
 *
 * @param originalRequest - 被拦截的原始请求配置
 * @returns Promise 使用新 Token 重放原始请求，或拒绝
 *
 * @remarks
 * - 若已有续期请求在进行中（isRefreshing = true），则排队等待新 Token
 * - 续期成功后重放队列中所有等待的请求
 * - 续期失败则清除 Token 并跳转登录页
 */
async function handleTokenExpired(originalRequest: any) {
    // 原因：已有续期请求进行中，排队等待，避免多个并发续期请求
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
        // 使用独立的 axios 实例调用刷新接口（避免拦截器循环）
        const res = await axios.post<ApiResult<{ token: string }>>(
            '/api/v1/auth/refresh',
            {},
            {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            },
        )
        const newToken = res.data.data.token
        localStorage.setItem('token', newToken)
        onRefreshed(newToken)
        isRefreshing = false
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return http(originalRequest)
    } catch {
        // 刷新失败，清除登录态并跳转登录页
        isRefreshing = false
        refreshSubscribers = []
        localStorage.removeItem('token')
        if (window.location.pathname !== '/login') {
            window.location.href = '/login'
        }
        return Promise.reject(new Error('登录已过期，请重新登录'))
    }
}

// 扩展 Axios 类型以支持 _retry
declare module 'axios' {
    interface InternalAxiosRequestConfig {
        _retry?: boolean
    }
}

export default http

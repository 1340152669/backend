/**
 * @rbac/requests — 通用 HTTP 请求库
 *
 * 职责：
 * - 基于 Axios，统一 Token 注入和响应拦截
 * - 仅提供请求工具，不含任何业务 API
 * - 业务 API 请在各消费包（如 @rbac/client）的 src/api/ 中实现
 *
 * 用法：
 * ```ts
 * import { http } from '@rbac/requests'
 * import type { ApiResult } from '@rbac/requests'
 * const res = await http.get<ApiResult<User[]>>('/users')
 * ```
 */

export { default as http, setGlobalErrorHandler } from './request'
export { validateResponse } from './validate'
export type { ApiResult, PaginationMeta, PaginationParams } from './types'

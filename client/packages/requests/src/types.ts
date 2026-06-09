/**
 * @rbac/requests — 通用 API 类型定义
 *
 * 设计原则：
 * - 仅包含 HTTP 请求/响应相关的通用类型
 * - 业务类型由消费方（如 @rbac/client）自行定义
 *
 * 用法：
 * ```ts
 * import type { ApiResult } from '@rbac/requests'
 * const res = await http.get<ApiResult<User[]>>('/users')
 * ```
 */

/**
 * 通用 API 响应结构
 *
 * @typeParam T - data 字段的实际数据类型
 */
export interface ApiResult<T = unknown> {
    code: number
    message: string
    data: T
    meta?: PaginationMeta
}

/**
 * 分页元信息（后端分页接口返回）
 *
 * @example
 * { total: 100, page: 1, pageSize: 20, totalPages: 5 }
 */
export interface PaginationMeta {
    total: number
    page: number
    pageSize: number
    totalPages: number
}

/** 分页查询参数（客户端传入） */
export interface PaginationParams {
    page?: number
    pageSize?: number
}

/** 通用 API 响应结构 */
export interface ApiResult<T = unknown> {
  code: number
  message: string
  data: T
  meta?: PaginationMeta
}

/** 分页元信息 */
export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/** 分页查询参数 */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

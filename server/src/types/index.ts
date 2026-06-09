/* ───────── 通用响应类型 ───────── */

/** 统一 API 响应体结构 */
export interface ApiResponse<T = unknown> {
  // 业务错误码，0 表示成功
  code: number;
  // 响应消息
  message: string;
  // 响应数据，失败时为 null
  data: T | null;
  // 分页元信息（仅分页接口返回）
  meta?: PaginationMeta;
}

/** 分页元信息 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/* ───────── 分页查询参数 ───────── */

/** 通用分页查询参数 */
export interface PaginationQuery {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/** 分页数据包装 */
export interface PaginatedData<T> {
  list: T[];
  meta: PaginationMeta;
}

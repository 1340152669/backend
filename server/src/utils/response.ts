import { Response } from 'express';
import { ErrorCode } from '../constants/index.js';
import type { ApiResponse, PaginatedData, PaginationMeta } from '../types/index.js';

/** 成功响应 (200) */
export function success<T>(res: Response, data: T, message = 'success') {
  const body: ApiResponse<T> = { code: ErrorCode.SUCCESS, message, data };
  res.json(body);
}

/** 成功响应 + 分页元信息 */
export function successWithPaginated<T>(
  res: Response,
  { list, meta }: PaginatedData<T>,
  message = 'success',
) {
  const body: ApiResponse<T[]> = {
    code: ErrorCode.SUCCESS,
    message,
    data: list,
    meta,
  };
  res.json(body);
}

/** 错误响应（通常由 error.middleware 调用） */
export function fail(
  res: Response,
  code: ErrorCode,
  message: string,
  statusCode = 400,
  details?: unknown,
) {
  const body: ApiResponse = { code, message, data: details ?? null };
  res.status(statusCode).json(body);
}

/** 创建分页元信息 */
export function paginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

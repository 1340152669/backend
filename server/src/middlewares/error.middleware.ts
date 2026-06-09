import { type ErrorRequestHandler } from 'express';
import { ErrorCode } from '../constants/index.js';
import { AppError } from '../utils/errors.js';
import { fail } from '../utils/response.js';

/**
 * 全局错误处理中间件
 *
 * 捕获所有未处理的异常：
 * - AppError 子类 → 提取业务错误码和 HTTP 状态码
 * - 未知错误 → 返回 500 + 错误码 1000
 *
 * 必须保留 4 个参数签名，Express 靠参数数量识别 error middleware
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // 已知业务异常
  if (err instanceof AppError) {
    fail(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Zod 校验错误
  if (err.name === 'ZodError') {
    fail(res, ErrorCode.VALIDATION_ERROR, '参数校验失败', 400, err.issues);
    return;
  }

  // TypeORM 数据库错误
  if (err.code === 'ER_DUP_ENTRY') {
    fail(res, ErrorCode.CONFLICT, '数据重复', 409);
    return;
  }

  // 未知错误
  console.error('[ERROR]', err);
  fail(res, ErrorCode.UNKNOWN, '服务器内部错误', 500);
};

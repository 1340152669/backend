import { ErrorCode, ErrorHttpStatus } from '../constants/index.js';

/**
 * 应用错误基类 — 所有业务异常的父类
 * 携带业务错误码，由全局 error.middleware 统一捕获处理
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = ErrorHttpStatus[code] ?? 500;
    this.details = details;
  }
}

/** 资源不存在 (404) */
export class NotFoundError extends AppError {
  constructor(message = '资源不存在', details?: unknown) {
    super(ErrorCode.NOT_FOUND, message, details);
  }
}

/** 未登录或 Token 过期 (401) */
export class UnauthorizedError extends AppError {
  constructor(message = '请先登录', details?: unknown) {
    super(ErrorCode.UNAUTHORIZED, message, details);
  }
}

/** 无权限 (403) */
export class ForbiddenError extends AppError {
  constructor(message = '无权限访问', details?: unknown) {
    super(ErrorCode.FORBIDDEN, message, details);
  }
}

/** 参数校验失败 (400) */
export class ValidationError extends AppError {
  constructor(message = '参数校验失败', details?: unknown) {
    super(ErrorCode.VALIDATION_ERROR, message, details);
  }
}

/** 资源冲突 (409) */
export class ConflictError extends AppError {
  constructor(message = '资源冲突', details?: unknown) {
    super(ErrorCode.CONFLICT, message, details);
  }
}

/** 无效凭证 (401) */
export class InvalidCredentialsError extends AppError {
  constructor(message = '用户名或密码错误') {
    super(ErrorCode.INVALID_CREDENTIALS, message);
  }
}

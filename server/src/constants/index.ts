/** 业务错误码枚举 */
export enum ErrorCode {
  SUCCESS = 0,
  UNKNOWN = 1000,
  NOT_FOUND = 1001,
  UNAUTHORIZED = 1002,
  FORBIDDEN = 1003,
  VALIDATION_ERROR = 1004,
  CONFLICT = 1005,
  USER_DISABLED = 1006,
  INVALID_CREDENTIALS = 1007,
  TOKEN_EXPIRED = 1008,
}

/** ErrorCode → HTTP 状态码映射 */
export const ErrorHttpStatus: Record<ErrorCode, number> = {
  [ErrorCode.SUCCESS]: 200,
  [ErrorCode.UNKNOWN]: 500,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.USER_DISABLED]: 403,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
};

import type { RequestHandler } from 'express';

/**
 * 异步请求处理包装器
 *
 * 消除 Controller 中重复的 try-catch 模板代码，
 * 将 async handler 中抛出的异常自动转发到 Express 错误中间件。
 *
 * @example
 * router.get('/users', asyncHandler(userController.list))
 */
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

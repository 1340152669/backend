import type { RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors.js';

/**
 * 参数校验中间件工厂
 *
 * 使用 Zod Schema 校验请求体，校验通过后将解析后的数据写回 req.body
 *
 * @example
 * router.post('/users', validate(createUserSchema), userController.create)
 */
export function validate<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`,
      );
      next(new ValidationError('参数校验失败', messages));
      return;
    }
    // 将转换/解析后的数据写回，支持 Zod 的默认值和类型转换
    req.body = result.data;
    next();
  };
}

import { type RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../utils/errors.js';

/**
 * JWT 认证中间件
 *
 * 从 Authorization Header 提取 Bearer Token 并验证：
 * - 验证通过 → 将用户信息注入 req.user / req.userId
 * - 验证失败 → 抛出 UnauthorizedError
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('请提供有效的认证令牌'));
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      username: string;
    };
    req.userId = decoded.userId;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('令牌已过期，请重新登录'));
      return;
    }
    next(new UnauthorizedError('无效的认证令牌'));
  }
};

import { Router } from 'express';
import { DataSource } from 'typeorm';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { changePasswordSchema, loginSchema } from '../validators/auth.validator.js';
import { createUserSchema } from '../validators/user.validator.js';

export function createAuthRouter(dataSource: DataSource): Router {
  const router = Router();
  const controller = new AuthController(dataSource);

  /** POST /api/v1/auth/login — 登录 */
  router.post('/login', validate(loginSchema), asyncHandler(controller.login));

  /** POST /api/v1/auth/register — 注册（公开，无需认证） */
  router.post('/register', validate(createUserSchema), asyncHandler(controller.register));

  /** GET /api/v1/auth/me — 获取当前用户信息 */
  router.get('/me', authenticate, asyncHandler(controller.getProfile));

  /** POST /api/v1/auth/refresh — 刷新 Token */
  router.post('/refresh', authenticate, asyncHandler(controller.refreshToken));

  /** POST /api/v1/auth/change-password — 修改密码 */
  router.post(
    '/change-password',
    authenticate,
    validate(changePasswordSchema),
    asyncHandler(controller.changePassword),
  );

  return router;
}

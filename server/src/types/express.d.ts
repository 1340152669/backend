import { User } from '../entities/user.entity.js';

declare global {
  namespace Express {
    interface Request {
      /** 由 auth.middleware 注入的当前用户（已认证） */
      user?: User;
      /** 用户 ID 快捷访问 */
      userId?: string;
    }
  }
}

export {};

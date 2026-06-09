import { z } from 'zod';
import { usernameSchema, passwordSchema } from '../utils/validation.js';

/**
 * 登录请求参数校验
 *
 * @remarks
 * - username: 2-50 个字符
 * - password: 6-100 个字符
 */
export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

/**
 * 修改密码请求参数校验
 *
 * @remarks
 * - oldPassword: 必填，不能为空
 * - newPassword: 6-100 个字符
 */
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '原密码不能为空'),
  newPassword: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

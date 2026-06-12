import { z } from 'zod';
import {
  usernameSchema,
  emailSchema,
  passwordSchema,
  nicknameSchema,
  phoneSchema,
  uuidSchema,
} from '../utils/validation.js';

/** departmentId 可选，允许 UUID、null 或空字符串（清空部门） */
const departmentIdSchema = uuidSchema.nullable().or(z.literal('')).optional();

/** 创建用户校验 */
export const createUserSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  nickname: nicknameSchema.optional(),
  // 手机号，选填，中国大陆手机号格式
  phone: phoneSchema.optional(),
  roleIds: z.array(uuidSchema).optional(),
  // 所属部门 ID，选填
  departmentId: departmentIdSchema,
});

/** 更新用户校验 */
export const updateUserSchema = z.object({
  email: emailSchema.optional(),
  nickname: nicknameSchema.optional(),
  // 手机号，选填，中国大陆手机号格式
  phone: phoneSchema.optional(),
  status: z.union([z.literal(0), z.literal(1)]).optional(),
  // 所属部门 ID，选填（传 null 或空字符串表示清空部门）
  departmentId: departmentIdSchema,
});

/** 更新用户状态校验 */
export const updateUserStatusSchema = z.object({
  status: z.union([z.literal(0), z.literal(1)]),
});

/** 分配角色校验 */
export const assignRolesSchema = z.object({
  roleIds: z
    .array(z.string().uuid('角色ID格式不正确'))
    .min(1, '至少分配一个角色'),
});

/** 重置密码校验 */
export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRolesInput = z.infer<typeof assignRolesSchema>;

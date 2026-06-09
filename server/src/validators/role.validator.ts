import { z } from 'zod';

/** 创建角色校验 */
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(2, '角色名称至少2个字符')
    .max(50, '角色名称最多50个字符')
    .regex(/^[a-z_]+$/, '角色名称只能包含小写字母和下划线'),
  label: z
    .string()
    .min(2, '显示名至少2个字符')
    .max(100),
  description: z.string().max(200).optional(),
  status: z.union([z.literal(0), z.literal(1)]).optional(),
});

/** 更新角色校验 */
export const updateRoleSchema = z.object({
  label: z.string().min(2).max(100).optional(),
  description: z.string().max(200).optional(),
  status: z.union([z.literal(0), z.literal(1)]).optional(),
});

/** 更新角色状态校验（patch 端点专用） */
export const updateRoleStatusSchema = z.object({
  status: z.union([z.literal(0), z.literal(1)]),
});

/** 绑定权限校验 */
export const assignPermissionsSchema = z.object({
  permissionIds: z
    .array(z.string().uuid('权限ID格式不正确'))
    .min(1, '至少分配一个权限'),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

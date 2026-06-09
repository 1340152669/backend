import { z } from 'zod';

/** 创建部门校验 */
export const createDepartmentSchema = z.object({
    name: z
        .string()
        .min(1, '部门名称不能为空')
        .max(100, '部门名称最多100个字符'),
    sort: z.number().int().min(0).max(9999).optional(),
    status: z.union([z.literal(0), z.literal(1)]).optional(),
    parentId: z.string().uuid().nullable().optional(),
});

/** 更新部门校验 */
export const updateDepartmentSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    sort: z.number().int().min(0).max(9999).optional(),
    status: z.union([z.literal(0), z.literal(1)]).optional(),
    parentId: z.string().uuid().nullable().optional(),
});

/** 更新部门状态校验 */
export const updateDepartmentStatusSchema = z.object({
    status: z.union([z.literal(0), z.literal(1)]),
});

/** 分配部门用户校验 */
export const assignDepartmentUsersSchema = z.object({
    userIds: z
        .array(z.string().uuid('用户ID格式不正确'))
        .min(1, '至少分配一个用户'),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type AssignDepartmentUsersInput = z.infer<typeof assignDepartmentUsersSchema>;

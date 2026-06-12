import { z } from 'zod'

/** 手机号校验 */
export const phoneSchema = z
  .string()
  .min(1, '联系方式不能为空')
  .regex(/^1[3-9]\d{9}$/, '手机号格式不正确，请输入11位中国大陆手机号')

/** 部门名称 */
export const deptNameSchema = z
  .string()
  .min(1, '部门名称不能为空')
  .max(100, '部门名称最多100个字符')

/** 负责人 */
export const leaderSchema = z
  .string()
  .min(1, '部门负责人不能为空')
  .max(50, '负责人最多50个字符')

/** 用户名 */
export const usernameSchema = z
  .string()
  .min(2, '用户名至少2个字符')
  .max(50, '用户名最多50个字符')

/** 邮箱 */
export const emailSchema = z
  .string()
  .min(1, '邮箱不能为空')
  .email('邮箱格式不正确')
  .max(100)

/** 密码 */
export const passwordSchema = z
  .string()
  .min(6, '密码至少6个字符')
  .max(100, '密码最多100个字符')

/** 角色标识 */
export const roleNameSchema = z
  .string()
  .min(1, '角色标识不能为空')
  .max(50)
  .regex(/^[a-z_]+$/, '仅支持小写字母和下划线')

/** 角色名称 */
export const roleLabelSchema = z
  .string()
  .min(1, '角色名称不能为空')
  .max(50, '角色名称最多50个字符')

/** 权限名称 */
export const permissionLabelSchema = z
  .string()
  .min(1, '权限名称不能为空')
  .max(50, '权限名称最多50个字符')

/** 部门表单校验 */
export const departmentFormSchema = z.object({
  name: deptNameSchema,
  leader: leaderSchema,
  contact: phoneSchema,
  sort: z.number().int().min(0).max(9999),
  status: z.union([z.literal(0), z.literal(1)]),
  parentId: z.string().nullable(),
})

/** 用户创建表单校验 */
export const userCreateFormSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  nickname: z.string().max(50).optional(),
  phone: phoneSchema.optional().or(z.literal('')),
})

/** 用户编辑表单校验 */
export const userEditFormSchema = z.object({
  email: emailSchema,
  nickname: z.string().max(50).optional(),
  phone: phoneSchema.optional().or(z.literal('')),
})

/** 角色表单校验 */
export const roleFormSchema = z.object({
  name: roleNameSchema,
  label: roleLabelSchema,
  description: z.string().max(200).optional(),
  status: z.union([z.literal(0), z.literal(1)]),
})

/** 权限表单校验 */
export const permissionFormSchema = z.object({
  label: permissionLabelSchema,
  code: z.string().optional(),
  menuType: z.enum(['directory', 'menu', 'button']),
  sort: z.number().int().min(0).max(9999),
  status: z.number(),
  parentId: z.string().nullable().optional(),
  description: z.string().max(200).optional(),
  icon: z.string().optional(),
  path: z.string().optional(),
  routeName: z.string().optional(),
  componentPath: z.string().optional(),
  routeParams: z.string().optional(),
  isCache: z.boolean().optional(),
  isShow: z.boolean().optional(),
  isExternalLink: z.boolean().optional(),
})

export type DepartmentFormData = z.infer<typeof departmentFormSchema>
export type UserCreateFormData = z.infer<typeof userCreateFormSchema>
export type UserEditFormData = z.infer<typeof userEditFormSchema>
export type RoleFormData = z.infer<typeof roleFormSchema>
export type PermissionFormData = z.infer<typeof permissionFormSchema>

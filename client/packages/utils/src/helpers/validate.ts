/**
 * 通用校验工具函数
 *
 * 提供常见格式校验，不绑定具体业务逻辑。
 * 同时提供基于 Zod 的 Schema 校验工厂，方便创建可复用的校验器。
 */
import { z } from 'zod'
import type { ZodIssue } from 'zod'

// 邮箱正则：基本格式校验（兼容 Zod .email() 的双重校验）
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// 角色标识正则：仅允许小写字母和下划线
const ROLE_NAME_RE = /^[a-z_]+$/

/** Zod 邮箱 Schema（同时使用 Zod .email() 和正则双重校验） */
export const emailSchema = z.string().email().regex(EMAIL_RE)

/**
 * Zod 角色标识 Schema
 *
 * @remarks
 * 限制：仅小写字母和下划线，长度 2~32 位。
 */
export const roleNameSchema = z
    .string()
    .regex(ROLE_NAME_RE, '角色标识仅允许小写字母和下划线')
    .min(2)
    .max(32)

/**
 * 校验邮箱格式
 * @param email 邮箱地址
 * @returns 是否合法
 *
 * @example
 * isValidEmail('user@example.com')  // true
 * isValidEmail('invalid')           // false
 */
export function isValidEmail(email: string): boolean {
    return EMAIL_RE.test(email)
}

/**
 * 校验角色标识格式（仅小写字母和下划线）
 * @param name 角色标识
 * @returns 是否合法
 *
 * @example
 * isValidRoleName('editor')     // true
 * isValidRoleName('Editor')     // false
 */
export function isValidRoleName(name: string): boolean {
    return ROLE_NAME_RE.test(name)
}

/**
 * 创建基于 Zod Schema 的校验函数
 *
 * 将 Zod Schema 包装为通用的校验器，校验失败时返回错误信息数组。
 * 适用于表单校验、API 参数校验等需要统一错误反馈的场景。
 *
 * @param schema Zod Schema
 * @returns `(value: unknown) => { success: boolean; errors: string[] }`
 *
 * @example
 * const validateEmail = createSchemaValidator(emailSchema)
 * validateEmail('bad') // { success: false, errors: ['Invalid email'] }
 * validateEmail('a@b.com') // { success: true, errors: [] }
 */
export function createSchemaValidator<T>(schema: z.ZodType<T>) {
    return (value: unknown): { success: boolean; errors: string[] } => {
        const result = schema.safeParse(value)
        if (result.success) {
            return { success: true, errors: [] }
        }
        return {
            success: false,
            errors: result.error.issues.map(
                (issue: ZodIssue) => `${issue.path.join('.')}: ${issue.message}`,
            ),
        }
    }
}

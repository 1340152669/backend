/**
 * API 响应校验工具
 *
 * 职责：
 * - 基于 Zod 校验 API 响应结构与预期 Schema 一致
 * - 在所有模式下执行校验，运行时暴露后端 API 契约偏离
 * - 校验失败时不阻断流程，输出警告便于排查
 *
 * 用法：
 * ```ts
 * import { z } from 'zod'
 * import { validateResponse } from '@rbac/requests'
 *
 * const UserSchema = z.object({ id: z.number(), name: z.string() })
 * const res = await http.get('/users')
 * validateResponse('GET /users', UserSchema, res.data.data)
 * ```
 */
import type { z } from 'zod'

/**
 * 校验运行时数据与预期 Zod Schema 一致
 *
 * @param label - 校验标签（用于警告信息定位，如 "GET /users"）
 * @param schema - Zod Schema
 * @param data - 待校验的运行时数据
 * @typeParam T - Schema 推导的类型
 * @returns type guard，数据符合预期时返回 true
 *
 * @example
 * const UserSchema = z.object({ id: z.number(), name: z.string() })
 * const res = await http.get('/users')
 * validateResponse('GET /users', UserSchema, res.data.data)
 *
 * @remarks
 * 校验失败时仅 console.warn，不 throw，避免阻断业务逻辑。
 * 适用于在开发阶段暴露后端 API 契约偏离。
 */
export function validateResponse<T>(
    label: string,
    schema: z.ZodType<T>,
    data: unknown,
): data is T {
    const result = schema.safeParse(data)
    if (!result.success) {
        console.warn(
            `[API 响应校验] ${label} 结构与预期不符：`,
            result.error.issues,
            '原始数据：',
            data,
        )
        return false
    }
    return true
}

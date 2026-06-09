/**
 * Zod 运行时校验组合函数
 *
 * 职责：
 * - 在所有模式下校验组件 Props
 * - 提供清晰的校验错误提示
 * - 不阻断渲染（仅 console.warn）
 *
 * 用法：
 * ```ts
 * const statusSchema = z.union([z.literal(0), z.literal(1)])
 * const props = defineProps<{ status: number }>()
 * usePropValidation('AppStatusTag', z.object({ status: statusSchema }), props)
 * ```
 */
import type { z } from 'zod'

/** 在所有模式下对组件 props 做 Zod 运行时校验 */
export function usePropValidation<T>(
    componentName: string,
    schema: z.ZodType<T>,
    props: T,
): void {
    const result = schema.safeParse(props)
    if (!result.success) {
        console.warn(
            `[${componentName}] Prop 校验失败，请检查传入值：`,
            result.error.issues,
        )
    }
}

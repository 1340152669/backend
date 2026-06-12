import { useState, useCallback, useRef } from 'react'
import type { ZodSchema, ZodIssue } from 'zod'

interface FieldError {
  path: string
  message: string
}

/**
 * 基于 zod 的表单实时校验 hook
 *
 * @remarks
 * - 设计原理：每次字段变更时对整体 schema 做 safeParse，提取错误按 path 索引，
 *   实现逐字段实时错误提示，无需等到提交时才校验
 * - 校验为同步操作（zod safeParse 极快），不会阻塞 UI 渲染
 *
 * @example
 * const { errors, validate, validateField } = useZodForm(schema)
 * // 全部校验
 * validate(formData)
 * // 单字段变更后实时校验
 * <Input onChange={e => { updateField(); validateField('name', { ...formData, name: e.target.value }) }} />
 * {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
 */
export function useZodForm<T extends Record<string, unknown>>(schema: ZodSchema<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const schemaRef = useRef(schema)
  schemaRef.current = schema

  /** 校验整个表单，返回是否通过 */
  const validate = useCallback((data: T): data is T => {
    const result = schemaRef.current.safeParse(data)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }, [])

  /** 校验单个字段，更新该字段的错误状态 */
  const validateField = useCallback((field: keyof T, data: T) => {
    const result = schemaRef.current.safeParse(data)
    if (!result.success) {
      const fieldIssue = result.error.issues.find(
        (issue: ZodIssue) => issue.path[0] === field,
      )
      setErrors(prev => {
        const next = { ...prev }
        if (fieldIssue) {
          next[field as string] = fieldIssue.message
        } else {
          delete next[field as string]
        }
        return next
      })
    } else {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field as string]
        return next
      })
    }
  }, [])

  /** 清除所有错误 */
  const clearErrors = useCallback(() => setErrors({}), [])

  return { errors, validate, validateField, clearErrors }
}

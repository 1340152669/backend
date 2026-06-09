/**
 * 日期格式化工具
 *
 * @param dateStr - ISO 日期字符串
 * @param options - 可选的 Intl 格式化参数，默认输出 zh-CN 短格式
 * @returns 格式化后的日期字符串（如 '2024/01/15'），无效输入返回 '-'
 *
 * @example
 * formatDate('2024-01-15T08:00:00Z')          // '2024/01/15'
 * formatDate('2024-01-15', { dateStyle: 'full' })  // '2024年1月15日星期一'
 * formatDate('')                                // '-'
 *
 * @remarks
 * 纯函数，无副作用。无效输入（空字符串/非法日期）返回 '-' 而不抛异常。
 */
export function formatDate(
    dateStr: string,
    options?: Intl.DateTimeFormatOptions,
): string {
    if (!dateStr) return '-'
    try {
        return new Date(dateStr).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            ...options,
        })
    } catch {
        return '-'
    }
}

/**
 * 日期时间格式化工具（含时分秒）
 *
 * @param dateStr - ISO 日期字符串
 * @returns 格式化后的日期时间字符串（如 '2024/01/15 14:30:00'），无效输入返回 '-'
 *
 * @example
 * formatDateTime('2024-01-15T06:30:00Z')    // '2024/01/15 14:30:00'
 * formatDateTime('')                        // '-'
 *
 * @remarks
 * 使用 toLocaleString 而非 toLocaleDateString，输出包含时分秒。
 */
export function formatDateTime(dateStr: string): string {
    if (!dateStr) return '-'
    try {
        return new Date(dateStr).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        })
    } catch {
        return '-'
    }
}

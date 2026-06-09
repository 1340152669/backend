/**
 * 日期格式化工具函数，与 @rbac/utils 的 formatDate/formatDateTime 行为一致
 *
 * @param dateStr - ISO 日期字符串
 * @returns 格式化后的日期字符串，无效输入返回 '-'
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    })
  } catch { return '-' }
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    })
  } catch { return '-' }
}

/**
 * IconPicker - 带分页的图标选择器组件
 *
 * @remarks
 * - 设计原理：权限管理中选择图标时，图标数量多（100+）需分页展示。
 *   用网格布局 + 页码控制代替滚动条，提升选择效率。
 * - 依赖：依赖 ICON_MAP（lucide-react 图标注册表）和 ICON_NAMES 数组。
 * - 数据流：受控组件，接收 value（当前选中图标名称）和 onChange 回调。
 *
 * @param value - 当前选中的图标名称，空字符串表示未选择
 * @param onChange - 选中/清空图标时的回调，value 为空字符串表示清空
 * @param pageSize - 每页展示图标数量，默认 24
 *
 * @example
 * <IconPicker value={form.icon} onChange={v => updateField('icon', v)} />
 */
import { useState, useMemo } from 'react'
import { ICON_MAP, ICON_NAMES } from '@/lib/iconMap'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'

interface IconPickerProps {
  /** 当前选中的图标名称（空字符串表示未选择） */
  value?: string | null
  /** 选中/清空图标时的回调 */
  onChange: (value: string) => void
  /** 每页展示图标数量，默认 24 */
  pageSize?: number
}

// 每页图标数量常量（6列×4行）
const DEFAULT_PAGE_SIZE = 24

export default function IconPicker({ value, onChange, pageSize = DEFAULT_PAGE_SIZE }: IconPickerProps) {
  // 分页状态
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(ICON_NAMES.length / pageSize)

  // 当前页的图标名称列表
  const currentPageIcons = useMemo(() => {
    const start = (page - 1) * pageSize
    return ICON_NAMES.slice(start, start + pageSize)
  }, [page, pageSize])

  // 原因：当页数超出总页数时（如筛选后总页数减少），自动回退到末页
  if (page > totalPages && totalPages > 0) {
    setPage(totalPages)
  }

  return (
    <div className="space-y-3">
      {/* 区域：图标网格；设计：flex wrap 布局，每个图标等高等宽，选中态用 accent 色高亮 */}
      <div className="flex flex-wrap gap-1.5 p-3 border rounded-md min-h-[148px]">
        {/* "无图标"清除按钮 */}
        <button
          type="button"
          className={`flex items-center justify-center w-9 h-9 rounded-md border-2 transition-all text-muted-foreground hover:text-destructive hover:border-destructive ${
            !value ? 'border-destructive text-destructive bg-destructive/10' : 'border-transparent'
          }`}
          title="无图标"
          onClick={() => onChange('')}
        >
          <span className="text-xs font-bold">✕</span>
        </button>

        {/* 图标按钮网格 */}
        {currentPageIcons.map(name => {
          const Icon: LucideIcon = ICON_MAP[name]
          const isSelected = value === name
          return (
            <button
              key={name}
              type="button"
              className={`flex items-center justify-center w-9 h-9 rounded-md border-2 transition-all text-muted-foreground hover:text-accent hover:border-accent ${
                isSelected ? 'border-accent text-accent bg-accent/10' : 'border-transparent'
              }`}
              title={name}
              onClick={() => onChange(name)}
            >
              <Icon className="w-4 h-4" />
            </button>
          )
        })}
      </div>

      {/* 区域：分页控制；设计：紧凑显示页码和上下翻页，仅当多页时可见 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {ICON_NAMES.length} 个图标
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              上一页
            </Button>

            {/* 页码按钮；设计：只展示前后共 7 个页码，超出用省略号 */}
            {generatePageNumbers(page, totalPages).map((item, idx) =>
              item === 'dots' ? (
                <span key={`dots-${idx}`} className="px-1">…</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`w-7 h-7 rounded text-xs transition-colors ${
                    page === item
                      ? 'bg-accent text-accent-foreground font-medium'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setPage(item as number)}
                >
                  {item}
                </button>
              )
            )}

            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 生成页码数组：始终包含首尾页，中间最多展示 7 个可点击页码
 *
 * @param currentPage - 当前页码
 * @param totalPages - 总页数
 * @returns (number | 'dots')[] - 页码数组，'dots' 表示省略号
 */
function generatePageNumbers(currentPage: number, totalPages: number): (number | 'dots')[] {
  if (totalPages <= 7) {
    // 总页数少时直接展示全部页码
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: (number | 'dots')[] = [1]

  // 计算中间页码范围
  let rangeStart = Math.max(2, currentPage - 2)
  let rangeEnd = Math.min(totalPages - 1, currentPage + 2)

  // 调整范围以始终显示至少 5 个中间页码
  if (rangeEnd - rangeStart < 4) {
    if (currentPage < totalPages / 2) {
      rangeEnd = Math.min(rangeStart + 4, totalPages - 1)
    } else {
      rangeStart = Math.max(rangeEnd - 4, 2)
    }
  }

  // 左侧省略号
  if (rangeStart > 2) pages.push('dots')

  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i)
  }

  // 右侧省略号
  if (rangeEnd < totalPages - 1) pages.push('dots')

  pages.push(totalPages)
  return pages
}

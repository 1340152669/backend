import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { Permission } from '@/types'

type CheckState = boolean | 'indeterminate'

interface PermissionTreeSelectProps {
  permissions: Permission[]
  value: string[]
  onChange: (value: string[]) => void
  className?: string
}

function collectPermissionIds(permission: Permission): string[] {
  return [
    permission.id,
    ...(permission.children?.flatMap(collectPermissionIds) ?? []),
  ]
}

function normalizeSelection(ids: string[], permissions: Permission[]) {
  const next = new Set(ids)

  function syncParentState(permission: Permission): boolean {
    const children = permission.children ?? []
    if (children.length === 0) return next.has(permission.id)

    const allChildrenChecked = children.map(syncParentState).every(Boolean)
    if (allChildrenChecked) next.add(permission.id)
    else next.delete(permission.id)

    return allChildrenChecked
  }

  permissions.forEach(syncParentState)
  return Array.from(next)
}

function getCheckState(permission: Permission, selectedIds: Set<string>): CheckState {
  const children = permission.children ?? []
  if (children.length === 0) return selectedIds.has(permission.id)

  const descendantIds = children.flatMap(collectPermissionIds)
  const checkedCount = descendantIds.filter(id => selectedIds.has(id)).length
  if (checkedCount === 0) return false
  if (checkedCount === descendantIds.length) return true
  return 'indeterminate'
}

export function PermissionTreeSelect({ permissions, value, onChange, className }: PermissionTreeSelectProps) {
  const selectedIds = new Set(value)

  const togglePermission = (permission: Permission, checked: CheckState) => {
    const next = new Set(value)
    const permissionIds = collectPermissionIds(permission)

    if (checked) permissionIds.forEach(id => next.add(id))
    else permissionIds.forEach(id => next.delete(id))

    onChange(normalizeSelection(Array.from(next), permissions))
  }

  const renderTree = (items: Permission[], depth = 0) => items.map(permission => (
    <div key={permission.id}>
      <div
        className="flex items-center gap-2 rounded-sm py-1.5 pr-2 hover:bg-muted/60"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <Checkbox
          checked={getCheckState(permission, selectedIds)}
          onCheckedChange={checked => togglePermission(permission, checked)}
        />
        <span className="text-sm">{permission.label}</span>
        <span className="truncate text-xs text-muted-foreground">({permission.code})</span>
      </div>
      {permission.children && renderTree(permission.children, depth + 1)}
    </div>
  ))

  return (
    <div className={cn('h-72 overflow-y-auto rounded-md border bg-background p-2', className)}>
      {permissions.length > 0 ? renderTree(permissions) : (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          暂无权限数据
        </div>
      )}
    </div>
  )
}

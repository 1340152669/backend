import { useEffect, useState, useCallback } from 'react'
import { usePermissionStore } from '@/stores/permission'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from '@/components/ui/use-toast'
import { Permissions } from '@/lib/permissions'
import { useZodForm } from '@/hooks/useZodForm'
import { permissionFormSchema } from '@/lib/validators'
import type { Permission, MenuType } from '@/types'
import type { PermissionFormData } from '@/lib/validators'

const MAX_TREE_DEPTH = 20
const SORTABLE_FIELDS = ['code', 'label', 'menuType', 'sort', 'path', 'status', 'isShow'] as const

const MENU_TYPE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' }> = {
  directory: { label: '目录', variant: 'secondary' },
  menu: { label: '权限', variant: 'default' },
  button: { label: '按钮', variant: 'warning' },
}

// 预设图标列表
const ICONS = [
  'app', 'dashboard', 'user', 'users', 'setting', 'folder', 'file', 'chart',
  'message', 'bell', 'calendar', 'shield', 'home', 'database', 'code', 'map',
  'image', 'tool', 'key', 'star', 'lock', 'mail', 'clock', 'book', 'flag',
]

/** 递归展平权限树为上级选择器选项 */
function flattenParentOptions(nodes: Permission[], depth = 0): Array<{ id: string | null; label: string }> {
  const options: Array<{ id: string | null; label: string }> = [{ id: null, label: '顶级权限' }]
  const walk = (list: Permission[], d: number) => {
    for (const n of list) {
      options.push({ id: n.id, label: '　'.repeat(d) + n.label })
      if (n.children?.length) walk(n.children, d + 1)
    }
  }
  walk(nodes, depth)
  return options
}

export default function PermissionViewPage() {
  const tree = usePermissionStore(state => state.tree)
  const fetchTree = usePermissionStore(state => state.fetchTree)
  const addPermission = usePermissionStore(state => state.addPermission)
  const editPermission = usePermissionStore(state => state.editPermission)
  const removePermission = usePermissionStore(state => state.removePermission)
  const hasPermission = useAuthStore(state => state.hasPermission)
  const fetchUserProfile = useAuthStore(state => state.fetchUserProfile)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [formOpen, setFormOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editingPerm, setEditingPerm] = useState<Partial<Permission> | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [sortBy, setSortBy] = useState('sort')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC')
  const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [form, setForm] = useState<PermissionFormData>({
    code: '', label: '', description: '', menuType: 'directory',
    icon: '', sort: 0, isExternalLink: false, path: '',
    routeName: '', componentPath: '', routeParams: '', isCache: true, isShow: true, status: 1, parentId: null,
  })
  const { errors, validate, validateField, clearErrors } = useZodForm(permissionFormSchema)

  const parentOptions = flattenParentOptions(tree)

  const fetchData = useCallback(() => { fetchTree({ sortBy, sortOrder }) }, [sortBy, sortOrder, fetchTree])
  useEffect(() => { fetchData() }, [fetchData])

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')
    else { setSortBy(field); setSortOrder('ASC') }
    setExpandedIds(new Set())
  }

  const toggleExpand = (id: string) => { const next = new Set(expandedIds); next.has(id) ? next.delete(id) : next.add(id); setExpandedIds(next) }

  const flattenTree = (nodes: Permission[], depth = 0, visited = new Set<string>()): Array<Permission & { depth: number; hasChildren: boolean }> => {
    if (depth > MAX_TREE_DEPTH) return []
    const result: Array<Permission & { depth: number; hasChildren: boolean }> = []
    for (const node of nodes) {
      if (visited.has(node.id)) continue
      visited.add(node.id)
      const hasChildren = !!node.children?.length
      result.push({ ...node, depth, hasChildren })
      if (hasChildren && expandedIds.has(node.id)) result.push(...flattenTree(node.children!, depth + 1, visited))
    }
    return result
  }

  const flatTree = flattenTree(tree)

  const resetForm = () => setForm({ code: '', label: '', description: '', menuType: 'directory', icon: '', sort: 0, isExternalLink: false, path: '', routeName: '', componentPath: '', routeParams: '', isCache: true, isShow: true, status: 1, parentId: null })

  /** 更新单个字段并实时校验 */
  const updateField = useCallback(<K extends keyof PermissionFormData>(key: K, value: PermissionFormData[K]) => {
    setForm(prev => { const next = { ...prev, [key]: value }; validateField(key, next); return next })
  }, [validateField])

  const openCreate = (parent?: Permission) => { setIsEdit(false); setEditingPerm(null); resetForm(); clearErrors(); if (parent) setForm(prev => ({ ...prev, parentId: parent.id })); setFormOpen(true) }
  const openEdit = (perm: Permission) => { setIsEdit(true); setEditingPerm(perm); setForm({ code: perm.code || '', label: perm.label || '', description: perm.description || '', menuType: perm.menuType || 'menu', icon: perm.icon || '', sort: perm.sort ?? 0, isExternalLink: perm.isExternalLink ?? false, path: perm.path || '', routeName: perm.routeName || '', componentPath: perm.componentPath || '', routeParams: perm.routeParams || '', isCache: perm.isCache ?? true, isShow: perm.isShow ?? true, status: perm.status ?? 1, parentId: perm.parentId || null }); clearErrors(); setFormOpen(true) }

  const handleSubmit = async () => {
    if (!validate(form)) return
    setSubmitting(true)
    const payload: Record<string, unknown> = { label: form.label, menuType: form.menuType, sort: form.sort, isShow: form.isShow, status: form.status, description: form.description || undefined, parentId: form.parentId || undefined, icon: form.icon || undefined, isExternalLink: form.isExternalLink }
    if (form.menuType !== 'button') { payload.path = form.path || undefined }
    if (form.menuType === 'menu') { payload.code = form.code; payload.routeName = form.routeName || undefined; payload.componentPath = form.componentPath || undefined; payload.routeParams = form.routeParams || undefined; payload.isCache = form.isCache }
    if (form.menuType === 'button') { payload.code = form.code }
    try {
      if (isEdit && editingPerm?.id) await editPermission(editingPerm.id, payload)
      else await addPermission(payload as any)
      setFormOpen(false); await fetchUserProfile()
    } catch { /* handled in interceptor */ }
    finally { setSubmitting(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await removePermission(deleteTarget.id); setDeleteOpen(false); setDeleteTarget(null); await fetchUserProfile() }
    catch { /* handled in interceptor */ }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">权限管理</h2>
        {hasPermission(Permissions.PermissionCreate) && <Button onClick={() => openCreate()}>创建权限</Button>}
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {['权限名称', '类型', '权限字符', '排序', '路由地址', '组件路径', '状态', '操作'].map((title, i) => (
                <th key={i} className="h-10 px-2 text-left align-middle font-medium text-muted-foreground whitespace-nowrap cursor-pointer hover:text-accent"
                  onClick={() => SORTABLE_FIELDS.includes(title === '权限名称' ? 'label' : title === '类型' ? 'menuType' : title === '权限字符' ? 'code' : title === '排序' ? 'sort' : title === '路由地址' ? 'path' : title === '状态' ? 'status' : '' as any) && toggleSort(title === '权限名称' ? 'label' : title === '类型' ? 'menuType' : title === '权限字符' ? 'code' : title === '排序' ? 'sort' : title === '路由地址' ? 'path' : title === '状态' ? 'status' : '')}>
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flatTree.map((node) => (
              <tr key={node.id} className="border-b hover:bg-muted/50">
                <td className="p-2" style={{ paddingLeft: `${16 + (node as any).depth * 24}px` }}>
                  <div className="flex items-center gap-1">
                    {(node as any).hasChildren && <button className="text-xs text-muted-foreground w-4" onClick={() => toggleExpand(node.id)}>{expandedIds.has(node.id) ? '▼' : '▶'}</button>}
                    {(node as any).hasChildren ? null : <span className="w-4" />}
                    <span className="font-medium">{node.label}</span>
                  </div>
                </td>
                <td className="p-2"><Badge variant={MENU_TYPE_LABELS[node.menuType]?.variant || 'outline'} className="text-xs">{MENU_TYPE_LABELS[node.menuType]?.label || node.menuType}</Badge></td>
                <td className="p-2"><code className="text-xs bg-muted px-1 rounded">{node.code || '—'}</code></td>
                <td className="p-2 text-muted-foreground">{node.sort}</td>
                <td className="p-2"><code className="text-xs text-muted-foreground">{node.path || '—'}</code></td>
                <td className="p-2"><code className="text-xs text-muted-foreground">{node.componentPath || '—'}</code></td>
                <td className="p-2"><Badge variant={node.status === 1 ? 'success' : 'warning'}>{node.status === 1 ? '正常' : '停用'}</Badge></td>
                <td className="p-2">
                  <div className="flex gap-1">
                    {hasPermission(Permissions.PermissionCreate) && <Button variant="outline" size="sm" onClick={() => openCreate(node)}>添加子级</Button>}
                    {hasPermission(Permissions.PermissionUpdate) && <Button variant="outline" size="sm" onClick={() => openEdit(node)}>编辑</Button>}
                    {hasPermission(Permissions.PermissionDelete) && <Button variant="destructive" size="sm" onClick={() => { setDeleteTarget(node); setDeleteOpen(true) }}>删除</Button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 区域：创建/编辑权限弹窗；设计：两列布局将上级权限/类型同排，图标选择区占整行，减少弹窗高度 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isEdit ? '编辑权限' : '创建权限'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-2">
            {/* 上级权限 */}
            <div className="space-y-2">
              <Label>上级权限</Label>
              <Select value={form.parentId || '__root__'} onValueChange={v => updateField('parentId', v === '__root__' ? null : v)}>
                <SelectTrigger><SelectValue placeholder="顶级权限" /></SelectTrigger>
                <SelectContent>
                  {parentOptions.map(opt => (
                    <SelectItem key={opt.id ?? '__root__'} value={opt.id ?? '__root__'}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 权限类型 */}
            <div className="space-y-2">
              <Label>权限类型</Label>
              <Select value={form.menuType} onValueChange={v => updateField('menuType', v as MenuType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="directory">目录</SelectItem>
                  <SelectItem value="menu">菜单</SelectItem>
                  <SelectItem value="button">按钮</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 目录 & 菜单 共享字段 */}
            {(form.menuType === 'directory' || form.menuType === 'menu') && (
              <>
                {/* 权限图标选择器 - 独占一行 */}
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <Label>权限图标</Label>
                  <div className="grid grid-cols-8 gap-1.5 p-3 border rounded-md max-h-36 overflow-y-auto">
                    {ICONS.map(name => (
                      <button key={name} type="button"
                        className={`flex items-center justify-center w-9 h-9 rounded-md border-2 transition-all text-muted-foreground hover:text-accent hover:border-accent ${form.icon === name ? 'border-accent text-accent bg-accent/10' : 'border-transparent'}`}
                        title={name} onClick={() => updateField('icon', name)}>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d={ICON_PATHS[name as keyof typeof ICON_PATHS] || ''} />
                        </svg>
                      </button>
                    ))}
                    <button type="button"
                      className={`flex items-center justify-center w-9 h-9 rounded-md border-2 transition-all text-muted-foreground hover:text-accent hover:border-accent ${!form.icon ? 'border-accent text-accent bg-accent/10' : 'border-transparent'}`}
                      title="无图标" onClick={() => updateField('icon', '')}>
                      <span className="text-xs font-bold">✕</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>显示排序</Label>
                  <Input type="number" value={form.sort} onChange={e => updateField('sort', Number(e.target.value) || 0)} min={0} max={9999} />
                </div>
                <div className="space-y-2">
                  <Label>权限名称 <span className="text-destructive">*</span></Label>
                  <Input value={form.label} onChange={e => updateField('label', e.target.value)} placeholder="请输入权限名称" />
                  {errors.label && <p className="text-xs text-destructive">{errors.label}</p>}
                </div>
                <div className="space-y-2">
                  <Label>是否外链</Label>
                  <Select value={String(form.isExternalLink)} onValueChange={v => updateField('isExternalLink', v === 'true')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="false">否</SelectItem><SelectItem value="true">是</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>路由地址</Label>
                  <Input value={form.path} onChange={e => updateField('path', e.target.value)} placeholder="如 /users" />
                </div>
              </>
            )}

            {/* 按钮 特有字段 */}
            {form.menuType === 'button' && (
              <>
                <div className="space-y-2">
                  <Label>显示排序</Label>
                  <Input type="number" value={form.sort} onChange={e => updateField('sort', Number(e.target.value) || 0)} min={0} max={9999} />
                </div>
                <div className="space-y-2">
                  <Label>权限名称 <span className="text-destructive">*</span></Label>
                  <Input value={form.label} onChange={e => updateField('label', e.target.value)} placeholder="请输入权限名称" />
                  {errors.label && <p className="text-xs text-destructive">{errors.label}</p>}
                </div>
                <div className="space-y-2">
                  <Label>权限字符 <span className="text-destructive">*</span></Label>
                  <Input value={form.code} onChange={e => updateField('code', e.target.value)} placeholder="如 system:user:read" />
                </div>
              </>
            )}

            {/* 仅菜单 特有字段 */}
            {form.menuType === 'menu' && (
              <>
                <div className="space-y-2">
                  <Label>路由名称</Label>
                  <Input value={form.routeName} onChange={e => updateField('routeName', e.target.value)} placeholder="路由的 name 属性" />
                </div>
                <div className="space-y-2">
                  <Label>权限字符</Label>
                  <Input value={form.code} onChange={e => updateField('code', e.target.value)} placeholder="如 system:user" />
                </div>
                <div className="space-y-2">
                  <Label>组件路径</Label>
                  <Input value={form.componentPath} onChange={e => updateField('componentPath', e.target.value)} placeholder="@/views/system/user/UserListView.vue" />
                </div>
                <div className="space-y-2">
                  <Label>路由参数</Label>
                  <Input value={form.routeParams} onChange={e => updateField('routeParams', e.target.value)} placeholder="JSON 格式参数，选填" />
                </div>
                <div className="space-y-2">
                  <Label>是否缓存</Label>
                  <Select value={String(form.isCache)} onValueChange={v => updateField('isCache', v === 'true')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="true">缓存</SelectItem><SelectItem value="false">不缓存</SelectItem></SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* 显示状态（目录和权限） */}
            {form.menuType !== 'button' && (
              <div className="space-y-2">
                <Label>显示状态</Label>
                <Select value={String(form.isShow)} onValueChange={v => updateField('isShow', v === 'true')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="true">显示</SelectItem><SelectItem value="false">隐藏</SelectItem></SelectContent>
                </Select>
              </div>
            )}

            {/* 权限状态（所有类型） */}
            <div className="space-y-2">
              <Label>权限状态</Label>
              <Select value={String(form.status)} onValueChange={v => updateField('status', Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">正常</SelectItem><SelectItem value="0">停用</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={submitting}>取消</Button>
            <Button onClick={handleSubmit} loading={submitting}>{isEdit ? '保存' : '创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──── 删除确认 ──── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">确定要删除权限「{deleteTarget?.label}」吗？若有子权限将一并删除。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ──── 预设图标 SVG 路径 ────
const ICON_PATHS: Record<string, string> = {
  app: 'M4 8H8V4H4V8ZM10 20H14V16H10V20ZM4 20H8V16H4V20ZM4 14H8V10H4V14ZM10 14H14V10H10V14ZM16 4V8H20V4H16ZM10 8H14V4H10V8ZM16 14H20V10H16V14ZM16 20H20V16H16V20Z',
  dashboard: 'M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z',
  user: 'M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z',
  users: 'M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16V18H15V16C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V18H23V16.5C23 14.17 18.33 13 16 13Z',
  setting: 'M19.14 12.94C19.18 12.64 19.2 12.33 19.2 12C19.2 11.68 19.18 11.36 19.14 11.06L21.16 9.48C21.34 9.34 21.39 9.07 21.28 8.87L19.36 5.55C19.24 5.33 18.99 5.26 18.77 5.33L16.38 6.29C15.88 5.91 15.35 5.59 14.76 5.35L14.4 2.81C14.36 2.57 14.16 2.4 13.91 2.4H10.09C9.84 2.4 9.64 2.57 9.6 2.81L9.24 5.35C8.65 5.59 8.12 5.91 7.62 6.29L5.23 5.33C5.02 5.26 4.77 5.33 4.64 5.55L2.72 8.87C2.6 9.08 2.65 9.34 2.84 9.48L4.86 11.06C4.82 11.36 4.8 11.69 4.8 12C4.8 12.31 4.82 12.64 4.86 12.94L2.84 14.52C2.66 14.66 2.61 14.93 2.72 15.13L4.64 18.45C4.76 18.67 5.01 18.74 5.23 18.67L7.62 17.71C8.12 18.09 8.65 18.41 9.24 18.65L9.6 21.19C9.65 21.43 9.85 21.6 10.09 21.6H13.91C14.16 21.6 14.36 21.43 14.4 21.19L14.76 18.65C15.35 18.41 15.88 18.09 16.38 17.71L18.77 18.67C18.99 18.74 19.24 18.67 19.36 18.45L21.28 15.13C21.39 14.92 21.34 14.66 21.16 14.52L19.14 12.94ZM12 15.6C10.02 15.6 8.4 13.98 8.4 12C8.4 10.02 10.02 8.4 12 8.4C13.98 8.4 15.6 10.02 15.6 12C15.6 13.98 13.98 15.6 12 15.6Z',
  folder: 'M20 6H12L10 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6Z',
  file: 'M6 2C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2H6ZM13 9V3.5L18.5 9H13Z',
  chart: 'M5 9.2H3V20H5V9.2ZM12.6 4H10.4V20H12.6V4ZM19 12H16.8V20H19V12Z',
  message: 'M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z',
  bell: 'M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z',
  calendar: 'M19 4H18V2H16V4H8V2H6V4H5C3.9 4 3 4.9 3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V10H19V20Z',
  shield: 'M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.97V12H5V6.3L12 3.19V11.99Z',
  home: 'M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z',
  database: 'M12 3C7.58 3 4 4.79 4 7V17C4 19.21 7.58 21 12 21C16.42 21 20 19.21 20 17V7C20 4.79 16.42 3 12 3ZM12 5C15.87 5 18 6.5 18 7C18 7.5 15.87 9 12 9C8.13 9 6 7.5 6 7C6 6.5 8.13 5 12 5ZM18 12C18 12.5 15.87 14 12 14C8.13 14 6 12.5 6 12V9.82C7.47 10.6 9.61 11 12 11C14.39 11 16.53 10.6 18 9.82V12ZM12 20C8.13 20 6 18.5 6 18V15.82C7.47 16.6 9.61 17 12 17C14.39 17 16.53 16.6 18 15.82V18C18 18.5 15.87 20 12 20Z',
  code: 'M9.4 16.6L4.8 12L9.4 7.4L8 6L2 12L8 18L9.4 16.6ZM14.6 16.6L19.2 12L14.6 7.4L16 6L22 12L16 18L14.6 16.6Z',
  map: 'M20.5 3L20.34 3.03L15 5.1L9 3L3.36 4.9C3.15 4.97 3 5.15 3 5.38V20.5C3 20.78 3.22 21 3.5 21L3.66 20.97L9 18.9L15 21L20.64 19.1C20.85 19.03 21 18.85 21 18.62V3.5C21 3.22 20.78 3 20.5 3ZM15 19L9 16.89V5L15 7.11V19Z',
  image: 'M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z',
  tool: 'M22.7 19L13.6 9.9C14.5 7.6 13.7 5 11.9 3.2C9.8 1.1 6.7 0.7 4.2 2.2L8.5 6.5L6.5 8.5L2.2 4.2C0.7 6.7 1.1 9.8 3.2 11.9C5 13.7 7.6 14.5 9.9 13.6L19 22.7C19.4 23.1 20.1 23.1 20.5 22.7L22.7 20.5C23.1 20.1 23.1 19.4 22.7 19Z',
  key: 'M12.65 10C11.83 7.67 9.61 6 7 6C3.69 6 1 8.69 1 12S3.69 18 7 18C9.61 18 11.83 16.33 12.65 14H17V18H21V14H23V10H12.65ZM7 14C5.9 14 5 13.1 5 12S5.9 10 7 10 9 10.9 9 12 8.1 14 7 14Z',
  star: 'M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z',
  lock: 'M18 8H17V6C17 3.24 14.76 1 12 1S7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15S10.9 13 12 13 14 13.9 14 15 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9S15.1 4.29 15.1 6V8Z',
  mail: 'M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z',
  clock: 'M11.99 2C6.47 2 2 6.48 2 12S6.47 22 11.99 22 22 17.52 22 12 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12S7.58 4 12 4 20 7.58 20 12 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z',
  book: 'M18 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C21.1 22 22 21.1 22 20V4C22 2.9 21.1 2 18 2ZM6 4H11V12L8.5 9.75L6 12V4Z',
  flag: 'M14 6L15 4H5V21H7V14H12L11 16H19V6H14Z',
}

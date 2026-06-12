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
import IconPicker from '@/components/ui/IconPicker'
import type { Permission, MenuType } from '@/types'
import type { PermissionFormData } from '@/lib/validators'

const MAX_TREE_DEPTH = 20
const SORTABLE_FIELDS = ['code', 'label', 'menuType', 'sort', 'path', 'status', 'isShow'] as const

const MENU_TYPE_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' }> = {
  directory: { label: '目录', variant: 'secondary' },
  menu: { label: '权限', variant: 'default' },
  button: { label: '按钮', variant: 'warning' },
}

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
                {/* 区域：权限图标选择器；设计：使用 lucide-react 图标库，分页展示 100+ 图标，选中高亮 */}
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <Label>权限图标</Label>
                  <IconPicker value={form.icon} onChange={v => updateField('icon', v)} />
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


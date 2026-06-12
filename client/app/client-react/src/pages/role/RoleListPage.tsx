import { useEffect, useState, useCallback } from 'react'
import { useRoleStore } from '@/stores/role'
import { usePermissionStore } from '@/stores/permission'
import { useAuthStore } from '@/stores/auth'
import { getRoleById, getRoleBoundUserCount } from '@/api/role'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Permissions } from '@/lib/permissions'
import { useZodForm } from '@/hooks/useZodForm'
import { roleFormSchema } from '@/lib/validators'
import { PermissionTreeSelect } from './PermissionTreeSelect'
import type { Role } from '@/types'
import type { RoleFormData } from '@/lib/validators'

const INIT_FORM: RoleFormData = { name: '', label: '', description: '', status: 1 }

export default function RoleListPage() {
  const roleStore = useRoleStore()
  const permStore = usePermissionStore()
  const authStore = useAuthStore()
  const [editOpen, setEditOpen] = useState(false)
  const [isCreate, setIsCreate] = useState(false)
  const [editForm, setEditForm] = useState<RoleFormData>({ ...INIT_FORM })
  const [editLoading, setEditLoading] = useState(false)
  const [editTarget, setEditTarget] = useState<Role | null>(null)
  const { errors, validate, validateField, clearErrors } = useZodForm(roleFormSchema)

  const [permOpen, setPermOpen] = useState(false)
  const [permRole, setPermRole] = useState<Role | null>(null)
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([])
  const [binding, setBinding] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)

  const [statusOpen, setStatusOpen] = useState(false)
  const [statusTarget, setStatusTarget] = useState<Role | null>(null)
  const [statusCount, setStatusCount] = useState(0)
  const [togglingStatus, setTogglingStatus] = useState(false)

  useEffect(() => { roleStore.fetchRoles(); permStore.fetchTree() }, [])

  /** 更新单个字段并实时校验 */
  const updateField = useCallback(<K extends keyof RoleFormData>(key: K, value: RoleFormData[K]) => {
    setEditForm(prev => { const next = { ...prev, [key]: value }; validateField(key, next); return next })
  }, [validateField])

  const openCreate = () => { setIsCreate(true); setEditTarget(null); setEditForm({ ...INIT_FORM }); clearErrors(); setEditOpen(true) }
  const openEdit = async (role: Role) => {
    setIsCreate(false); setEditTarget(role); setEditOpen(true); setEditLoading(true); clearErrors()
    try { const res = await getRoleById<Role>(role.id); const d = res.data.data; setEditForm({ name: d.name, label: d.label, description: d.description || '', status: d.status }) }
    finally { setEditLoading(false) }
  }
  const handleEdit = async () => {
    if (!validate(editForm)) return
    setEditLoading(true)
    try {
      if (isCreate) await roleStore.addRole({ name: editForm.name, label: editForm.label, description: editForm.description || undefined, status: editForm.status })
      else if (editTarget) await roleStore.editRole(editTarget.id, { label: editForm.label, description: editForm.description || undefined, status: editForm.status })
      setEditOpen(false); await roleStore.fetchRoles()
    } catch (err: any) { toast({ title: err?.response?.data?.message || '操作失败', variant: 'destructive' }) }
    finally { setEditLoading(false) }
  }

  const openPermModal = (role: Role) => { setPermRole(role); setSelectedPermIds(role.permissions.map(p => p.id)); setPermOpen(true) }
  const handleBindPerms = async () => {
    if (!permRole) return; setBinding(true)
    try { await roleStore.assignPermissions(permRole.id, { permissionIds: selectedPermIds }); setPermOpen(false); await Promise.all([roleStore.fetchRoles(), authStore.fetchUserProfile()]) }
    catch (err: any) { toast({ title: err?.response?.data?.message || '操作失败', variant: 'destructive' }) }
    finally { setBinding(false) }
  }

  const confirmToggleStatus = async (role: Role) => {
    setStatusTarget(role); setStatusCount(0)
    try { const res = await getRoleBoundUserCount(role.id); setStatusCount(res.data.data.count) } catch {}
    setStatusOpen(true)
  }
  const handleToggleStatus = async () => {
    if (!statusTarget) return; setTogglingStatus(true)
    try { const newStatus: 0 | 1 = statusTarget.status === 1 ? 0 : 1; await roleStore.toggleRoleStatus(statusTarget.id, newStatus); toast({ title: `角色已${newStatus === 1 ? '启用' : '禁用'}` }); setStatusOpen(false); await Promise.all([roleStore.fetchRoles(), authStore.fetchUserProfile()]) }
    catch (err: any) { toast({ title: err?.response?.data?.message || '操作失败', variant: 'destructive' }) }
    finally { setTogglingStatus(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await roleStore.removeRole(deleteTarget.id); toast({ title: '角色已删除' }); setDeleteOpen(false); setDeleteTarget(null); await roleStore.fetchRoles() }
    catch { toast({ title: '删除失败', variant: 'destructive' }) }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">角色管理</h2>
        {authStore.hasPermission(Permissions.RoleCreate) && <Button onClick={openCreate}>创建角色</Button>}
      </div>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>角色名称</TableHead><TableHead>角色标识</TableHead><TableHead>描述</TableHead><TableHead>状态</TableHead><TableHead>权限数</TableHead><TableHead className="w-72">操作</TableHead></TableRow></TableHeader>
          <TableBody>{roleStore.list.map((r: Role) => (<TableRow key={r.id}>
            <TableCell className="font-medium">{r.label}</TableCell><TableCell><code className="text-xs bg-muted px-1 rounded">{r.name}</code></TableCell>
            <TableCell className="text-muted-foreground text-xs">{r.description || '-'}</TableCell>
            <TableCell><Badge variant={r.status === 1 ? 'success' : 'warning'}>{r.status === 1 ? '启用' : '禁用'}</Badge></TableCell>
            <TableCell>{r.permissions?.length || 0}</TableCell>
            <TableCell><div className="flex gap-1 flex-wrap">
              {authStore.hasPermission(Permissions.RoleUpdate) && <Button variant="outline" size="sm" onClick={() => openEdit(r)}>编辑</Button>}
              {authStore.hasPermission(Permissions.RoleUpdate) && <Button variant="outline" size="sm" onClick={() => confirmToggleStatus(r)}>{r.status === 1 ? '禁用' : '启用'}</Button>}
              {authStore.hasPermission(Permissions.RoleUpdate) && <Button variant="outline" size="sm" onClick={() => openPermModal(r)}>绑定权限</Button>}
              {authStore.hasPermission(Permissions.RoleDelete) && <Button variant="destructive" size="sm" onClick={() => { setDeleteTarget(r); setDeleteOpen(true) }}>删除</Button>}
            </div></TableCell>
          </TableRow>))}</TableBody>
        </Table>
      </div>

      {/* 区域：创建/编辑角色弹窗；设计：两列布局——角色标识与名称同排，描述占整行 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{isCreate ? '创建角色' : '编辑角色'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-2">
            <div className="space-y-2">
              <Label>角色标识 {!isCreate ? '' : <span className="text-destructive">*</span>}</Label>
              {isCreate ? (
                <Input value={editForm.name} onChange={e => updateField('name', e.target.value)} placeholder="仅支持小写字母和下划线，如 editor" />
              ) : (
                <Input value={editTarget?.name || ''} disabled />
              )}
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>角色名称 <span className="text-destructive">*</span></Label>
              <Input value={editForm.label} onChange={e => updateField('label', e.target.value)} placeholder="如：编辑" />
              {errors.label && <p className="text-xs text-destructive">{errors.label}</p>}
            </div>
            <div className="col-span-1 sm:col-span-2 space-y-2">
              <Label>描述</Label>
              <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" value={editForm.description} onChange={e => updateField('description', e.target.value)} placeholder="选填，最多 200 个字符" maxLength={200} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select value={String(editForm.status)} onValueChange={v => updateField('status', Number(v) as 0 | 1)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="1">启用</SelectItem><SelectItem value="0">禁用</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>取消</Button>
            <Button onClick={handleEdit} loading={editLoading}>{isCreate ? '创建' : '保存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──── 绑定权限弹窗；参照 client-vue RolePermissionModal ──── */}
      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>绑定权限 - {permRole?.label}</DialogTitle></DialogHeader>
          <PermissionTreeSelect
            className="my-2"
            permissions={permStore.tree}
            value={selectedPermIds}
            onChange={setSelectedPermIds}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPermOpen(false)} disabled={binding}>取消</Button>
            <Button onClick={handleBindPerms} loading={binding}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──── 删除确认 ──── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">确定要删除角色「{deleteTarget?.label}」吗？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──── 状态切换确认 ──── */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{statusTarget?.status === 1 ? '确认禁用' : '确认启用'}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            确定要{statusTarget?.status === 1 ? '禁用' : '启用'}角色「{statusTarget?.label}」吗？
            {statusTarget?.status === 1 && statusCount > 0 && `此角色已绑定 ${statusCount} 个用户，禁用后这些用户将失去该角色的权限。`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)} disabled={togglingStatus}>取消</Button>
            <Button onClick={handleToggleStatus} loading={togglingStatus} variant={statusTarget?.status === 1 ? 'destructive' : 'default'}>
              确认{statusTarget?.status === 1 ? '禁用' : '启用'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useEffect, useState, useCallback } from 'react'
import { useUserStore } from '@/stores/user'
import { useRoleStore } from '@/stores/role'
import { useDepartmentStore } from '@/stores/department'
import { useAuthStore } from '@/stores/auth'
import { getUserById } from '@/api/user'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MultiSelect } from '@/components/ui/multi-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDateTime } from '@/lib/format'
import { toast } from '@/components/ui/use-toast'
import { Permissions } from '@/lib/permissions'
import { useZodForm } from '@/hooks/useZodForm'
import { userCreateFormSchema, userEditFormSchema } from '@/lib/validators'
import type { User, DepartmentTreeNode } from '@/types'
import type { UserCreateFormData, UserEditFormData } from '@/lib/validators'

/** 递归渲染部门树选项；通过 paddingLeft 缩进体现层级 */
function renderDeptOptions(nodes: DepartmentTreeNode[], depth = 0): React.ReactNode[] {
  return nodes.flatMap(n => [
    <SelectItem key={n.id} value={n.id} style={{ paddingLeft: `${depth * 24 + 8}px` }}>
      {n.name}
    </SelectItem>,
    ...(n.children?.length ? renderDeptOptions(n.children, depth + 1) : []),
  ])
}

const INIT_CREATE: UserCreateFormData = { username: '', email: '', password: '', nickname: '', phone: '' }
const INIT_EDIT: UserEditFormData = { email: '', nickname: '', phone: '' }

export default function UserListPage() {
  const userStore = useUserStore()
  const roleStore = useRoleStore()
  const deptStore = useDepartmentStore()
  const authStore = useAuthStore()
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [searchVal, setSearchVal] = useState('')

  // 编辑弹窗
  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<UserEditFormData>({ ...INIT_EDIT })
  const [editRoleIds, setEditRoleIds] = useState<string[]>([])
  const [editDeptId, setEditDeptId] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editStatus, setEditStatus] = useState<0 | 1>(1)
  const editZod = useZodForm(userEditFormSchema)

  // 删除确认
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  // 重置密码
  const [resetOpen, setResetOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [resetting, setResetting] = useState(false)

  // 创建弹窗
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<UserCreateFormData>({ ...INIT_CREATE })
  const [createRoleIds, setCreateRoleIds] = useState<string[]>([])
  const [createDeptId, setCreateDeptId] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const createZod = useZodForm(userCreateFormSchema)

  useEffect(() => {
    userStore.fetchUsers({ page, pageSize: 20, keyword: searchVal })
    roleStore.fetchRoles()
    deptStore.fetchDepartments()
  }, [page, searchVal])

  const handleSearch = () => { setPage(1); setSearchVal(keyword) }

  /** 创建表单：更新字段并实时校验 */
  const updateCreateField = useCallback(<K extends keyof UserCreateFormData>(key: K, value: UserCreateFormData[K]) => {
    setCreateForm(prev => { const next = { ...prev, [key]: value }; createZod.validateField(key, next); return next })
  }, [createZod.validateField])

  /** 编辑表单：更新字段并实时校验 */
  const updateEditField = useCallback(<K extends keyof UserEditFormData>(key: K, value: UserEditFormData[K]) => {
    setEditForm(prev => { const next = { ...prev, [key]: value }; editZod.validateField(key, next); return next })
  }, [editZod.validateField])

  const openEdit = async (user: User) => {
    setEditTarget(user); setEditOpen(true); setEditLoading(true); editZod.clearErrors()
    try {
      const res = await getUserById<User>(user.id)
      const d = res.data.data
      setEditForm({ email: d.email, nickname: d.nickname || '', phone: d.phone || '' })
      setEditRoleIds(d.roles.map(r => r.id))
      setEditDeptId(d.department?.id || '')
      setEditStatus(d.status)
    } catch { toast({ title: '获取用户信息失败', variant: 'destructive' }); setEditOpen(false) }
    finally { setEditLoading(false) }
  }

  const handleEdit = async () => {
    if (!editTarget) return
    if (!editZod.validate(editForm)) return
    setEditLoading(true)
    try {
      await userStore.editUser(editTarget.id, { email: editForm.email, nickname: editForm.nickname, phone: editForm.phone || undefined, status: editStatus, departmentId: editDeptId || '' })
      if (editRoleIds.length) await userStore.assignRoles(editTarget.id, { roleIds: editRoleIds })
      toast({ title: '用户更新成功' })
      if (authStore.user?.id === editTarget.id) await authStore.fetchUserProfile()
      setEditOpen(false)
      userStore.fetchUsers({ page, pageSize: 20, keyword: searchVal })
    } catch (err: any) { toast({ title: err?.response?.data?.message || '更新失败', variant: 'destructive' }) }
    finally { setEditLoading(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await userStore.removeUser(deleteTarget.id); toast({ title: '用户已删除' }); setDeleteOpen(false); setDeleteTarget(null); userStore.fetchUsers({ page, pageSize: 20, keyword: searchVal }) }
    catch { toast({ title: '删除失败', variant: 'destructive' }) }
  }

  const handleReset = async () => {
    if (!resetTarget) return; setResetting(true)
    try { await userStore.resetPassword(resetTarget.id, { password: '123456' }); toast({ title: '密码已重置为 123456' }); setResetOpen(false); setResetTarget(null) }
    catch { toast({ title: '重置失败', variant: 'destructive' }) }
    finally { setResetting(false) }
  }

  const resetCreateForm = () => { setCreateForm({ ...INIT_CREATE }); setCreateRoleIds([]); setCreateDeptId(''); createZod.clearErrors() }
  const handleCreate = async () => {
    if (!createZod.validate(createForm)) return
    setCreateLoading(true)
    try {
      await userStore.addUser({ username: createForm.username, email: createForm.email, password: createForm.password, nickname: createForm.nickname || createForm.username, phone: createForm.phone || undefined, roleIds: createRoleIds, departmentId: createDeptId || undefined })
      toast({ title: '用户创建成功' }); setCreateOpen(false); resetCreateForm()
      userStore.fetchUsers({ page, pageSize: 20, keyword: searchVal })
    } catch (err: any) { toast({ title: err?.response?.data?.message || '创建失败', variant: 'destructive' }) }
    finally { setCreateLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Input placeholder="搜索用户名..." value={keyword} onChange={e => setKeyword(e.target.value)} className="w-60" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          <Button variant="outline" onClick={handleSearch}>搜索</Button>
        </div>
        {authStore.hasPermission(Permissions.UserCreate) && <Button onClick={() => { resetCreateForm(); setCreateOpen(true) }}>创建用户</Button>}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead><TableHead>邮箱</TableHead><TableHead>昵称</TableHead>
              <TableHead>角色</TableHead><TableHead>状态</TableHead><TableHead>创建时间</TableHead>
              <TableHead className="w-40">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userStore.list.map((u: User) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.nickname}</TableCell>
                <TableCell>{u.roles.map(r => r.label).join(', ') || '-'}</TableCell>
                <TableCell><Badge variant={u.status === 1 ? 'success' : 'warning'}>{u.status === 1 ? '启用' : '禁用'}</Badge></TableCell>
                <TableCell className="text-muted-foreground text-xs">{formatDateTime(u.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {authStore.hasPermission(Permissions.UserUpdate) && <Button variant="outline" size="sm" onClick={() => openEdit(u)}>编辑</Button>}
                    {authStore.hasPermission(Permissions.UserUpdate) && <Button variant="outline" size="sm" onClick={() => { setResetTarget(u); setResetOpen(true) }}>重置</Button>}
                    {authStore.hasPermission(Permissions.UserDelete) && <Button variant="destructive" size="sm" onClick={() => { setDeleteTarget(u); setDeleteOpen(true) }}>删除</Button>}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 区域：创建用户弹窗；设计：两列布局——基础字段两两同排，角色与部门选择区占整行 */}
      <Dialog open={createOpen} onOpenChange={v => { if (!v) { setCreateOpen(false); resetCreateForm() } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>创建用户</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-2">
            <div className="space-y-2">
              <Label>用户名 <span className="text-destructive">*</span></Label>
              <Input value={createForm.username} onChange={e => updateCreateField('username', e.target.value)} placeholder="2～50 个字符" />
              {createZod.errors.username && <p className="text-xs text-destructive">{createZod.errors.username}</p>}
            </div>
            <div className="space-y-2">
              <Label>邮箱 <span className="text-destructive">*</span></Label>
              <Input type="email" value={createForm.email} onChange={e => updateCreateField('email', e.target.value)} placeholder="请输入邮箱地址" />
              {createZod.errors.email && <p className="text-xs text-destructive">{createZod.errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>密码 <span className="text-destructive">*</span></Label>
              <Input type="password" value={createForm.password} onChange={e => updateCreateField('password', e.target.value)} placeholder="至少 6 个字符" />
              {createZod.errors.password && <p className="text-xs text-destructive">{createZod.errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label>昵称</Label>
              <Input value={createForm.nickname} onChange={e => updateCreateField('nickname', e.target.value)} placeholder="选填" />
            </div>
            <div className="space-y-2">
              <Label>手机号</Label>
              <Input value={createForm.phone} onChange={e => updateCreateField('phone', e.target.value)} placeholder="选填" />
              {createZod.errors.phone && <p className="text-xs text-destructive">{createZod.errors.phone}</p>}
            </div>
            {roleStore.list.length > 0 && (
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <Label>分配角色</Label>
                <MultiSelect
                  options={roleStore.list.map(r => ({ label: r.label, value: r.id }))}
                  value={createRoleIds}
                  onChange={v => setCreateRoleIds(v)}
                  placeholder="请选择角色"
                  searchPlaceholder="搜索角色..."
                />
              </div>
            )}
            {deptStore.tree.length > 0 && (
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <Label>所属部门</Label>
                <Select value={createDeptId || undefined} onValueChange={v => setCreateDeptId(v)}>
                  <SelectTrigger><SelectValue placeholder="请选择部门" /></SelectTrigger>
                  <SelectContent className="max-h-60">{renderDeptOptions(deptStore.tree)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetCreateForm() }}>取消</Button>
            <Button onClick={handleCreate} loading={createLoading}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 区域：编辑用户弹窗；设计：两列布局——基础字段两两同排，角色与部门选择区占整行 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>编辑用户</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-2">
            <div className="space-y-2">
              <Label>用户名</Label>
              <Input value={editTarget?.username || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>邮箱 <span className="text-destructive">*</span></Label>
              <Input value={editForm.email} onChange={e => updateEditField('email', e.target.value)} placeholder="请输入邮箱" />
              {editZod.errors.email && <p className="text-xs text-destructive">{editZod.errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>昵称</Label>
              <Input value={editForm.nickname} onChange={e => updateEditField('nickname', e.target.value)} placeholder="选填" />
            </div>
            <div className="space-y-2">
              <Label>手机号</Label>
              <Input value={editForm.phone} onChange={e => updateEditField('phone', e.target.value)} placeholder="选填" />
              {editZod.errors.phone && <p className="text-xs text-destructive">{editZod.errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select value={String(editStatus)} onValueChange={v => setEditStatus(Number(v) as 0 | 1)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">启用</SelectItem>
                  <SelectItem value="0">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {roleStore.list.length > 0 && (
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <Label>分配角色</Label>
                <MultiSelect
                  options={roleStore.list.map(r => ({ label: r.label, value: r.id }))}
                  value={editRoleIds}
                  onChange={v => setEditRoleIds(v)}
                  placeholder="请选择角色"
                  searchPlaceholder="搜索角色..."
                />
              </div>
            )}
            {deptStore.tree.length > 0 && (
              <div className="col-span-1 sm:col-span-2 space-y-2">
                <Label>所属部门</Label>
                <Select value={editDeptId || undefined} onValueChange={v => setEditDeptId(v)}>
                  <SelectTrigger><SelectValue placeholder="请选择部门" /></SelectTrigger>
                  <SelectContent className="max-h-60">{renderDeptOptions(deptStore.tree)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={editLoading}>取消</Button>
            <Button onClick={handleEdit} loading={editLoading}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──── 删除确认 ──── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">确定要删除用户「{deleteTarget?.username}」吗？此操作不可恢复。</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──── 重置密码确认 ──── */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>确认重置密码</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">确定要将用户「{resetTarget?.username}」的密码重置为 <code className="bg-muted px-1 rounded text-xs">123456</code> 吗？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetOpen(false); setResetTarget(null) }} disabled={resetting}>取消</Button>
            <Button onClick={handleReset} loading={resetting}>确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

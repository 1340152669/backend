import { useEffect, useState } from 'react'
import { useDepartmentStore } from '@/stores/department'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'
import { getDepartmentById } from '@/api/department'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/lib/format'
import { toast } from '@/components/ui/use-toast'
import { Permissions } from '@/lib/permissions'
import type { Department, DepartmentTreeNode, User } from '@/types'

export default function DepartmentListPage() {
  const deptStore = useDepartmentStore()
  const userStore = useUserStore()
  const authStore = useAuthStore()
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const [formOpen, setFormOpen] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formTarget, setFormTarget] = useState<Department | null>(null)
  const [formData, setFormData] = useState({ name: '', sort: 0, parentId: null as string | null, status: 1 as 0 | 1 })
  const [formLoading, setFormLoading] = useState(false)

  const [userModalOpen, setUserModalOpen] = useState(false)
  const [userModalDept, setUserModalDept] = useState<Department | null>(null)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [assigning, setAssigning] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null)

  useEffect(() => { deptStore.fetchDepartments(); userStore.fetchUsers({ page: 1, pageSize: 100 }) }, [])

  const toggleExpand = (id: string) => { const next = new Set(expandedKeys); next.has(id) ? next.delete(id) : next.add(id); setExpandedKeys(next) }
  const expandAll = () => { const keys = new Set<string>(); const collect = (nodes: DepartmentTreeNode[]) => { nodes.forEach(n => { keys.add(n.id); if (n.children?.length) collect(n.children) }) }; collect(deptStore.tree); setExpandedKeys(keys) }
  const collapseAll = () => setExpandedKeys(new Set())

  const openCreate = (parentId: string | null = null) => { setFormTitle(parentId ? '创建子部门' : '创建部门'); setFormTarget(null); setFormData({ name: '', sort: 0, parentId, status: 1 }); setFormOpen(true) }
  const openEdit = async (dept: Department) => {
    setFormTitle('编辑部门'); setFormTarget(dept); setFormLoading(true)
    try { const res = await getDepartmentById<Department>(dept.id); const d = res.data.data; setFormData({ name: d.name, sort: d.sort, parentId: d.parentId, status: d.status }); setFormOpen(true) }
    catch { toast({ title: '获取部门信息失败', variant: 'destructive' }) }
    finally { setFormLoading(false) }
  }
  const handleFormSubmit = async () => {
    if (!formData.name) { toast({ title: '部门名称不能为空', variant: 'destructive' }); return }
    setFormLoading(true)
    try {
      if (formTarget) { await deptStore.editDepartment(formTarget.id, { name: formData.name, sort: formData.sort, parentId: formData.parentId, status: formData.status }); toast({ title: '部门更新成功' }) }
      else { await deptStore.addDepartment({ name: formData.name, sort: formData.sort, parentId: formData.parentId }); toast({ title: '部门创建成功' }) }
      setFormOpen(false)
    } catch (err: any) { toast({ title: err?.response?.data?.message || '操作失败', variant: 'destructive' }) }
    finally { setFormLoading(false) }
  }

  const openUserModal = async (dept: Department) => {
    setUserModalDept(dept); setUserModalOpen(true)
    try { const res = await getDepartmentById<Department>(dept.id); setSelectedUserIds((res.data.data.users || []).map((u: any) => u.id)) }
    catch { toast({ title: '获取部门用户失败', variant: 'destructive' }) }
  }
  const handleAssign = async () => {
    if (!userModalDept || assigning) return; setAssigning(true)
    try { await deptStore.assignUsers(userModalDept.id, { userIds: selectedUserIds }); toast({ title: '用户分配成功' }); setUserModalOpen(false) }
    catch (err: any) { toast({ title: err?.response?.data?.message || '分配失败', variant: 'destructive' }) }
    finally { setAssigning(false) }
  }

  const handleToggleStatus = async (dept: Department) => {
    const newStatus: 0 | 1 = dept.status === 1 ? 0 : 1
    try { await deptStore.toggleDepartmentStatus(dept.id, { status: newStatus }); toast({ title: `部门已${newStatus === 1 ? '启用' : '禁用'}` }) }
    catch { toast({ title: '操作失败', variant: 'destructive' }) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await deptStore.removeDepartment(deleteTarget.id); toast({ title: '部门已删除' }); setDeleteOpen(false); setDeleteTarget(null) }
    catch { toast({ title: '删除失败', variant: 'destructive' }) }
  }

  const toggleAssignUser = (id: string) => setSelectedUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const renderTree = (nodes: DepartmentTreeNode[], depth = 0) => nodes.map(node => (
    <div key={node.id}>
      <div className="flex items-center gap-2 py-2 px-4 border-b hover:bg-muted/50 text-sm" style={{ paddingLeft: `${16 + depth * 32}px` }}>
        <button className="w-4 text-center text-xs text-muted-foreground" onClick={() => toggleExpand(node.id)}>
          {node.children?.length ? (expandedKeys.has(node.id) ? '▼' : '▶') : '　'}
        </button>
        <span className="flex-1 font-medium">{node.name}</span>
        <span className="w-16 text-muted-foreground">{node.sort}</span>
        <span className="w-20"><Badge variant={node.status === 1 ? 'success' : 'warning'}>{node.status === 1 ? '启用' : '禁用'}</Badge></span>
        <span className="w-28 text-muted-foreground text-xs">{formatDate(node.createdAt)}</span>
        <span className="flex gap-1 w-96 justify-end">
          {authStore.hasPermission(Permissions.DeptCreate) && <Button variant="outline" size="sm" onClick={() => openCreate(node.id)}>添加子部门</Button>}
          {authStore.hasPermission(Permissions.DeptUpdate) && <Button variant="outline" size="sm" onClick={() => openEdit(node)}>编辑</Button>}
          {authStore.hasPermission(Permissions.DeptUpdate) && <Button variant="outline" size="sm" onClick={() => openUserModal(node)}>分配用户</Button>}
          {authStore.hasPermission(Permissions.DeptUpdate) && <Button variant="outline" size="sm" onClick={() => handleToggleStatus(node)}>{node.status === 1 ? '禁用' : '启用'}</Button>}
          {authStore.hasPermission(Permissions.DeptDelete) && <Button variant="destructive" size="sm" onClick={() => { setDeleteTarget(node); setDeleteOpen(true) }}>删除</Button>}
        </span>
      </div>
      {(node.children?.length ?? 0) > 0 && expandedKeys.has(node.id) && renderTree(node.children, depth + 1)}
    </div>
  ))

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={expandAll}>展开全部</Button><Button variant="outline" size="sm" onClick={collapseAll}>折叠全部</Button></div>
        {authStore.hasPermission(Permissions.DeptCreate) && <Button onClick={() => openCreate()}>创建部门</Button>}
      </div>
      <div className="rounded-md border bg-card overflow-x-auto">
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b text-xs font-medium text-muted-foreground" style={{ paddingLeft: '16px' }}>
          <span className="flex-1">部门名称</span><span className="w-16">排序</span><span className="w-20">状态</span><span className="w-28">创建时间</span><span className="w-96">操作</span>
        </div>
        {deptStore.tree.length > 0 ? renderTree(deptStore.tree) : <div className="p-8 text-center text-muted-foreground">暂无部门数据</div>}
      </div>

      {/* 区域：创建/编辑部门弹窗；设计：两列布局利用横向空间，名称与排序同排，降低弹窗高度 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{formTitle}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-2">
            <div className="space-y-2">
              <Label>部门名称 <span className="text-destructive">*</span></Label>
              <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="请输入部门名称" />
            </div>
            <div className="space-y-2">
              <Label>排序</Label>
              <Input type="number" value={formData.sort} onChange={e => setFormData(p => ({ ...p, sort: Number(e.target.value) || 0 }))} min={0} max={9999} />
              <p className="text-xs text-muted-foreground">数值越小越靠前</p>
            </div>
            {formTarget && (
              <div className="space-y-2">
                <Label>状态</Label>
                <Select value={String(formData.status)} onValueChange={v => setFormData(p => ({ ...p, status: Number(v) as 0 | 1 }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="1">启用</SelectItem><SelectItem value="0">禁用</SelectItem></SelectContent>
                </Select>
              </div>
            )}
            {formData.parentId && !formTarget && (
              <div className="space-y-2">
                <Label>父部门 ID</Label>
                <Input value={formData.parentId} disabled />
                <p className="text-xs text-muted-foreground">将创建为该部门的子部门</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={formLoading}>取消</Button>
            <Button onClick={handleFormSubmit} loading={formLoading}>{formTarget ? '保存' : '创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──── 分配用户弹窗；字段参照 client-vue DepartmentUserModal ──── */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>分配用户</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">为部门「{userModalDept?.name}」分配用户</p>
          <div className="space-y-1 py-2 max-h-64 overflow-y-auto">
            {userStore.list.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无用户数据</p>
            ) : (
              userStore.list.map((u: User) => (
                <label key={u.id} className="flex items-center gap-3 p-2 rounded-md border cursor-pointer hover:bg-muted/50 text-sm">
                  <Checkbox checked={selectedUserIds.includes(u.id)} onCheckedChange={() => toggleAssignUser(u.id)} />
                  <span className="font-medium min-w-[100px]">{u.nickname || u.username}</span>
                  <span className="text-muted-foreground">{u.email}</span>
                </label>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserModalOpen(false)} disabled={assigning}>取消</Button>
            <Button onClick={handleAssign} loading={assigning}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ──── 删除确认 ──── */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            确定要删除部门「{deleteTarget?.name}」吗？
            {deleteTarget?.children && deleteTarget.children.length > 0 ? '该部门下有子部门，无法删除。' : '此操作不可恢复。'}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!!(deleteTarget?.children && deleteTarget.children.length > 0)}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

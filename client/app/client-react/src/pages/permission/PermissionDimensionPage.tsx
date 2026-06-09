import { useEffect, useState } from 'react'
import { getPermissionDimensions } from '@/api/permission'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PermissionDimensionGroup } from '@/types'

export default function PermissionDimensionPage() {
  const [dimensions, setDimensions] = useState<PermissionDimensionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    getPermissionDimensions<PermissionDimensionGroup>().then(res => setDimensions(res.data.data || [])).finally(() => setLoading(false))
  }, [])

  const filtered = dimensions
    .map(g => ({ ...g, items: g.items.filter(i => !search || i.dimension.toLowerCase().includes(search.toLowerCase()) || i.code.toLowerCase().includes(search.toLowerCase()) || i.label.toLowerCase().includes(search.toLowerCase())) }))
    .filter(g => g.items.length > 0)

  const totalPerms = dimensions.reduce((s, g) => s + g.totalPermissions, 0)
  const totalBindings = dimensions.reduce((s, g) => s + g.totalRoleBindings, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 bg-card p-3 rounded-lg border">
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-1"><span className="text-2xl font-bold tabular-nums">{dimensions.length}</span><span className="text-sm text-muted-foreground">维度</span></div>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-baseline gap-1"><span className="text-2xl font-bold tabular-nums">{totalPerms}</span><span className="text-sm text-muted-foreground">权限总数</span></div>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-baseline gap-1"><span className="text-2xl font-bold tabular-nums">{totalBindings}</span><span className="text-sm text-muted-foreground">角色绑定总数</span></div>
        </div>
        <Input placeholder="搜索维度/权限代码/名称..." value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
      </div>

      {loading ? <div className="text-center py-8 text-muted-foreground">加载中...</div> :
        filtered.map(group => (
          <Card key={group.dimension}>
            <CardHeader className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><CardTitle className="text-sm uppercase tracking-wider">{group.dimension}</CardTitle><Badge variant="outline" className="text-xs">{group.dimension}</Badge></div>
                <div className="flex gap-3 text-xs text-muted-foreground"><span>📄 {group.totalPermissions} 项权限</span><span>👥 {group.totalRoleBindings} 角色绑定</span></div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>权限代码</TableHead><TableHead>权限名称</TableHead><TableHead className="w-28">绑定角色数</TableHead></TableRow></TableHeader>
                <TableBody>{group.items.map(item => (<TableRow key={item.id}><TableCell><code className="text-xs bg-muted px-1 rounded">{item.code}</code></TableCell><TableCell>{item.label}</TableCell><TableCell><Badge variant={item.roleCount > 0 ? 'success' : 'secondary'}>{item.roleCount}</Badge></TableCell></TableRow>))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
    </div>
  )
}

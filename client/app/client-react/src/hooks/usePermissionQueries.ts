import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPermissionTree, getPermissionList, getPermissionPaginatedList, getPermissionById, createPermission, updatePermission, deletePermission, getPermissionDimensions } from '@/api/permission'
import { queryKeys } from './queryKeys'
import type { Permission, PermissionDimensionGroup } from '@/types'

/** 获取权限树（按父子结构组织），支持排序 */
export function usePermissionTree(sortBy = 'sort', sortOrder: 'ASC' | 'DESC' = 'ASC') {
  return useQuery({
    queryKey: queryKeys.permissions.tree({ sortBy, sortOrder }),
    queryFn: async () => {
      const res = await getPermissionTree<Permission>({ sortBy, sortOrder })
      return res.data.data || []
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })
}

/** 获取权限平铺列表 */
export function usePermissionList() {
  return useQuery({
    queryKey: queryKeys.permissions.list(),
    queryFn: async () => { const res = await getPermissionList<Permission>(); return res.data.data || [] },
    staleTime: 5 * 60 * 1000,
  })
}

/** 获取权限分页列表 */
export function usePermissionPaginatedList(params?: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) {
  return useQuery({
    queryKey: queryKeys.permissions.paginatedList(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await getPermissionPaginatedList<Permission>(params || {})
      return { list: res.data.data || [], total: res.data.meta?.total ?? 0 }
    },
    staleTime: 30 * 1000,
  })
}

/** 获取权限维度统计 */
export function usePermissionDimensions() {
  return useQuery({
    queryKey: queryKeys.permissions.dimensions(),
    queryFn: async () => {
      const res = await getPermissionDimensions<PermissionDimensionGroup>()
      return res.data.data || []
    },
    staleTime: 10 * 60 * 1000,
  })
}

/** 创建权限 */
export function useCreatePermission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => createPermission<Permission, Record<string, unknown>>(data).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.permissions.all }); qc.invalidateQueries({ queryKey: queryKeys.auth.me() }) },
  })
}

/** 更新权限 */
export function useUpdatePermission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updatePermission<Permission, Record<string, unknown>>(id, data).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.permissions.all }); qc.invalidateQueries({ queryKey: queryKeys.auth.me() }) },
  })
}

/** 删除权限 */
export function useDeletePermission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deletePermission(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.permissions.all }); qc.invalidateQueries({ queryKey: queryKeys.auth.me() }) },
  })
}

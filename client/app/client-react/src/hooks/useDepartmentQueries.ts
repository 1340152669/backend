import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment, updateDepartmentStatus, assignDepartmentUsers } from '@/api/department'
import { queryKeys } from './queryKeys'
import type { Department, DepartmentTreeNode, CreateDepartmentParams, UpdateDepartmentParams } from '@/types'

/** 获取部门树，staleTime=2min */
export function useDepartmentTree() {
  return useQuery({
    queryKey: queryKeys.departments.tree(),
    queryFn: async () => {
      const res = await getDepartments<DepartmentTreeNode>()
      return res.data.data || []
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
  })
}

/** 获取部门详情 */
export function useDepartmentDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.departments.detail(id!),
    queryFn: async () => { const res = await getDepartmentById<Department>(id!); return res.data.data },
    enabled: !!id,
  })
}

/** 创建部门，成功后自动刷新部门树 */
export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDepartmentParams) => createDepartment<Department, CreateDepartmentParams>(data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.departments.all }),
  })
}

/** 更新部门，成功后自动刷新部门树 */
export function useUpdateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentParams }) => updateDepartment<Department, UpdateDepartmentParams>(id, data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.departments.all }),
  })
}

/** 删除部门 */
export function useDeleteDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.departments.all }),
  })
}

/** 切换部门状态 */
export function useToggleDepartmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 0 | 1 }) => updateDepartmentStatus(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.departments.all }),
  })
}

/** 分配部门用户 */
export function useAssignDepartmentUsers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) => assignDepartmentUsers(id, { userIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.departments.all }),
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRoles, getRoleById, createRole, updateRole, deleteRole, bindRolePermissions, updateRoleStatus, getRoleBoundUserCount } from '@/api/role'
import { queryKeys } from './queryKeys'
import type { Role, CreateRoleParams, UpdateRoleParams } from '@/types'

/** 获取角色列表（含权限），staleTime=2min */
export function useRoleList() {
  return useQuery({
    queryKey: queryKeys.roles.list(),
    queryFn: async () => {
      const res = await getRoles<Role>()
      return res.data.data.filter(r => !r.isSystem)
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
  })
}

/** 获取角色详情 */
export function useRoleDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.roles.detail(id!),
    queryFn: async () => { const res = await getRoleById<Role>(id!); return res.data.data },
    enabled: !!id,
  })
}

/** 获取角色绑定的用户数 */
export function useRoleBoundUserCount(id: string | null) {
  return useQuery({
    queryKey: queryKeys.roles.boundUserCount(id!),
    queryFn: async () => { const res = await getRoleBoundUserCount(id!); return res.data.data.count },
    enabled: !!id,
  })
}

/** 创建角色 */
export function useCreateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateRoleParams) => createRole<Role, CreateRoleParams>(data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.roles.all }),
  })
}

/** 更新角色 */
export function useUpdateRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleParams }) => updateRole<Role, UpdateRoleParams>(id, data).then(r => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.roles.all }),
  })
}

/** 删除角色 */
export function useDeleteRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.roles.all }),
  })
}

/** 绑定角色权限（全量覆盖） */
export function useBindRolePermissions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, permissionIds }: { id: string; permissionIds: string[] }) => bindRolePermissions(id, { permissionIds }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.roles.all }); qc.invalidateQueries({ queryKey: queryKeys.auth.me() }) },
  })
}

/** 切换角色状态 */
export function useToggleRoleStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 0 | 1 }) => updateRoleStatus<Role>(id, { status }).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.roles.all }); qc.invalidateQueries({ queryKey: queryKeys.auth.me() }) },
  })
}

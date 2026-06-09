import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUsers, getUserById, createUser, updateUser, deleteUser, updateUserStatus, assignUserRoles, resetUserPassword } from '@/api/user'
import { queryKeys } from './queryKeys'
import type { User, UserQueryParams, CreateUserParams, UpdateUserParams } from '@/types'

/** 获取用户分页列表，带缓存和自动重试 */
export function useUserList(params: UserQueryParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params as Record<string, unknown>),
    queryFn: async () => {
      const res = await getUsers<User, UserQueryParams>(params)
      return { list: res.data.data, total: res.data.meta?.total ?? 0 }
    },
    staleTime: 30 * 1000,  // 30s 内缓存有效
    retry: 2,
  })
}

/** 获取单个用户详情 */
export function useUserDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.users.detail(id!),
    queryFn: async () => { const res = await getUserById<User>(id!); return res.data.data },
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

/** 创建用户 mutation */
export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserParams) => createUser<User, CreateUserParams>(data).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.users.all }) },
  })
}

/** 更新用户 mutation */
export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserParams }) => updateUser<User, UpdateUserParams>(id, data).then(r => r.data.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.users.all }) },
  })
}

/** 删除用户 mutation */
export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.users.all }) },
  })
}

/** 分配用户角色 mutation */
export function useAssignUserRoles() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, roleIds }: { id: string; roleIds: string[] }) => assignUserRoles(id, { roleIds }),
    onSuccess: (_data, vars) => { qc.invalidateQueries({ queryKey: queryKeys.users.detail(vars.id) }) },
  })
}

/** 重置用户密码 mutation */
export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => resetUserPassword(id, { password }),
    retry: 0,  // 密码重置不重试
  })
}

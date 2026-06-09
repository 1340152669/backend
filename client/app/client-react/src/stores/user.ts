/**
 * 用户管理 Store — 用户列表加载、分页、CRUD
 */
import { create } from 'zustand'
import { getUsers, createUser, updateUser, deleteUser, updateUserStatus, assignUserRoles, resetUserPassword } from '@/api/user'
import type { User, UserQueryParams, CreateUserParams, UpdateUserParams, UpdateUserStatusParams, AssignRolesParams, ResetPasswordParams } from '@/types'

interface UserState {
  list: User[]
  total: number
  loading: boolean
  fetchUsers: (params: UserQueryParams) => Promise<void>
  addUser: (data: CreateUserParams) => Promise<User>
  editUser: (id: string, data: UpdateUserParams) => Promise<User>
  removeUser: (id: string) => Promise<void>
  toggleUserStatus: (id: string, data: UpdateUserStatusParams) => Promise<void>
  assignRoles: (id: string, data: AssignRolesParams) => Promise<void>
  resetPassword: (id: string, data: ResetPasswordParams) => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  list: [],
  total: 0,
  loading: false,

  fetchUsers: async (params) => {
    set({ loading: true })
    try {
      const res = await getUsers<User, UserQueryParams>(params)
      set({ list: res.data.data, total: res.data.meta?.total ?? 0 })
    } finally { set({ loading: false }) }
  },

  addUser: async (data) => {
    const res = await createUser<User, CreateUserParams>(data)
    return res.data.data
  },

  editUser: async (id, data) => {
    const res = await updateUser<User, UpdateUserParams>(id, data)
    return res.data.data
  },

  removeUser: async (id) => { await deleteUser(id) },

  toggleUserStatus: async (id, data) => { await updateUserStatus(id, data) },

  assignRoles: async (id, data) => { await assignUserRoles(id, data) },

  resetPassword: async (id, data) => { await resetUserPassword(id, data) },
}))

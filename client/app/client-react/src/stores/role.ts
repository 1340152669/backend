/**
 * 角色管理 Store — 角色列表、CRUD、权限绑定
 */
import { create } from 'zustand'
import { getRoles, createRole, updateRole, deleteRole, bindRolePermissions, updateRoleStatus } from '@/api/role'
import type { Role, CreateRoleParams, UpdateRoleParams, BindPermissionsParams } from '@/types'

interface RoleState {
  list: Role[]
  loading: boolean
  fetchRoles: () => Promise<void>
  addRole: (data: CreateRoleParams) => Promise<Role>
  editRole: (id: string, data: UpdateRoleParams) => Promise<Role>
  removeRole: (id: string) => Promise<void>
  assignPermissions: (id: string, data: BindPermissionsParams) => Promise<void>
  toggleRoleStatus: (id: string, status: 0 | 1) => Promise<Role>
}

export const useRoleStore = create<RoleState>((set) => ({
  list: [],
  loading: false,

  fetchRoles: async () => {
    set({ loading: true })
    try {
      const res = await getRoles<Role>()
      set({ list: res.data.data.filter((r) => !r.isSystem) })
    } finally { set({ loading: false }) }
  },

  addRole: async (data) => {
    const res = await createRole<Role, CreateRoleParams>(data)
    return res.data.data
  },

  editRole: async (id, data) => {
    const res = await updateRole<Role, UpdateRoleParams>(id, data)
    return res.data.data
  },

  removeRole: async (id) => { await deleteRole(id) },

  assignPermissions: async (id, data) => { await bindRolePermissions(id, data) },

  toggleRoleStatus: async (id, status) => {
    const res = await updateRoleStatus<Role>(id, { status })
    return res.data.data
  },
}))

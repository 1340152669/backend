/**
 * 权限管理 Store — 权限树和平铺列表管理
 */
import { create } from 'zustand'
import { createPermission as createPermissionApi, deletePermission as deletePermissionApi, getPermissionList, getPermissionPaginatedList, getPermissionTree, updatePermission as updatePermissionApi } from '@/api/permission'
import type { Permission } from '@/types'

interface PermissionState {
  tree: Permission[]
  list: Permission[]
  paginatedList: Permission[]
  total: number
  page: number
  pageSize: number
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
  loading: boolean
  fetchTree: (params?: { sortBy?: string; sortOrder?: string }) => Promise<void>
  fetchList: () => Promise<void>
  fetchPaginatedList: (params?: { page?: number; pageSize?: number; sortBy?: string; sortOrder?: 'ASC' | 'DESC' }) => Promise<void>
  addPermission: (data: any) => Promise<Permission>
  editPermission: (id: string, data: any) => Promise<Permission>
  removePermission: (id: string) => Promise<void>
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  tree: [], list: [], paginatedList: [], total: 0,
  page: 1, pageSize: 20, sortBy: 'sort', sortOrder: 'ASC' as const,
  loading: false,

  fetchTree: async (params) => {
    set({ loading: true })
    try {
      const s = { sortBy: params?.sortBy ?? get().sortBy, sortOrder: params?.sortOrder ?? get().sortOrder }
      if (params?.sortBy) set({ sortBy: params.sortBy })
      if (params?.sortOrder) set({ sortOrder: params.sortOrder as 'ASC' | 'DESC' })
      const res = await getPermissionTree<Permission>(s)
      set({ tree: res.data.data || [] })
    } finally { set({ loading: false }) }
  },

  fetchList: async () => {
    set({ loading: true })
    try { const res = await getPermissionList<Permission>(); set({ list: res.data.data || [] }) }
    finally { set({ loading: false }) }
  },

  fetchPaginatedList: async (params) => {
    set({ loading: true })
    try {
      const query = { page: params?.page ?? get().page, pageSize: params?.pageSize ?? get().pageSize, sortBy: params?.sortBy ?? get().sortBy, sortOrder: params?.sortOrder ?? get().sortOrder }
      const res = await getPermissionPaginatedList<Permission>(query)
      set({ paginatedList: res.data.data || [], total: res.data.meta?.total ?? 0, page: query.page, pageSize: query.pageSize, sortBy: query.sortBy, sortOrder: query.sortOrder })
    } finally { set({ loading: false }) }
  },

  addPermission: async (data) => {
    const res = await createPermissionApi<Permission, typeof data>(data)
    await get().fetchTree()
    return res.data.data
  },

  editPermission: async (id, data) => {
    const res = await updatePermissionApi<Permission, typeof data>(id, data)
    await get().fetchTree()
    return res.data.data
  },

  removePermission: async (id) => {
    await deletePermissionApi(id)
    await get().fetchTree()
  },
}))

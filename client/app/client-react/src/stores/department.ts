/**
 * 部门管理 Store — 部门树加载、CRUD、用户分配
 */
import { create } from 'zustand'
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, updateDepartmentStatus, assignDepartmentUsers } from '@/api/department'
import type { Department, DepartmentTreeNode, CreateDepartmentParams, UpdateDepartmentParams, UpdateDepartmentStatusParams, AssignDepartmentUsersParams } from '@/types'

interface DepartmentState {
  tree: DepartmentTreeNode[]
  loading: boolean
  fetchDepartments: () => Promise<void>
  addDepartment: (data: CreateDepartmentParams) => Promise<Department>
  editDepartment: (id: string, data: UpdateDepartmentParams) => Promise<Department>
  removeDepartment: (id: string) => Promise<void>
  toggleDepartmentStatus: (id: string, data: UpdateDepartmentStatusParams) => Promise<void>
  assignUsers: (id: string, data: AssignDepartmentUsersParams) => Promise<void>
}

export const useDepartmentStore = create<DepartmentState>((set) => ({
  tree: [],
  loading: false,

  fetchDepartments: async () => {
    set({ loading: true })
    try {
      const res = await getDepartments<DepartmentTreeNode>()
      set({ tree: res.data.data || [] })
    } catch {
      set({ tree: [] })
    } finally { set({ loading: false }) }
  },

  addDepartment: async (data) => {
    const res = await createDepartment<Department, CreateDepartmentParams>(data)
    await getDepartments<DepartmentTreeNode>().then(r => set({ tree: r.data.data || [] }))
    return res.data.data
  },

  editDepartment: async (id, data) => {
    const res = await updateDepartment<Department, UpdateDepartmentParams>(id, data)
    await getDepartments<DepartmentTreeNode>().then(r => set({ tree: r.data.data || [] }))
    return res.data.data
  },

  removeDepartment: async (id) => {
    await deleteDepartment(id)
    await getDepartments<DepartmentTreeNode>().then(r => set({ tree: r.data.data || [] }))
  },

  toggleDepartmentStatus: async (id, data) => {
    await updateDepartmentStatus(id, data)
    await getDepartments<DepartmentTreeNode>().then(r => set({ tree: r.data.data || [] }))
  },

  assignUsers: async (id, data) => {
    await assignDepartmentUsers(id, data)
    await getDepartments<DepartmentTreeNode>().then(r => set({ tree: r.data.data || [] }))
  },
}))

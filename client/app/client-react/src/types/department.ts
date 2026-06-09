/** 部门实体 */
export interface Department {
  id: string
  name: string
  sort: number
  status: 0 | 1
  parentId: string | null
  parent?: Pick<Department, 'id' | 'name'> | null
  children?: Department[]
  users?: Pick<User, 'id' | 'username' | 'nickname'>[]
  createdAt: string
  updatedAt: string
}

import type { User } from './user'

/** 部门树节点 */
export interface DepartmentTreeNode extends Department {
  children: DepartmentTreeNode[]
}

/** 创建部门请求参数 */
export interface CreateDepartmentParams {
  name: string
  sort?: number
  status?: 0 | 1
  parentId?: string | null
}

/** 更新部门请求参数 */
export interface UpdateDepartmentParams {
  name?: string
  sort?: number
  status?: 0 | 1
  parentId?: string | null
}

/** 更新部门状态参数 */
export interface UpdateDepartmentStatusParams {
  status: 0 | 1
}

/** 分配部门用户参数 */
export interface AssignDepartmentUsersParams {
  userIds: string[]
}

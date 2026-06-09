export type MenuType = 'directory' | 'menu' | 'button'

/** 权限实体 */
export interface Permission {
  id: string
  code: string
  label: string
  description?: string
  menuType: MenuType
  icon?: string
  sort: number
  isExternalLink: boolean
  path?: string
  routeName?: string
  componentPath?: string
  routeParams?: string
  isCache: boolean
  isShow: boolean
  status: number
  parentId?: string | null
  children?: Permission[]
}

/** 树形权限节点（递归） */
export interface PermissionTreeNode extends Permission {
  children: PermissionTreeNode[]
}

/** 权限表单数据 */
export interface PermissionFormData {
  code: string
  label: string
  description?: string
  menuType: MenuType
  icon?: string
  sort: number
  isExternalLink: boolean
  path?: string
  routeName?: string
  componentPath?: string
  routeParams?: string
  isCache: boolean
  isShow: boolean
  status: number
  parentId: string | null
}

/** 权限维度统计 — 单条 */
export interface PermissionDimensionItem {
  id: string
  code: string
  label: string
  dimension: string
  roleCount: number
}

/** 权限维度统计 — 分组 */
export interface PermissionDimensionGroup {
  dimension: string
  totalPermissions: number
  totalRoleBindings: number
  items: PermissionDimensionItem[]
}

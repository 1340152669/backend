import http from '@/lib/http'
import type { ApiResult } from '@/types'

export function getPermissionTree<T = unknown>(params?: { sortBy?: string; sortOrder?: string }) {
  return http.get<ApiResult<T[]>>('/permissions', { params })
}
export function getPermissionList<T = unknown>() {
  return http.get<ApiResult<T[]>>('/permissions/list')
}
export function getPermissionPaginatedList<T = unknown>(params: {
  page?: number; pageSize?: number; sortBy?: string; sortOrder?: 'ASC' | 'DESC'
}) {
  return http.get<ApiResult<T[]>>('/permissions/list', { params })
}
export function getPermissionById<T>(id: string) {
  return http.get<ApiResult<T>>(`/permissions/${id}`)
}
export function createPermission<T, D>(data: D) {
  return http.post<ApiResult<T>>('/permissions', data)
}
export function updatePermission<T, D>(id: string, data: D) {
  return http.put<ApiResult<T>>(`/permissions/${id}`, data)
}
export function deletePermission(id: string) {
  return http.delete<ApiResult<null>>(`/permissions/${id}`)
}
export function getPermissionDimensions<T = unknown>() {
  return http.get<ApiResult<T[]>>('/permissions/dimensions')
}

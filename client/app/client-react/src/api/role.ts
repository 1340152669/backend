import http from '@/lib/http'
import type { ApiResult } from '@/types'

export function getRoles<T>() {
  return http.get<ApiResult<T[]>>('/roles')
}
export function getRoleById<T>(id: string) {
  return http.get<ApiResult<T>>(`/roles/${id}`)
}
export function createRole<T, D>(data: D) {
  return http.post<ApiResult<T>>('/roles', data)
}
export function updateRole<T, D>(id: string, data: D) {
  return http.put<ApiResult<T>>(`/roles/${id}`, data)
}
export function deleteRole(id: string) {
  return http.delete<ApiResult<null>>(`/roles/${id}`)
}
export function bindRolePermissions<D>(id: string, data: D) {
  return http.put<ApiResult<null>>(`/roles/${id}/permissions`, data)
}
export function updateRoleStatus<T>(id: string, data: { status: 0 | 1 }) {
  return http.patch<ApiResult<T>>(`/roles/${id}/status`, data)
}
export function getRoleBoundUserCount(id: string) {
  return http.get<ApiResult<{ count: number }>>(`/roles/${id}/users/count`)
}

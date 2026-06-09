import http from '@/lib/http'
import type { ApiResult } from '@/types'

export function getUsers<T, P>(params: P) {
  return http.get<ApiResult<T[]>>('/users', { params })
}
export function getUserById<T>(id: string) {
  return http.get<ApiResult<T>>(`/users/${id}`)
}
export function createUser<T, D>(data: D) {
  return http.post<ApiResult<T>>('/users', data)
}
export function updateUser<T, D>(id: string, data: D) {
  return http.put<ApiResult<T>>(`/users/${id}`, data)
}
export function deleteUser(id: string) {
  return http.delete<ApiResult<null>>(`/users/${id}`)
}
export function updateUserStatus<D>(id: string, data: D) {
  return http.patch<ApiResult<null>>(`/users/${id}/status`, data)
}
export function assignUserRoles<D>(id: string, data: D) {
  return http.put<ApiResult<null>>(`/users/${id}/roles`, data)
}
export function resetUserPassword(id: string, data: { password: string }) {
  return http.patch<ApiResult<null>>(`/users/${id}/reset-password`, data)
}

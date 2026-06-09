import http from '@/lib/http'
import type { ApiResult } from '@/types'

export function getDepartments<T>() {
  return http.get<ApiResult<T[]>>('/departments')
}
export function getDepartmentById<T>(id: string) {
  return http.get<ApiResult<T>>(`/departments/${id}`)
}
export function createDepartment<T, D>(data: D) {
  return http.post<ApiResult<T>>('/departments', data)
}
export function updateDepartment<T, D>(id: string, data: D) {
  return http.put<ApiResult<T>>(`/departments/${id}`, data)
}
export function deleteDepartment(id: string) {
  return http.delete<ApiResult<null>>(`/departments/${id}`)
}
export function updateDepartmentStatus<D>(id: string, data: D) {
  return http.patch<ApiResult<null>>(`/departments/${id}/status`, data)
}
export function assignDepartmentUsers<D>(id: string, data: D) {
  return http.put<ApiResult<null>>(`/departments/${id}/users`, data)
}

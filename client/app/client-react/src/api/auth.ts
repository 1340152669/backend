import http from '@/lib/http'
import type { ApiResult } from '@/types'

export function login<T, R>(data: T) {
  return http.post<ApiResult<R>>('/auth/login', data)
}
export function register<T, R>(data: T) {
  return http.post<ApiResult<R>>('/auth/register', data)
}
export function getMe<T>() {
  return http.get<ApiResult<T>>('/auth/me')
}
export function refreshToken<T>() {
  return http.post<ApiResult<T>>('/auth/refresh')
}
export function changePassword<T>(data: T) {
  return http.post<ApiResult<null>>('/auth/change-password', data)
}

import { useQuery } from '@tanstack/react-query'
import { getMe } from '@/api/auth'
import { queryKeys } from './queryKeys'
import type { UserProfile } from '@/types'

/**
 * 获取当前用户信息（含角色和权限）
 *
 * 缓存策略：staleTime=5min，用户信息变更频率低，适合长缓存。
 * 当角色/权限变更时，通过 invalidateQueries 主动刷新。
 */
export function useCurrentUser() {
  return useQuery<UserProfile>({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      const res = await getMe<UserProfile>()
      return res.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 分钟内不重新请求
    retry: 2,                  // 失败重试 2 次
  })
}

/** React Query 键工厂 — 集中管理 query keys，确保一致性 */
export const queryKeys = {
  users: {
    all: ['users'] as const,
    list: (params?: Record<string, unknown>) => ['users', 'list', params] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
  },
  roles: {
    all: ['roles'] as const,
    list: () => ['roles', 'list'] as const,
    detail: (id: string) => ['roles', 'detail', id] as const,
    boundUserCount: (id: string) => ['roles', 'boundUserCount', id] as const,
  },
  departments: {
    all: ['departments'] as const,
    tree: () => ['departments', 'tree'] as const,
    detail: (id: string) => ['departments', 'detail', id] as const,
  },
  permissions: {
    all: ['permissions'] as const,
    tree: (sort?: Record<string, string>) => ['permissions', 'tree', sort] as const,
    list: () => ['permissions', 'list'] as const,
    paginatedList: (params?: Record<string, unknown>) => ['permissions', 'paginated', params] as const,
    detail: (id: string) => ['permissions', 'detail', id] as const,
    dimensions: () => ['permissions', 'dimensions'] as const,
  },
  auth: {
    me: () => ['auth', 'me'] as const,
  },
}

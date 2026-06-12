import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { useMenuStore } from '@/stores/menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { DynamicIcon } from '@/lib/iconMap'
import { type Permission } from '@/types'
import { PanelLeftClose, PanelLeftOpen, LogOut, User, Sun, Moon, ChevronDown, Menu, X } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useThemeSwitch } from '@/hooks/useThemeSwitch'

/** 递归过滤菜单：仅保留 status=1 且 isShow=true 且用户有权限的菜单 */
function filterMenus(perms: Permission[]): Permission[] {
  const authStore = useAuthStore.getState()
  return perms.filter(p => {
    if (p.status !== 1 || !p.isShow) return false
    if (p.code && !authStore.hasPermission(p.code)) return false
    return true
  }).map(p => ({ ...p, children: p.children ? filterMenus(p.children) : undefined }))
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const authStore = useAuthStore()
  const menuStore = useMenuStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { toggleTheme } = useThemeSwitch()

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const filteredMenus = filterMenus(menuStore.menus)

  const handleNavigate = useCallback((path: string) => {
    const isExternal = findExternalLink(menuStore.menus, path)
    if (isExternal) window.open(path, '_blank')
    else navigate(path)
    if (isMobile) setMobileDrawerOpen(false)
  }, [navigate, menuStore.menus, isMobile])

  const handleLogout = () => {
    authStore.logout()
    menuStore.reset()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 区域：移动端遮罩层 */}
      {isMobile && mobileDrawerOpen && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setMobileDrawerOpen(false)} />
      )}

      {/* 区域：侧边栏导航；设计：桌面固定左侧，移动端 Drawer 弹出 */}
      <aside className={cn(
        "flex flex-col border-r bg-card transition-all duration-200 z-50",
        isMobile
          ? "fixed left-0 top-0 bottom-0 w-60 -translate-x-full data-[open=true]:translate-x-0 shadow-lg"
          : collapsed ? "w-16" : "w-60",
      )} data-open={isMobile && mobileDrawerOpen || undefined}>
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between p-3 border-b">
          <h1 className={cn("font-semibold text-lg", collapsed && !isMobile && "hidden")}>RBAC</h1>
          {isMobile && (
            <Button variant="ghost" size="icon" onClick={() => setMobileDrawerOpen(false)}><X className="h-4 w-4" /></Button>
          )}
        </div>

        {/* 区域：菜单列表；设计：递归渲染 directory → menu 层级 */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredMenus.map(perm => (
            <div key={perm.id}>
              {perm.menuType === 'directory' && (
                <div className="space-y-1">
                  {!collapsed && (
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                      <DynamicIcon name={perm.icon} className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{perm.label}</span>
                    </div>
                  )}
                  {perm.children?.filter(c => c.menuType === 'menu' && c.path).map(child => (
                    <Button
                      key={child.id}
                      variant={location.pathname === child.path ? "secondary" : "ghost"}
                      className={cn("w-full justify-start gap-2", collapsed && !isMobile && "justify-center px-2")}
                      onClick={() => handleNavigate(child.path!)}
                    >
                      <DynamicIcon name={child.icon} className="h-4 w-4 flex-shrink-0" />
                      {(!collapsed || isMobile) && <span className="text-sm">{child.label}</span>}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* 区域：侧边栏底部用户信息 */}
        <div className="p-2 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className={cn("w-full justify-start gap-2", collapsed && !isMobile && "justify-center")}>
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {authStore.user?.nickname?.charAt(0) || authStore.user?.username?.charAt(0) || '?'}
                </AvatarFallback></Avatar>
                {(!collapsed || isMobile) && (
                  <div className="flex flex-col items-start text-xs">
                    <span className="font-medium">{authStore.user?.nickname || authStore.user?.username}</span>
                    <span className="text-muted-foreground">{authStore.user?.email}</span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => navigate('/profile')}><User className="h-4 w-4 mr-2" />个人设置</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive"><LogOut className="h-4 w-4 mr-2" />退出登录</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* 区域：主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 顶栏 */}
        <header className="flex items-center gap-2 px-4 py-2 border-b bg-card">
          {isMobile ? (
            <Button variant="ghost" size="icon" onClick={() => setMobileDrawerOpen(true)}><Menu className="h-4 w-4" /></Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          )}
          <div className="flex-1" />
          {/* 区域：主题切换按钮；设计：点击时以按钮位置为中心水波涟漪展开新主题 */}
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </header>

        {/* 页面内容 */}
        <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function findExternalLink(menus: Permission[], targetPath: string): boolean {
  for (const menu of menus) {
    if (menu.path === targetPath) return !!menu.isExternalLink
    if (menu.children?.length) { const found = findExternalLink(menu.children, targetPath); if (found) return true }
  }
  return false
}

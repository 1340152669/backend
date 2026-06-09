/**
 * useIcon — lucide-vue-next 图标解析工具
 *
 * 设计原理：将业务侧图标键名映射为 lucide-vue-next 图标组件，
 * 供 AppSidebarMenu 和 AppTabs 使用。与旧版 Arco Icon 保持相同 API。
 *
 * @example
 * import { getIconComponent } from '@rbac/ui/composables/useIcon'
 * <component :is="getIconComponent('user')" />
 */
import {
  Settings, LayoutDashboard, Home, User, Users, ShieldCheck, Lock,
  Building2, BarChart3, File, Folder, FileText, Image, Wrench, Code2,
  MessageSquare, Bell, Star, Clock, Calendar, Book, Database, MapPin,
  AppWindow, Menu, X, Sun, Moon, Plus, Minus, Search, Pen, Trash2,
  RefreshCw, MoreVertical, ChevronDown, ChevronRight, LogOut, Flag,
  type LucideIcon,
} from 'lucide-vue-next'
import type { Component } from 'vue'

/** 图标键名 → lucide-vue-next 组件映射 */
const ICON_MAP: Record<string, LucideIcon> = {
  // 系统功能
  system: Settings,
  setting: Settings,
  settings: Settings,
  dashboard: LayoutDashboard,
  home: Home,
  // 用户/角色/权限
  user: User,
  users: Users,
  role: ShieldCheck,
  roles: ShieldCheck,
  permission: Lock,
  permissions: Lock,
  // 部门/组织
  department: Building2,
  departments: Building2,
  dept: Building2,
  organization: Building2,
  // 数据/报表
  chart: BarChart3,
  report: FileText,
  statistics: BarChart3,
  // 内容管理
  file: File,
  folder: Folder,
  document: FileText,
  image: Image,
  // 系统工具
  tool: Wrench,
  config: Wrench,
  api: Code2,
  log: FileText,
  // 通知/消息
  message: MessageSquare,
  notification: Bell,
  bell: Bell,
  mail: MessageSquare,
  // 安全
  shield: ShieldCheck,
  lock: Lock,
  key: Lock,
  // 其他
  star: Star,
  flag: Flag,
  clock: Clock,
  calendar: Calendar,
  book: Book,
  database: Database,
  code: Code2,
  map: MapPin,
  // 默认
  default: File,
  // 菜单操作
  menu: Menu,
  close: X,
  sun: Sun,
  moon: Moon,
  export: LogOut,
  plus: Plus,
  minus: Minus,
  search: Search,
  pen: Pen,
  delete: Trash2,
  refresh: RefreshCw,
  more: MoreVertical,
  caretDown: ChevronDown,
  caretRight: ChevronRight,
  apps: AppWindow,
  common: File,
}

/**
 * 根据图标键名获取 lucide-vue-next 图标组件
 *
 * @param iconKey - 图标键名（如 'user'、'settings'）
 * @param fallback - 未匹配时的回退图标组件
 * @returns lucide-vue-next 图标组件
 */
export function getIconComponent(iconKey?: string, fallback?: Component): Component {
  if (!iconKey) return fallback ?? ICON_MAP.default!
  return ICON_MAP[iconKey] ?? fallback ?? ICON_MAP.default!
}

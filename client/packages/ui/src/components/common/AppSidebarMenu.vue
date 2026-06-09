<!--
  AppSidebarMenu（通用侧边栏菜单组件）

  设计原则：
  - 图标通过 useIcon 解析为 lucide-vue-next 图标组件
  - 设计 Token 驱动配色与间距，与 design-tokens.css 保持一致
  - 收起模式仅展示图标，展开模式展示图标 + 文字
  - 激活项使用左侧色条指示器强化视觉反馈
-->
<script setup lang="ts">
/**
 * AppSidebarMenu（通用侧边栏菜单组件）
 *
 * 设计原理：纯 CSS 自定义侧边栏菜单。group 为目录分组（不可导航），children 为可点击的菜单项。
 * 收起模式下 group 标题和菜单项文字均隐藏，仅显示图标并通过 title 属性提供悬浮提示。
 *
 * @param groups - 菜单分组数据（label, icon key, children）
 * @param activePath - 当前激活的路由路径，用于高亮匹配项
 * @param collapsed - 是否处于收起模式（仅图标）
 *
 * @example
 * <AppSidebarMenu :groups="menuGroups" :active-path="route.path" :collapsed="false" />
 *
 * @remarks
 * 激活匹配规则：activePath.startsWith(item.path)，因此 /users 可匹配 /users/create。
 */
import { computed } from 'vue'
import { getIconComponent } from '../../composables/useIcon'

export interface SidebarMenuItem {
  /** 菜单项显示名称 */
  label: string
  /** 图标键名（如 'user'、'settings'），由 useIcon 解析为 lucide-vue-next 组件 */
  icon: string
  /** 路由路径，与 activePath 前缀匹配时激活 */
  path: string
}

export interface SidebarMenuGroup {
  /** 分组名称，作为 :key 和 default-open 匹配标识 */
  label: string
  /** 分组图标键名 */
  icon: string
  /** 分组下的菜单项列表 */
  children: SidebarMenuItem[]
}

interface Props {
  groups: SidebarMenuGroup[]
  activePath: string
  collapsed: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ navigate: [path: string] }>()

/** 当前激活的菜单项 path 集合（用于高亮匹配） */
const selectedKeys = computed(() => {
  for (const group of props.groups) {
    for (const item of group.children) {
      // 原因：前缀匹配确保 /users 父级高亮时 /users/create 子路由页仍保持激活态
      if (props.activePath.startsWith(item.path)) return [item.path]
    }
  }
  return []
})

/** 默认展开的 group label 集合（当前激活项所在的分组） */
const defaultOpenGroups = computed(() => {
  return props.groups
    .filter(g => g.children.some(c => props.activePath.startsWith(c.path)))
    .map(g => g.label)
})

function handleClick(path: string) { emit('navigate', path) }
</script>

<template>
  <nav class="sidebar-nav">
    <div v-for="group in groups" :key="group.label" class="menu-group">
      <!-- 区域：分组标题；设计：收起模式仅图标 + title 悬浮提示，展开模式图标+文字+分割线 -->
      <div
        class="menu-group-header"
        :class="{ 'is-collapsed': collapsed }"
        :title="collapsed ? group.label : undefined"
      >
        <component :is="getIconComponent(group.icon)" class="menu-group-icon" />
        <span v-show="!collapsed" class="menu-group-label">{{ group.label }}</span>
      </div>

      <!-- 区域：分组子菜单项列表；设计：展开时缩进 8px 强化层级感 -->
      <div class="menu-items" :class="{ 'is-collapsed': collapsed }">
        <div
          v-for="item in group.children"
          :key="item.path"
          class="menu-item"
          :class="{
            'is-active': selectedKeys.includes(item.path),
            'is-collapsed': collapsed,
          }"
          :title="collapsed ? item.label : undefined"
          tabindex="0"
          role="menuitem"
          @click="handleClick(item.path)"
          @keydown.enter.prevent="handleClick(item.path)"
          @keydown.space.prevent="handleClick(item.path)"
        >
          <component :is="getIconComponent(item.icon)" class="menu-item-icon" />
          <span v-show="!collapsed" class="menu-item-label">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* ──── 容器 ──── */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0.375rem 0.5rem;
}

/* ──── 菜单分组 ──── */
.menu-group {
  margin-bottom: var(--space-1);
}

/* ──── 分组标题 ──── */
.menu-group-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  cursor: default;
  user-select: none;
  transition: color 0.15s;
}

/* 收起模式：标题文字隐藏后居中显示图标 */
.menu-group-header.is-collapsed {
  justify-content: center;
  padding: 0.5rem 0;
}

.menu-group-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  opacity: 0.5;
}

.menu-group-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ──── 菜单项列表容器 ──── */
.menu-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  /* 原因：内边距缩进强化分组层级，区分于分组标题 */
  padding-left: 0.5rem;
}

.menu-items.is-collapsed {
  padding-left: 0;
}

/* ──── 菜单项 ──── */
.menu-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  border-radius: var(--radius-comfortable);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s, color 0.15s, box-shadow 0.15s;
  /* 原因：预留左侧激活指示条空间，不与文字重叠 */
  overflow: hidden;
}

/* 收起模式：菜单项居中仅显示图标 */
.menu-item.is-collapsed {
  justify-content: center;
  padding: 0.5rem 0;
}

.menu-item:hover {
  background-color: var(--color-bg-snow);
  color: var(--color-text-primary);
}

/* 原因：键盘导航用户的可视焦点指示，不依赖鼠标悬停 */
.menu-item:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* ──── 菜单项：激活态 ────
   设计：浅色主题使用深色背景+浅色文字，深色主题使用浅色背景+深色文字，
   通过 --color-bg-active / --color-text-active 变量反转，确保与侧边栏高对比度。
   左侧色条仍使用 --color-accent，维持与主题色的视觉关联。 */
.menu-item.is-active {
  background-color: var(--color-bg-active);
  color: var(--color-text-active);
  font-weight: 500;
}

/* 原因：轻微加深激活背景作为悬浮反馈，避免纯透明度混合带来的色差问题 */
.menu-item.is-active:hover {
  background-color: color-mix(in srgb, var(--color-bg-active), #000 10%);
}

/* ──── 菜单项图标 ──── */
.menu-item-icon {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
  opacity: 0.85;
}

.menu-item.is-active .menu-item-icon {
  opacity: 1;
}

/* ──── 菜单项文字 ──── */
.menu-item-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

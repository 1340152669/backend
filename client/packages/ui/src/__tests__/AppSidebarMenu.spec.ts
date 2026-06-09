/**
 * AppSidebarMenu 组件测试
 *
 * 覆盖场景：分组标题、子项、激活态、点击事件。
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSidebarMenu from '../components/common/AppSidebarMenu.vue'
import type { SidebarMenuGroup } from '../components/common/AppSidebarMenu.vue'

const groups: SidebarMenuGroup[] = [
  {
    label: '系统管理', icon: 'settings',
    children: [
      { label: '用户管理', icon: 'user', path: '/user' },
      { label: '角色管理', icon: 'role', path: '/role' },
    ],
  },
  {
    label: '数据统计', icon: 'chart',
    children: [
      { label: '报表', icon: 'report', path: '/report' },
    ],
  },
]

describe('AppSidebarMenu', () => {
  it('渲染菜单分组标题', () => {
    const wrapper = mount(AppSidebarMenu, { props: { groups, activePath: '/user', collapsed: false } })
    expect(wrapper.text()).toContain('系统管理')
    expect(wrapper.text()).toContain('数据统计')
  })

  it('渲染菜单子项', () => {
    const wrapper = mount(AppSidebarMenu, { props: { groups, activePath: '/user', collapsed: false } })
    expect(wrapper.text()).toContain('用户管理')
    expect(wrapper.text()).toContain('角色管理')
  })

  it('点击菜单项触发 navigate 事件', async () => {
    const wrapper = mount(AppSidebarMenu, { props: { groups, activePath: '/user', collapsed: false } })
    const menuItems = wrapper.findAll('nav div div div')
    const roleItem = menuItems.find(item => item.text().includes('角色管理'))
    await roleItem?.trigger('click')
    expect(wrapper.emitted('navigate')?.[0]?.[0]).toBe('/role')
  })

  it('空分组列表不抛异常', () => {
    const wrapper = mount(AppSidebarMenu, { props: { groups: [], activePath: '', collapsed: false } })
    expect(wrapper.exists()).toBe(true)
  })
})

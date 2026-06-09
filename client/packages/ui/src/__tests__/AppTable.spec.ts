/**
 * AppTable 组件测试
 *
 * 覆盖场景：列渲染、数据行、加载态、空数据、点击事件。
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppTable from '../components/common/AppTable.vue'
import type { TableColumn } from '../components/common/AppTable.vue'

const columns: TableColumn[] = [
  { key: 'name', title: '姓名' },
  { key: 'age', title: '年龄' },
]

describe('AppTable', () => {
  it('有数据时渲染表头', () => {
    const data = [{ name: '张三', age: 25 }]
    const wrapper = mount(AppTable, { props: { columns, data: data as unknown as Record<string, unknown>[] } })
    expect(wrapper.find('thead').text()).toContain('姓名')
    expect(wrapper.find('thead').text()).toContain('年龄')
  })

  it('渲染数据行', () => {
    const data = [{ name: '张三', age: 25 }, { name: '李四', age: 30 }]
    const wrapper = mount(AppTable, { props: { columns, data: data as unknown as Record<string, unknown>[] } })
    expect(wrapper.text()).toContain('张三')
    expect(wrapper.text()).toContain('李四')
  })

  it('加载态显示提示', () => {
    const wrapper = mount(AppTable, { props: { columns, data: [], loading: true } })
    expect(wrapper.text()).toContain('加载中')
  })

  it('空数据显示默认文案', () => {
    const wrapper = mount(AppTable, { props: { columns, data: [] } })
    expect(wrapper.text()).toContain('暂无数据')
  })

  it('空数据自定义文案', () => {
    const wrapper = mount(AppTable, { props: { columns, data: [], emptyText: '没有找到记录' } })
    expect(wrapper.text()).toContain('没有找到记录')
  })

  it('行点击触发 row-click 事件', async () => {
    const data = [{ name: '张三', age: 25 }]
    const wrapper = mount(AppTable, { props: { columns, data: data as unknown as Record<string, unknown>[] } })
    await wrapper.find('table tbody tr').trigger('click')
    expect(wrapper.emitted('row-click')?.[0]?.[0]).toEqual({ name: '张三', age: 25 })
  })
})

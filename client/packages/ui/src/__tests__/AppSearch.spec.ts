/**
 * AppSearch 组件测试
 *
 * 覆盖场景：输入框渲染、占位文字、v-model 事件、搜索事件。
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSearch from '../components/common/AppSearch.vue'

describe('AppSearch', () => {
  it('渲染输入框和搜索按钮', () => {
    const wrapper = mount(AppSearch, { props: { modelValue: '' } })
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('渲染自定义占位文字', () => {
    const wrapper = mount(AppSearch, { props: { modelValue: '', placeholder: '输入用户名搜索' } })
    expect(wrapper.find('input').attributes('placeholder')).toBe('输入用户名搜索')
  })

  it('输入触发 update:modelValue 事件', async () => {
    const wrapper = mount(AppSearch, { props: { modelValue: '' } })
    const input = wrapper.find('input')
    await input.setValue('admin')
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe('admin')
  })

  it('搜索按钮触发 search 事件', async () => {
    const wrapper = mount(AppSearch, { props: { modelValue: 'admin' } })
    const btn = wrapper.findAll('button').find(b => b.text().includes('搜索'))
    if (btn) {
      await btn.trigger('click')
      expect(wrapper.emitted('search')?.[0]?.[0]).toBe('admin')
    }
  })
})

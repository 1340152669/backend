/**
 * AppFormItem 组件测试
 *
 * 覆盖场景：label、required、error 渲染。
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppFormItem from '../components/common/AppFormItem.vue'

describe('AppFormItem', () => {
  it('渲染标签', () => {
    const wrapper = mount(AppFormItem, { props: { label: '用户名' } })
    expect(wrapper.text()).toContain('用户名')
  })

  it('不传 label 时不渲染标签', () => {
    const wrapper = mount(AppFormItem, { props: {} })
    expect(wrapper.find('label').exists()).toBe(false)
  })

  it('必填时显示标记', () => {
    const wrapper = mount(AppFormItem, { props: { label: '邮箱', required: true } })
    expect(wrapper.find('label').text()).toContain('邮箱')
    expect(wrapper.text()).toContain('*')
  })

  it('渲染插槽内容', () => {
    const wrapper = mount(AppFormItem, {
      props: { label: '测试' },
      slots: { default: '<input class="test-input" />' },
    })
    expect(wrapper.find('.test-input').exists()).toBe(true)
  })

  it('显示错误信息', () => {
    const wrapper = mount(AppFormItem, { props: { label: '字段', error: '此项必填' } })
    expect(wrapper.text()).toContain('此项必填')
  })
})

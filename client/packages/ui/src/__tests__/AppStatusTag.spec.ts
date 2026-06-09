/**
 * AppStatusTag 组件测试
 *
 * 覆盖场景：
 * - 正常渲染 1（启用，绿色 Tag）/ 0（禁用，红色 Tag）
 * - 非法状态值回退为"禁用"
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppStatusTag from '../components/common/AppStatusTag.vue'

describe('AppStatusTag', () => {
  it('渲染启用状态 (1)，显示"启用"', () => {
    const wrapper = mount(AppStatusTag, { props: { status: 1 } })
    expect(wrapper.text()).toBe('启用')
  })

  it('渲染禁用状态 (0)，显示"禁用"', () => {
    const wrapper = mount(AppStatusTag, { props: { status: 0 } })
    expect(wrapper.text()).toBe('禁用')
  })

  it('非法状态值渲染为"禁用"，不抛异常', () => {
    const wrapper = mount(AppStatusTag, { props: { status: 99 as any } })
    expect(wrapper.text()).toBe('禁用')
  })
})

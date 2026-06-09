/**
 * AppModal 组件测试
 *
 * 基于 radix-vue Dialog，内容通过 Teleport 渲染到 body。
 * jsdom 环境下 Teleport 渲染不完整，所以验证重点在事件而非 DOM 内容。
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppModal from '../components/common/AppModal.vue'

describe('AppModal', () => {
  it('visible=false 时不渲染 DialogOverlay', () => {
    const wrapper = mount(AppModal, { props: { visible: false } })
    // radix-vue Dialog: visible=false 时 overlay 不存在
    expect(wrapper.find('[data-state="open"]').exists()).toBe(false)
  })

  it('visible=true 时渲染标题文案（通过 wrapper 内透传）', () => {
    const wrapper = mount(AppModal, { props: { visible: true, title: '编辑用户' } })
    expect(wrapper.html()).toContain('编辑用户')
  })

  it('渲染默认按钮文案', () => {
    const wrapper = mount(AppModal, { props: { visible: true } })
    expect(wrapper.html()).toContain('确认')
    expect(wrapper.html()).toContain('取消')
  })

  it('渲染自定义按钮文案', () => {
    const wrapper = mount(AppModal, { props: { visible: true, confirmText: '保存', cancelText: '返回' } })
    expect(wrapper.html()).toContain('保存')
    expect(wrapper.html()).toContain('返回')
  })

  it('渲染插槽内容', () => {
    const wrapper = mount(AppModal, {
      props: { visible: true },
      slots: { default: '<p class="slot-content">表单内容</p>' },
    })
    expect(wrapper.find('.slot-content').exists()).toBe(true)
    expect(wrapper.find('.slot-content').text()).toBe('表单内容')
  })

  it('点击确认触发 confirm 事件', async () => {
    const wrapper = mount(AppModal, { props: { visible: true } })
    const confirmBtn = wrapper.find('button:last-child')
    await confirmBtn.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('点击取消触发 cancel 事件', async () => {
    const wrapper = mount(AppModal, { props: { visible: true } })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('取消'))
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})

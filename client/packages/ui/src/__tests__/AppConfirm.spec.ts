/**
 * AppConfirm 组件测试
 *
 * 基于 AppModal（radix-vue Dialog），内容通过 Teleport 渲染到 body，
 * 因此验证通过 wrapper.html() 而非 document.body。
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppConfirm from '../components/common/AppConfirm.vue'

describe('AppConfirm', () => {
  it('visible=false 时不渲染 DialogOverlay', () => {
    const wrapper = mount(AppConfirm, { props: { visible: false } })
    expect(wrapper.find('[data-state="open"]').exists()).toBe(false)
  })

  it('visible=true 时渲染内容', () => {
    const wrapper = mount(AppConfirm, { props: { visible: true, content: '确定删除此用户？' } })
    expect(wrapper.html()).toContain('确定删除此用户？')
  })

  it('渲染默认标题和按钮文案', () => {
    const wrapper = mount(AppConfirm, { props: { visible: true } })
    expect(wrapper.html()).toContain('确认操作')
    expect(wrapper.html()).toContain('确认')
    expect(wrapper.html()).toContain('取消')
  })

  it('渲染自定义文案', () => {
    const wrapper = mount(AppConfirm, {
      props: { visible: true, title: '删除确认', content: '此操作不可恢复', confirmText: '删除', cancelText: '再想想' },
    })
    expect(wrapper.html()).toContain('删除确认')
    expect(wrapper.html()).toContain('此操作不可恢复')
    expect(wrapper.html()).toContain('删除')
    expect(wrapper.html()).toContain('再想想')
  })

  it('危险操作渲染（不抛异常）', () => {
    const wrapper = mount(AppConfirm, { props: { visible: true, danger: true, content: '危险操作确认' } })
    expect(wrapper.html()).toContain('危险操作确认')
  })

  it('点击确认触发 confirm 事件', async () => {
    const wrapper = mount(AppConfirm, { props: { visible: true } })
    const confirmBtn = wrapper.findAll('button').find(b => b.text().includes('确认'))
    await confirmBtn?.trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('点击取消触发 cancel 事件', async () => {
    const wrapper = mount(AppConfirm, { props: { visible: true } })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('取消'))
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})

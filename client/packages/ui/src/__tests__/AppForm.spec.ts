/**
 * AppForm 组件测试
 *
 * 基于 Arco Card + Form，测试 title、loading、按钮交互。
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppForm from '../components/common/AppForm.vue'

describe('AppForm', () => {
  it('渲染标题', () => {
    const wrapper = mount(AppForm, { props: { title: '测试表单' } })
    expect(wrapper.text()).toContain('测试表单')
  })

  it('渲染默认按钮文案', () => {
    const wrapper = mount(AppForm, { props: {} })
    expect(wrapper.text()).toContain('保存')
    expect(wrapper.text()).toContain('取消')
  })

  it('加载态下提交按钮禁用', () => {
    const wrapper = mount(AppForm, { props: { loading: true } })
    const submitBtn = wrapper.find('button[type="submit"]')
    expect(submitBtn.attributes('disabled')).toBeDefined()
  })

  it('只读模式隐藏操作按钮', () => {
    const wrapper = mount(AppForm, { props: { readonly: true } })
    // 应不显示取消或保存按钮
    expect(wrapper.text()).not.toContain('保存')
    expect(wrapper.text()).not.toContain('取消')
  })

  it('点击取消按钮触发 cancel 事件', async () => {
    const wrapper = mount(AppForm, { props: {} })
    const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('取消'))
    await cancelBtn?.trigger('click')
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('提交表单触发 submit 事件', async () => {
    const wrapper = mount(AppForm, { props: {} })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toBeTruthy()
  })
})

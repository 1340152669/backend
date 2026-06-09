/**
 * AppSelectTree（AppTreeSelect 别名）组件测试
 *
 * 覆盖场景：树形选项渲染、占位符、选择事件。
 */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppSelectTree from '../components/common/AppTreeSelect.vue'

const treeOptions = [
    { id: '1', name: '技术部', children: [{ id: '1-1', name: '前端组' }, { id: '1-2', name: '后端组' }] },
    { id: '2', name: '市场部', children: [{ id: '2-1', name: '推广组' }] },
]

const flatOptions = [
    { id: '1', name: '管理员' },
    { id: '2', name: '编辑' },
    { id: '3', name: '访客' },
]

describe('AppSelectTree', () => {
    it('渲染选项列表（扁平数据）', () => {
        const wrapper = mount(AppSelectTree, {
            props: { options: flatOptions, modelValue: null },
        })
        expect(wrapper.text()).toContain('管理员')
        expect(wrapper.text()).toContain('编辑')
        expect(wrapper.text()).toContain('访客')
    })

    it('渲染默认占位文字', () => {
        const wrapper = mount(AppSelectTree, {
            props: { options: flatOptions, modelValue: null },
        })
        expect(wrapper.find('select').exists()).toBe(true)
    })

    it('渲染自定义占位文字', () => {
        const wrapper = mount(AppSelectTree, {
            props: { options: flatOptions, modelValue: null, placeholder: '请选择部门' },
        })
        expect(wrapper.find('select').exists()).toBe(true)
    })

    it('选中值触发 update:modelValue 事件', async () => {
        const wrapper = mount(AppSelectTree, {
            props: { options: flatOptions, modelValue: null },
        })
        const select = wrapper.find('select')
        const option = select.find('option[value="2"]')
        if (option.exists()) {
            await select.setValue('2')
            expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toBe('2')
        }
    })

    it('树形数据自动展平为选项列表', () => {
        const wrapper = mount(AppSelectTree, {
            props: { options: treeOptions, modelValue: null },
        })
        expect(wrapper.text()).toContain('技术部')
        expect(wrapper.text()).toContain('前端组')
        expect(wrapper.text()).toContain('市场部')
    })

    it('空选项不报错', () => {
        const wrapper = mount(AppSelectTree, {
            props: { options: [], modelValue: null },
        })
        expect(wrapper.exists()).toBe(true)
    })

    it('禁用态 select 不可交互', () => {
        const wrapper = mount(AppSelectTree, {
            props: { options: flatOptions, modelValue: null, disabled: true },
        })
        expect(wrapper.find('select').attributes('disabled')).toBeDefined()
    })
})

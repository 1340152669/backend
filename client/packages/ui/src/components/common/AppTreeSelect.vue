<!--
  AppTreeSelect（树形下拉选择器）

  设计原则：基于原生 select + 分组实现，支持 options/treeData 两种数据格式。
  因纯 CSS 无法渲染展开/折叠树，使用展平的 select 分组展示层级关系。
-->
<script setup lang="ts">
/**
 * AppTreeSelect（树形下拉选择器）
 *
 * 将树形结构展平为扁平的分组选项，通过前缀缩进（--）表示层级。
 *
 * @param modelValue - 选中值（v-model，单选时为 string，多选时为 string[]）
 * @param options - 树形选项数据（旧版命名，优先使用 treeData）
 * @param treeData - 树形数据
 * @param allowClear - 是否允许清除
 * @param placeholder - 占位文本
 * @param disabled - 是否禁用
 * @param size - 尺寸（mini/small/default/large）
 * @param multiple - 是否多选
 */
import { computed } from 'vue'

export interface SelectTreeOption {
  id: string
  name: string
  /** 后备显示文本（当 name 不存在时使用，如 Permission 数据的 label） */
  label?: string
  children?: SelectTreeOption[]
  disabled?: boolean
}

interface Props {
  modelValue?: string | string[] | number | number[] | null
  options?: SelectTreeOption[]
  treeData?: SelectTreeOption[]
  allowClear?: boolean
  placeholder?: string
  disabled?: boolean
  size?: 'mini' | 'small' | 'default' | 'large'
  multiple?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  options: () => [],
  allowClear: false,
  placeholder: '请选择',
  disabled: false,
  size: 'default',
  multiple: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | string[] | number | number[] | null | undefined]
  change: [value: string | string[] | number | number[] | null | undefined]
}>()

// 展平树形结构为扁平选项列表
interface FlatOption { value: string; label: string; disabled: boolean }

/**
 * 展平树形结构为扁平选项列表
 *
 * @param items - 树形选项数据
 * @param depth - 当前递归深度，用于缩进前缀
 *
 * @remarks
 * 兼容两种数据格式（name / label），当 name 不存在时回退到 label，
 * 确保 Permission 等使用 label 字段的数据也能正常展示。
 */
function flattenTree(items: SelectTreeOption[], depth = 0): FlatOption[] {
  const result: FlatOption[] = []
  for (const item of items) {
    const displayText = item.name || item.label || ''
    result.push({
      value: item.id,
      label: depth > 0 ? '─ '.repeat(depth) + displayText : displayText,
      disabled: item.disabled ?? false,
    })
    if (item.children?.length) {
      result.push(...flattenTree(item.children, depth + 1))
    }
  }
  return result
}

const flatOptions = computed(() => flattenTree(props.treeData ?? props.options))

const sizeClass = computed(() => {
  switch (props.size) {
    case 'mini': return 'text-xs px-2 py-1'
    case 'small': return 'text-sm px-2.5 py-1'
    case 'large': return 'text-base px-4 py-2.5'
    default: return 'text-sm px-3 py-1.5'
  }
})

function handleChange(e: Event) {
  const target = e.target as HTMLSelectElement
  if (props.multiple) {
    const values = Array.from(target.selectedOptions).map(o => o.value)
    emit('update:modelValue', values)
    emit('change', values)
  } else {
    const value = target.value || null
    emit('update:modelValue', value)
    emit('change', value)
  }
}
</script>

<template>
  <div class="relative w-full">
    <select
      :multiple="multiple"
      :disabled="disabled"
      :value="modelValue ?? ''"
      class="w-full border border-[var(--color-border-section)] rounded-[var(--radius-comfortable)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      :class="sizeClass"
      @change="handleChange"
    >
      <option value="" disabled>{{ placeholder }}</option>
      <option
        v-for="opt in flatOptions"
        :key="opt.value"
        :value="opt.value"
        :disabled="opt.disabled"
      >{{ opt.label }}</option>
    </select>
  </div>
</template>

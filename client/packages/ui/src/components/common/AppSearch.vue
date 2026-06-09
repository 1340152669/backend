<!--
  AppSearch（通用搜索组件）

  设计原则：基于原生 input + button 实现，v-model + @search 接口保持不变。
-->
<script setup lang="ts">
/**
 * AppSearch（通用搜索组件）
 *
 * @param modelValue - 搜索关键词（v-model）
 * @param placeholder - 输入框占位文字，默认"搜索..."
 */
import AppButton from './AppButton.vue'
interface Props {
  modelValue: string
  placeholder?: string
}

const props = withDefaults(defineProps<Props>(), { placeholder: '搜索...' })

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
}>()

function handleInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
}

function handleSearch() {
  emit('search', props.modelValue)
}

function handleKeydown(e: KeyboardEvent) {
  // 原因：回车键触发搜索，与用户预期一致
  if (e.key === 'Enter') handleSearch()
}
</script>

<template>
  <div class="flex items-center gap-0">
    <input
      :value="modelValue"
      :placeholder="placeholder"
      class="px-3 py-1.5 text-sm border border-r-0 border-[var(--color-border-section)] rounded-l-[var(--radius-comfortable)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent)] transition-colors w-48"
      @input="handleInput"
      @keydown="handleKeydown"
    />
    <!-- 区域：搜索触发按钮；设计：附着在输入框右侧，复用 AppButton 保持一致性 -->
    <AppButton
      @click="handleSearch"
    >
      搜索
    </AppButton>
  </div>
</template>

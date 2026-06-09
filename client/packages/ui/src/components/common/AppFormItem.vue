<!--
  AppFormItem（表单项组件）

  设计原理：纯 CSS 实现的表单字段容器，label/required/error 由原生元素控制。
-->
<script setup lang="ts">
/**
 * AppFormItem（表单项组件）
 *
 * @param label - 字段标签文字
 * @param required - 显示必填标记
 * @param error - 校验错误信息
 */
interface Props {
  label?: string
  required?: boolean
  error?: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex flex-col gap-1.5 mb-4">
    <label v-if="label" class="text-sm font-medium text-[var(--color-text-secondary)]">
      {{ label }}
      <span v-if="required" class="text-[var(--color-danger)] ml-0.5">*</span>
    </label>
    <slot />
    <p v-if="error" class="text-xs text-[var(--color-danger)] mt-0.5">{{ error }}</p>
  </div>
</template>

<!--
  AppForm（通用表单组件）

  设计原则：纯 CSS 卡片布局 + 原生 form，保持原有的 title/submit/cancel/loading props。
-->
<script setup lang="ts">
/**
 * AppForm（通用表单组件）
 *
 * @param title - 表单标题
 * @param submitText - 提交按钮文本，默认"保存"
 * @param cancelText - 取消按钮文本，默认"取消"
 * @param loading - 提交中状态
 * @param readonly - 只读模式（隐藏操作按钮）
 */
import AppButton from './AppButton.vue'
interface Props {
  title?: string
  submitText?: string
  cancelText?: string
  loading?: boolean
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '', submitText: '保存', cancelText: '取消', loading: false, readonly: false,
})

const emit = defineEmits<{ submit: []; cancel: [] }>()
</script>

<template>
  <div class="max-w-[640px]">
    <div class="border border-[var(--color-border-card)] rounded-[var(--radius-signature)] bg-[var(--color-bg-card)]">
      <div v-if="title" class="px-6 pt-5 pb-0">
        <h3 class="text-base font-medium text-[var(--color-text-primary)]">{{ title }}</h3>
      </div>
      <form class="p-6 flex flex-col gap-4" @submit.prevent="emit('submit')">
        <slot />
        <!-- 区域：表单操作按钮；设计：只在非只读模式下显示，复用 AppButton 保持样式一致 -->
        <div v-if="!readonly" class="flex justify-end gap-2 pt-2">
          <AppButton
            type="button"
            @click="emit('cancel')"
          >{{ cancelText }}</AppButton>
          <AppButton
            variant="primary"
            type="submit"
            :loading="loading"
          >{{ loading ? '提交中...' : submitText }}</AppButton>
        </div>
      </form>
    </div>
  </div>
</template>

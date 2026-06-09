<!--
  AppConfirm（通用确认对话框组件）

  设计原理：基于 AppModal 封装，简化确认场景使用。danger 属性控制确认按钮颜色。
-->
<script setup lang="ts">
/**
 * AppConfirm（通用确认对话框组件）
 *
 * 简化确认弹窗使用，danger 属性切换确认按钮为红色危险样式。
 *
 * @param visible - 弹窗是否可见（v-model:visible）
 * @param title - 标题
 * @param content - 确认提示内容
 * @param confirmText - 确认按钮文本
 * @param cancelText - 取消按钮文本
 * @param danger - 是否为危险操作（红色确认按钮）
 * @param confirmLoading - 确认按钮加载状态
 */
import AppModal from './AppModal.vue'

interface Props {
  visible: boolean
  title?: string
  content?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  confirmLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '确认操作', content: '确定执行此操作？', confirmText: '确认', cancelText: '取消', danger: false, confirmLoading: false,
})

const emit = defineEmits<{ 'update:visible': [value: boolean]; confirm: []; cancel: [] }>()

function onCancel() { emit('cancel') }
function onConfirm() { emit('confirm') }
function close() { emit('update:visible', false) }

// 危险模式：确认按钮使用红色样式
const dangerBtnProps = { class: '!bg-[var(--color-danger)] !hover:opacity-90' }
</script>

<template>
  <AppModal
    :visible="visible"
    :title="title"
    :confirm-text="confirmText"
    :cancel-text="cancelText"
    :confirm-loading="confirmLoading"
    :ok-button-props="danger ? dangerBtnProps : undefined"
    @update:visible="close"
    @confirm="onConfirm"
    @cancel="onCancel"
  >
    <p class="text-base text-[var(--color-text-secondary)] leading-relaxed">{{ content }}</p>
    <slot />
  </AppModal>
</template>

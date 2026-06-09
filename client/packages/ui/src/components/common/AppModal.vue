<!--
  AppModal（通用弹窗组件）

  设计原理：基于原生 DOM 实现，不使用 radix-vue Dialog。
  保持 visible/title/confirmText 等外部接口不变。
-->
<script setup lang="ts">
/**
 * AppModal（通用弹窗组件）
 *
 * 实现原理：v-if + Teleport + 固定定位居中，支持点击遮罩关闭、Escape 键关闭。
 *
 * @param visible - 弹窗是否可见（v-model:visible）
 * @param title - 弹窗标题
 * @param width - 弹窗宽度
 * @param confirmText - 确认按钮文本
 * @param cancelText - 取消按钮文本
 * @param hideCancel - 是否隐藏取消按钮
 * @param confirmLoading - 确认按钮加载状态
 * @param okButtonProps - 透传给确认按钮的额外属性
 */
import { onMounted, onUnmounted } from 'vue'
import AppButton from './AppButton.vue'

interface Props {
  visible: boolean
  title?: string
  width?: string
  confirmText?: string
  cancelText?: string
  hideCancel?: boolean
  confirmLoading?: boolean
  okButtonProps?: Record<string, unknown>
}

const props = withDefaults(defineProps<Props>(), {
  title: '提示', width: '480px', confirmText: '确认', cancelText: '取消', hideCancel: false, confirmLoading: false, okButtonProps: undefined,
})

const emit = defineEmits<{ 'update:visible': [value: boolean]; confirm: []; cancel: [] }>()

function onOverlayClick() {
  emit('update:visible', false)
}

function onOk() { emit('confirm') }
function onCancel() { emit('cancel') }

// 原因：Escape 键关闭弹窗，保持与 radix-vue Dialog 默认行为一致
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.visible) {
    emit('update:visible', false)
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <!-- 区域：弹窗遮罩+内容；设计：v-if 控制显隐，点击遮罩关闭，点击内容区不关闭 -->
    <div v-if="visible" class="modal-wrapper">
      <!-- 遮罩层：半透明黑色，点击关闭 -->
      <div class="fixed inset-0 z-50 bg-black/40" @click="onOverlayClick" />
      <!-- 区域：弹窗内容容器；设计：flex 居中定位，忽略遮罩层点击事件 -->
      <div class="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" @keydown="onKeydown">
        <div
          class="w-full rounded-[var(--radius-signature)] bg-[var(--color-bg-card)] p-6 shadow-lg max-h-[85vh] overflow-y-auto pointer-events-auto"
          :style="{ maxWidth: width }"
        >
          <h2 class="text-lg font-medium text-[var(--color-text-primary)] mb-4">{{ title }}</h2>

          <div class="text-sm text-[var(--color-text-secondary)] mb-6">
            <slot />
          </div>

          <!-- 区域：弹窗操作按钮区；设计：取消在左（ghost），确认在右（primary） -->
          <div class="flex justify-end gap-2">
            <AppButton
              v-if="!hideCancel"
              @click="onCancel"
            >{{ cancelText }}</AppButton>
            <AppButton
              variant="primary"
              :disabled="confirmLoading"
              v-bind="okButtonProps || {}"
              @click="onOk"
            >{{ confirmText }}</AppButton>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

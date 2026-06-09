<!--
  AppStatusTag（通用状态标签组件）

  设计原则：将业务状态码（0/1）映射为语义色标签展示。
  颜色使用设计 Token 中的语义色 CSS 变量（--color-success / --color-danger 等），
  由设计系统统一控制深浅主题切换，避免依赖 Tailwind dark: 变体。
-->
<script setup lang="ts">
/**
 * AppStatusTag（通用状态标签组件）
 *
 * 根据状态码显示颜色和文本：1→绿色启用，0→红色禁用。
 * 颜色从设计 Token（design-tokens.css）继承，自动适配深浅主题。
 *
 * @param status - 状态值：1（启用/绿色），0（禁用/红色）
 */
interface Props { status: number }
const props = defineProps<Props>()
</script>

<template>
  <span
    class="app-status-tag"
    :class="props.status === 1 ? 'tag-enabled' : 'tag-disabled'"
  >
    <span class="status-dot" />
    {{ props.status === 1 ? '启用' : '禁用' }}
  </span>
</template>

<style scoped>
.app-status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 9999px;
  font-size: 0.8571rem;
  font-weight: 500;
  line-height: 1.4;
}
.tag-enabled {
  color: var(--color-success);
  background: var(--color-bg-success);
}
.tag-disabled {
  color: var(--color-text-muted);
  background: var(--color-bg-snow);
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.tag-enabled .status-dot {
  background: var(--color-success);
}
.tag-disabled .status-dot {
  background: var(--color-text-muted);
}
</style>

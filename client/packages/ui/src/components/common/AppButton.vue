<!--
  AppButton（通用按钮组件）

  设计原理：基于原生 button + Tailwind 样式实现，variant/size 映射为
  Tailwind 样式变体。调用方无需感知底层实现细节。
--><script setup lang="ts">
/**
 * AppButton（通用按钮组件）
 *
 * variant 映射规则：
 * - ghost（默认）→ 透明背景+边框，主题色自适应
 * - primary → 与 ghost 相同，使用主题自适应 CSS 变量（--color-border-section / --color-text-primary）
 * - danger → 红色危险按钮
 *
 * @param variant - 按钮风格：primary／ghost（默认）／danger
 * @param size - 尺寸：sm／md（默认）／lg
 * @param disabled - 禁用状态
 * @param loading - 加载中状态
 * @param icon - 纯图标模式，渲染为圆形按钮
 * @param active - 激活态（添加高亮样式）
 * @param block - 块级按钮（宽度 100%）
 */


interface Props {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: boolean
  active?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'ghost',
  size: 'md',
  disabled: false,
  loading: false,
  icon: false,
  active: false,
  block: false,
})
</script>

<template>
  <button
    class="app-btn"
    :class="[
      `variant-${props.variant}`,
      `size-${props.size}`,
      props.icon ? 'is-icon' : '',
      props.block ? 'is-block' : '',
      props.active ? 'is-active' : '',
      props.disabled || props.loading ? 'is-disabled' : '',
    ]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="btn-loading-spinner" />
    <slot v-else />
  </button>
</template>

<style scoped>
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  font-weight: 500;
  transition: all 0.15s;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  border-radius: var(--radius-comfortable, 8px);
}

.app-btn.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ──── 变体：ghost（默认） ──── */
.app-btn.variant-ghost {
  background: transparent;
  border-color: var(--color-border-section);
  color: var(--color-text-primary);
}
.app-btn.variant-ghost:hover {
  background: var(--color-bg-snow);
}
.app-btn.variant-ghost:active {
  background: var(--color-bg-elevated);
}

/* ──── 变体：primary ────
     设计：使用与 ghost 相同的 CSS 变量驱动主题适配（--color-border-section / --color-text-primary），
     这些变量在 design-tokens.css 中定义了明暗双主题值，且不被 useAppSettings 内联覆盖，
     因此 primary 按钮能像搜索按钮一样在深色模式下自动变化 */
.app-btn.variant-primary {
  background: transparent;
  border-color: var(--color-border-section);
  color: var(--color-text-primary);
}
.app-btn.variant-primary:hover {
  background: var(--color-bg-snow);
}

/* ──── 变体：danger ──── */
.app-btn.variant-danger {
  background: var(--color-danger);
  color: var(--color-text-inverse, #fff);
  border-color: transparent;
}
.app-btn.variant-danger:hover {
  opacity: 0.9;
}


/* ──── 尺寸 ──── */
.app-btn.size-sm { padding: 0.25rem 0.75rem; font-size: 0.75rem; }
.app-btn.size-md { padding: 0.375rem 1rem; font-size: 0.875rem; }
.app-btn.size-lg { padding: 0.625rem 1.5rem; font-size: 1rem; }

/* ──── 图标模式 ──── */
.app-btn.is-icon {
  padding: 0.5rem;
  border-radius: 9999px;
  aspect-ratio: 1;
}

/* ──── 块级 ──── */
.app-btn.is-block { width: 100%; }

/* ──── 激活态 ──── */
.app-btn.is-active {
  box-shadow: 0 0 0 2px var(--color-accent), 0 0 0 3px var(--color-bg-card);
}

/* ──── 加载动画 ──── */
.btn-loading-spinner {
  display: inline-block;
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 9999px;
  animation: btn-spin 0.6s linear infinite;
}

@keyframes btn-spin {
  to { transform: rotate(360deg); }
}
</style>

<!--
  AppTable（通用表格组件）

  设计原则：纯 CSS 表格实现，保持原有的 columns/data/loading/row-click 等 props。
  树状表格通过缩进展示层级关系。
-->
<script setup lang="ts">
/**
 * AppTable（通用表格组件）
 *
 * 纯 CSS 表格，支持列配置、加载态、行点击、树状数据展示。
 *
 * @param columns - 表格列定义（{ key, title, width?, align? }）
 * @param data - 表格数据
 * @param loading - 加载中状态
 * @param emptyText - 空数据提示文字
 * @param rowKey - 行数据中的唯一标识字段名，默认 'id'
 * @param indentField - 树状表格缩进层级字段名
 * @param hasChildrenField - 树状表格子节点标记字段名
 * @param rowClass - 行样式类名（字符串或函数）
 */
import { computed } from 'vue'

export interface TableColumn {
  key: string
  title: string
  width?: string
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'  // 固定列位置（ sticky 定位，横向滚动时可见）
}

interface Props {
  columns: TableColumn[]
  data: Record<string, unknown>[]
  loading?: boolean
  emptyText?: string
  rowKey?: string
  indentField?: string
  hasChildrenField?: string
  rowClass?: string | ((row: Record<string, unknown>) => string)
}

const props = withDefaults(defineProps<Props>(), { loading: false, emptyText: '暂无数据' })

interface Emits { (e: 'row-click', row: Record<string, unknown>, index: number): void }
const emit = defineEmits<Emits>()

const alignMap: Record<string, string> = { left: 'text-left', center: 'text-center', right: 'text-right' }

function resolveRowClass(row: Record<string, unknown>, index: number): string {
  if (typeof props.rowClass === 'function') return props.rowClass(row)
  return props.rowClass || ''
}

function getIndent(row: Record<string, unknown>): number {
  // 原因：indentField 代表当前缩进层级数值，用于树状表格展示层级缩进
  if (!props.indentField) return 0
  return (row[props.indentField] as number) ?? 0
}

/**
 * 生成单元格固定列样式（sticky 定位）
 *
 * 设计原理：为 fixed 列添加 position:sticky 使其在横向滚动时固定，避免操作列被滚动遮挡。
 *
 * @param col - 列配置对象
 * @param isHeader - 是否为表头单元格（表头与表体的背景色不同）
 * @returns CSS 样式对象，非固定列返回空对象
 */
function getCellStyle(col: TableColumn, isHeader = false): Record<string, string> {
  if (!col.fixed) return {}
  const style: Record<string, string> = {
    position: 'sticky',
    zIndex: String(isHeader ? 20 : 10),
    background: isHeader ? 'var(--color-bg-snow)' : 'var(--color-bg-card)',
  }
  if (col.fixed === 'right') {
    style.right = '0'
    // 原因：右侧阴影增强固定列与滚动内容的视觉分隔
    style.boxShadow = '-4px 0 8px rgba(0,0,0,0.06)'
  } else if (col.fixed === 'left') {
    style.left = '0'
    style.boxShadow = '4px 0 8px rgba(0,0,0,0.06)'
  }
  return style
}
</script>

<template>
  <div class="w-full overflow-x-auto border border-[var(--color-border-card)] rounded-[var(--radius-comfortable)] bg-[var(--color-bg-card)]">
    <!-- 区域：表格加载中状态；设计：在表格上方显示半透明遮罩+旋转指示器 -->
    <div v-if="loading" class="flex items-center justify-center py-12 text-[var(--color-text-muted)]">
      <span class="inline-block w-5 h-5 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mr-2" />
      加载中...
    </div>
    <table v-else-if="data.length > 0" class="w-full text-sm">
      <thead>
        <tr class="border-b border-[var(--color-border-card)] bg-[var(--color-bg-snow)]">
          <!-- 区域：表头行；设计：fixed 列使用 sticky 定位保持可见，非固定列可横向滚动 -->
          <th
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-2.5 font-medium text-[var(--color-text-muted)] text-xs uppercase tracking-wider"
            :class="[alignMap[col.align || 'left'] || 'text-left']"
            :style="getCellStyle(col, true)"
          >{{ col.title }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, rowIndex) in data"
          :key="row[rowKey || 'id'] as string ?? rowIndex"
          class="border-b border-[var(--color-border-card)] last:border-b-0 hover:bg-[var(--color-bg-snow)] transition-colors cursor-pointer"
          :class="resolveRowClass(row, rowIndex)"
          @click="emit('row-click', row, rowIndex)"
        >
          <td
            v-for="col in columns"
            :key="col.key"
            class="px-4 py-2.5 text-[var(--color-text-secondary)]"
            :class="alignMap[col.align || 'left'] || 'text-left'"
            :style="{
              ...getCellStyle(col, false),
              paddingLeft: col === columns[0] ? `${16 + getIndent(row) * 20}px` : undefined,
            }"
          >
            <!-- 透传每个列的插槽：slot name = column key；同时传递缩进和子节点标记给父组件 -->
            <slot :name="col.key" :row="row" :index="rowIndex" :indent="getIndent(row)" :hasChildren="props.hasChildrenField ? Boolean(row[props.hasChildrenField]) : false">
              {{ row[col.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- 区域：空数据状态；设计：居中显示 emptyText -->
    <div v-else class="flex items-center justify-center py-12 text-sm text-[var(--color-text-muted)]">
      {{ emptyText }}
    </div>
  </div>
</template>

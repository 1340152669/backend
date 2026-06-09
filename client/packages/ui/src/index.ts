/**
 * @rbac/ui — 通用 UI 组件库（不含 radix-vue 封装）
 *
 * 设计原则：
 * - 只保留自封装的纯 UI 组件，无第三方依赖
 * - Props + 插槽驱动，无业务逻辑
 *
 * radix-vue 封装的组件已迁移至 @rbac/client/src/components/ui/：
 * AppToast、AppPagination、AppTabs
 * useToast 已同步迁移至 @rbac/client/src/composables/useToast
 *
 * 用法：
 * ```ts
 * import { AppTable, AppForm } from '@rbac/ui'
 * ```
 */

export { usePropValidation } from './composables/usePropValidation'

export { getIconComponent } from './composables/useIcon'

export { default as AppButton } from './components/common/AppButton.vue'

export { default as AppTable } from './components/common/AppTable.vue'
export type { TableColumn } from './components/common/AppTable.vue'

export { default as AppForm } from './components/common/AppForm.vue'
export { default as AppFormItem } from './components/common/AppFormItem.vue'
export { default as AppModal } from './components/common/AppModal.vue'
export { default as AppConfirm } from './components/common/AppConfirm.vue'
export { default as AppSearch } from './components/common/AppSearch.vue'
export { default as AppStatusTag } from './components/common/AppStatusTag.vue'
export { default as AppSidebarMenu } from './components/common/AppSidebarMenu.vue'
export type { SidebarMenuItem, SidebarMenuGroup } from './components/common/AppSidebarMenu.vue'
export { default as AppTreeSelect } from './components/common/AppTreeSelect.vue'
export type { SelectTreeOption } from './components/common/AppTreeSelect.vue'
// 向后兼容：AppSelectTree 已重命名为 AppTreeSelect
export { default as AppSelectTree } from './components/common/AppTreeSelect.vue'

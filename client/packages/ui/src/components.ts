/**
 * @rbac/ui Vue 插件 — 全局注册所有 UI 组件（不含 radix-vue 封装）
 *
 * 设计原则：
 * - 仅在 main.ts 中运行时使用
 * - 只保留自封装的纯 UI 组件
 *
 * 用法：
 * ```ts
 * import { RbacUiPlugin } from '@rbac/ui/components'
 * app.use(RbacUiPlugin)
 * ```
 */
import type { App } from 'vue'

import AppButton from './components/common/AppButton.vue'
import AppTable from './components/common/AppTable.vue'
import AppForm from './components/common/AppForm.vue'
import AppFormItem from './components/common/AppFormItem.vue'
import AppModal from './components/common/AppModal.vue'
import AppConfirm from './components/common/AppConfirm.vue'
import AppSearch from './components/common/AppSearch.vue'
import AppStatusTag from './components/common/AppStatusTag.vue'
import AppSidebarMenu from './components/common/AppSidebarMenu.vue'
import AppTreeSelect from './components/common/AppTreeSelect.vue'

/**
 * Vue 插件 — 全局注册 @rbac/ui 所有组件
 *
 * @remarks
 * 启用后可在模板中直接使用 <AppTable>、<AppModal> 等，无需局部 import。
 *
 * 注意：基于 radix-vue 的组件（AppToast、AppPagination、AppTabs）
 * 已在 @rbac/client 中注册，见 main.ts 中的手动注册。
 */
export const RbacUiPlugin = {
  install(app: App): void {
    app.component('AppButton', AppButton)
    app.component('AppTable', AppTable)
    app.component('AppForm', AppForm)
    app.component('AppFormItem', AppFormItem)
    app.component('AppModal', AppModal)
    app.component('AppConfirm', AppConfirm)
    app.component('AppSearch', AppSearch)
    app.component('AppStatusTag', AppStatusTag)
    app.component('AppSidebarMenu', AppSidebarMenu)
    app.component('AppTreeSelect', AppTreeSelect)
    // 向后兼容：旧名称 AppSelectTree 保留
    app.component('AppSelectTree', AppTreeSelect)
  },
}

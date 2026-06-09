<script setup lang="ts">
/**
 * AppSelectTree（通用树形选择器）
 *
 * 设计原则：
 * - 基于 Arco Design TreeSelect API 设计 — 点击触发器展开下拉面板，面板内渲染树形
 * - 多选模式下选中项以标签（tag）展示在触发器内，超出 maxTagCount 显示 +N
 * - 支持搜索过滤、级联选中/取消、允许清除、加载态
 * - 保留 type="flat" 兼容旧版行内扁平列表模式
 *
 * @example
 * <!-- 树形多选（默认） -->
 * <AppSelectTree :options="departmentTree" v-model="form.departmentIds" />
 * <!-- 树形单选 -->
 * <AppSelectTree :options="treeData" v-model="form.selectedId" selection-type="single" />
 * <!-- 带搜索 -->
 * <AppSelectTree :options="treeData" v-model="form.ids" show-search allow-clear />
 *
 * @see https://arco.design/vue/component/tree-select
 */
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { z } from 'zod'
import { usePropValidation } from '../../composables/usePropValidation'

// ── 组件实例唯一 ID（用于 radio name 分组） ──
let _uidCounter = 0
const uid = `app-select-tree-${++_uidCounter}-${Date.now()}`

// ── 公开类型 ──

/** 选择器选项节点（兼容旧版） */
export interface SelectTreeOption {
    id: string
    name: string
    children?: SelectTreeOption[]
    disabled?: boolean
}

/** 字段名映射（Arco Design 兼容） */
export interface TreeFieldNames {
    /** 节点唯一标识字段名，默认 'id' */
    key?: string
    /** 节点显示文本字段名，默认 'name' */
    title?: string
    /** 子节点数组字段名，默认 'children' */
    children?: string
    /** 禁用字段名，默认 'disabled' */
    disabled?: string
}

/** 选中值回填策略（Arco Design 兼容） */
export type CheckedStrategy = 'all' | 'parent' | 'child'

// ── 内部类型 ──

/** 扁平化树节点（用于渲染层） */
interface FlatNode {
    id: string
    title: string
    level: number
    hasChildren: boolean
    isExpanded: boolean
    isDisabled: boolean
    /** 该节点在原始树中的路径引用，用于级联操作 */
    origin: SelectTreeOption
}

// ── Props ──

const defaultFieldNames: Required<TreeFieldNames> = {
    key: 'id',
    title: 'name',
    children: 'children',
    disabled: 'disabled',
}

interface Props {
    /** v-model 选中值 */
    modelValue: (string | number)[]

    /** 树形数据（Arco Design 命名，优先级高于 options） */
    treeData?: SelectTreeOption[]
    /** 树形数据（兼容旧版命名） */
    options?: SelectTreeOption[]

    /** 显示模式：tree — 下拉树选择器（默认）；flat — 行内扁平列表 */
    type?: 'tree' | 'flat'
    /** 选择模式：multiple — 多选（默认）；single — 单选 */
    selectionType?: 'multiple' | 'single'

    // ── Arco Design 兼容扩展 ──

    /** 是否多选（等价于 selectionType === 'multiple'） */
    multiple?: boolean
    /** 是否显示复选框（多选时默认 true） */
    treeCheckable?: boolean
    /** 是否开启严格模式（父子节点选中不关联，默认 false 即级联） */
    treeCheckStrictly?: boolean
    /** 选中值回填策略 */
    treeCheckedStrategy?: CheckedStrategy

    /** 是否允许清除 */
    allowClear?: boolean
    /** 是否启用搜索过滤 */
    showSearch?: boolean
    /** 自定义过滤函数 */
    filterTreeNode?: (keyword: string, node: SelectTreeOption) => boolean
    /** 占位文本 */
    placeholder?: string
    /** 多选时最多显示的标签数（超出显示 +N） */
    maxTagCount?: number
    /** 最多可选数量（超过此值时旧选项被新选项替换，默认不限） */
    max?: number
    /** 是否禁用 */
    disabled?: boolean
    /** 是否加载中 */
    loading?: boolean
    /** 尺寸 */
    size?: 'mini' | 'small' | 'default' | 'large'
    /** 控制下拉面板显隐 */
    popupVisible?: boolean
    /** 是否显示边框（默认 true） */
    bordered?: boolean
    /** 下拉面板最大高度 */
    maxHeight?: string
    /** 自定义字段映射 */
    fieldNames?: TreeFieldNames
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    options: () => [],
    type: 'tree',
    selectionType: 'multiple',
    multiple: undefined,         // 未指定时跟随 selectionType
    treeCheckable: undefined,    // 未指定时跟随 selectionType === 'multiple'
    treeCheckStrictly: false,
    treeCheckedStrategy: 'all',
    allowClear: false,
    showSearch: false,
    placeholder: '请选择',
    maxTagCount: 3,
    max: undefined,
    disabled: false,
    loading: false,
    size: 'default',
    bordered: true,
    maxHeight: '280px',
})

const emit = defineEmits<{
    'update:modelValue': [value: (string | number)[]]
    /** 选中值变化时触发（与 v-model 同步） */
    change: [value: (string | number)[]]
    /** 下拉面板显隐变化 */
    'popupVisibleChange': [visible: boolean]
    /** 搜索输入变化 */
    search: [keyword: string]
    /** 清除操作 */
    clear: []
    /** 移除标签 */
    remove: [value: string | number]
}>()

// ── 运行时校验 ──

usePropValidation('AppSelectTree', z.object({
    modelValue: z.array(z.union([z.string(), z.number()])),
    treeData: z.array(z.any()).optional(),
    options: z.array(z.any()).optional(),
    type: z.enum(['tree', 'flat']).optional(),
    selectionType: z.enum(['multiple', 'single']).optional(),
    multiple: z.boolean().optional(),
    treeCheckable: z.boolean().optional(),
    treeCheckStrictly: z.boolean().optional(),
    treeCheckedStrategy: z.enum(['all', 'parent', 'child']).optional(),
    allowClear: z.boolean().optional(),
    showSearch: z.boolean().optional(),
    filterTreeNode: z.function().optional(),
    placeholder: z.string().optional(),
    maxTagCount: z.number().optional(),
    max: z.number().int().positive().optional(),
    disabled: z.boolean().optional(),
    loading: z.boolean().optional(),
    size: z.enum(['mini', 'small', 'default', 'large']).optional(),
    popupVisible: z.boolean().optional(),
    bordered: z.boolean().optional(),
    maxHeight: z.string().optional(),
    fieldNames: z.object({
        key: z.string().optional(),
        title: z.string().optional(),
        children: z.string().optional(),
        disabled: z.string().optional(),
    }).optional(),
}), props)

// ── 字段解析（合并默认值 + 用户覆盖） ──

const fields = computed<Required<TreeFieldNames>>(() => ({
    ...defaultFieldNames,
    ...props.fieldNames,
}))

/** 获取节点的 key 字段值 */
function getKey(node: SelectTreeOption): string | number {
    return (node as unknown as Record<string, unknown>)[fields.value.key] as string ?? node.id
}

/** 获取节点的 title 字段值 */
function getTitle(node: SelectTreeOption): string {
    return (node as unknown as Record<string, unknown>)[fields.value.title] as string ?? node.name
}

/** 获取节点的 children 字段值 */
function getChildren(node: SelectTreeOption): SelectTreeOption[] {
    return (node as unknown as Record<string, unknown>)[fields.value.children] as SelectTreeOption[] ?? node.children ?? []
}

/** 节点是否禁用 */
function isNodeDisabled(node: SelectTreeOption): boolean {
    const val = (node as unknown as Record<string, unknown>)[fields.value.disabled]
    return Boolean(val ?? false)
}

// ── 多选 / 单选取值 ──

/** 是否为多选模式 */
const isMultiple = computed(() =>
    props.multiple ?? props.selectionType === 'multiple'
)

/** 根据 max 限制截断选中数组，仅保留最后 max 项 */
function limitByMax(arr: (string | number)[]): (string | number)[] {
    if (props.max == null || arr.length <= props.max) return arr
    return arr.slice(-props.max)
}

// ── 数据源 ──

/** 最终数据源：treeData 优先，否则用 options */
const source = computed<SelectTreeOption[]>(() =>
    (props.treeData ?? props.options) || []
)

// ── 下拉面板状态 ──

const innerPopupVisible = ref(false)
const dropdownVisible = computed(() =>
    props.popupVisible || innerPopupVisible.value
)

const triggerRef = ref<HTMLElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

// 下拉面板位置
const dropdownStyle = ref({ top: '0px', left: '0px', width: '0px' })

function updateDropdownPosition() {
    if (!triggerRef.value) return
    const rect = triggerRef.value.getBoundingClientRect()
    dropdownStyle.value = {
        top: `${rect.bottom + 4}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
    }
}

function openDropdown() {
    if (props.disabled || dropdownVisible.value) return
    updateDropdownPosition()
    innerPopupVisible.value = true
    emit('popupVisibleChange', true)
}

function closeDropdown() {
    if (!dropdownVisible.value) return
    innerPopupVisible.value = false
    searchValue.value = ''
    emit('popupVisibleChange', false)
}

function toggleDropdown() {
    if (dropdownVisible.value) closeDropdown()
    else openDropdown()
}

// 滚动/尺寸变化时重定位
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
    resizeObserver = new ResizeObserver(() => {
        if (dropdownVisible.value) updateDropdownPosition()
    })
    if (triggerRef.value) resizeObserver.observe(triggerRef.value)
})

onUnmounted(() => {
    resizeObserver?.disconnect()
})

// ── 点击外部关闭 ──

/** 文档点击处理（仅在 dropdown 打开时绑定） */
function handleDocumentClick(e: MouseEvent) {
    if (!dropdownVisible.value) return
    const target = e.target as Node
    const isTrigger = triggerRef.value?.contains(target)
    const isDropdown = dropdownRef.value?.contains(target)
    // 点击触发器或下拉面板内时不关闭
    if (!isTrigger && !isDropdown) {
        closeDropdown()
    }
}

watch(dropdownVisible, (visible) => {
    if (visible) {
        // 在 nextTick 注册，确保 Teleport 内容已挂载后再捕获事件
        nextTick(() => {
            document.addEventListener('click', handleDocumentClick, false)
            updateDropdownPosition()
        })
    } else {
        document.removeEventListener('click', handleDocumentClick, false)
    }
})

// ── 展开/折叠 ──

const expandedKeys = ref<Set<string | number>>(new Set())

function hasChildren(node: SelectTreeOption): boolean {
    return getChildren(node).length > 0
}

function toggleExpand(nodeId: string | number) {
    const next = new Set(expandedKeys.value)
    if (next.has(nodeId)) next.delete(nodeId)
    else next.add(nodeId)
    expandedKeys.value = next
}

// ── 搜索过滤 ──

const searchValue = ref('')

const isSearching = computed(() => searchValue.value.length > 0)

/** 用递归展开匹配到的节点路径 */
function collectMatchIds(nodes: SelectTreeOption[], keyword: string, result: Set<string | number>): boolean {
    for (const node of nodes) {
        const id = getKey(node)
        const title = getTitle(node)
        const children = getChildren(node)
        const selfMatch = title.toLowerCase().includes(keyword.toLowerCase())
        const childMatch = children.length > 0 && collectMatchIds(children, keyword, result)
        if (selfMatch || childMatch) {
            result.add(id)
            if (childMatch) result.add(id) // 确保路径展开
        }
    }
    return false
}

/** 获取搜索匹配的节点 key 集合（用于展开） */
function getMatchedKeys(keyword: string): Set<string | number> {
    const result = new Set<string | number>()
    collectMatchIds(source.value, keyword, result)
    // 展开所有匹配节点的父路径
    const allExpanded = new Set<string | number>()
    function walk(nodes: SelectTreeOption[]) {
        for (const node of nodes) {
            if (result.has(getKey(node))) {
                // 标记其父节点需要展开（不直接操作，用祖先展开方式）
                allExpanded.add(getKey(node))
            }
            const children = getChildren(node)
            if (children.length) walk(children)
        }
    }
    walk(source.value)
    return allExpanded
}

/** 节点是否匹配搜索关键词 */
function matchesSearch(node: SelectTreeOption): boolean {
    if (!isSearching.value) return true
    if (props.filterTreeNode) {
        return props.filterTreeNode(searchValue.value, node)
    }
    return getTitle(node).toLowerCase().includes(searchValue.value.toLowerCase())
}

// ── 树节点扁平化 ──

function flattenTree(nodes: SelectTreeOption[], level = 0): FlatNode[] {
    const result: FlatNode[] = []
    for (const node of nodes) {
        const id = getKey(node)
        const children = getChildren(node)
        const match = matchesSearch(node)

        // 搜索模式：不匹配且无匹配子节点的节点及其子树完全跳过
        if (isSearching.value && !match) {
            // 如果子节点中有匹配的，仍需展开当前节点以显示匹配子节点
            const childMatches = searchInChildren(node)
            if (childMatches) {
                // 当前节点不匹配但子节点匹配，展开它
                result.push(toFlatNode(node, level, true))
                result.push(...flattenTree(children, level + 1))
            }
            continue
        }

        const isExpanded = isSearching.value
            ? true  // 搜索时自动展开所有匹配节点
            : expandedKeys.value.has(id)

        result.push(toFlatNode(node, level, isExpanded))
        if (children.length > 0 && isExpanded) {
            result.push(...flattenTree(children, level + 1))
        }
    }
    return result
}

/** 检查节点的子树中是否有匹配项 */
function searchInChildren(node: SelectTreeOption): boolean {
    const children = getChildren(node)
    for (const child of children) {
        if (matchesSearch(child)) return true
        if (searchInChildren(child)) return true
    }
    return false
}

function toFlatNode(node: SelectTreeOption, level: number, isExpanded: boolean): FlatNode {
    const children = getChildren(node)
    return {
        id: getKey(node) as string,
        title: getTitle(node),
        level,
        hasChildren: children.length > 0,
        isExpanded,
        isDisabled: isNodeDisabled(node),
        origin: node,
    }
}

/** 下拉面板内渲染的扁平节点列表 */
const flatNodes = computed(() => flattenTree(source.value))

/** 搜索命中时需展开的 keys */
watch(searchValue, (val) => {
    if (val) {
        const matched = getMatchedKeys(val)
        expandedKeys.value = matched
    }
})

// ── 选中逻辑 ──

/** 收集节点及其所有后代的 ID */
function collectDescendantIds(nodes: SelectTreeOption[]): (string | number)[] {
    const ids: (string | number)[] = []
    function walk(list: SelectTreeOption[]) {
        for (const n of list) {
            ids.push(getKey(n))
            const children = getChildren(n)
            if (children.length) walk(children)
        }
    }
    walk(nodes)
    return ids
}

/** 收集所有半选父节点并加入选中集（补充 cascadeUpFrom 的不足） */
function collectIndeterminateParents(selected: Set<string | number>, nodes: SelectTreeOption[]) {
    for (const node of nodes) {
        const children = getChildren(node)
        if (children.length > 0) {
            const descIds = collectDescendantIds(children)
            const checkedCount = descIds.filter(id => selected.has(id)).length
            // 部分子节点选中 → 半选态，加入选中集
            if (checkedCount > 0 && checkedCount < descIds.length) {
                selected.add(getKey(node))
            }
            collectIndeterminateParents(selected, children)
        }
    }
}

/** 向上级联更新父节点选中态（非严格模式） */
function cascadeUpFrom(
    nodeId: string | number,
    wasDeselected: boolean,
    selected: Set<string | number>,
    searchNodes: SelectTreeOption[],
): void {
    for (const node of searchNodes) {
        const children = getChildren(node)
        if (!children.length) continue
        const childIds = children.map(n => getKey(n))
        if (childIds.includes(nodeId)) {
            const parentId = getKey(node)
            if (wasDeselected) {
                selected.delete(parentId)
                cascadeUpFrom(parentId, true, selected, source.value)
            } else {
                const allSelected = childIds.every(id => selected.has(id))
                if (allSelected) {
                    selected.add(parentId)
                    cascadeUpFrom(parentId, false, selected, source.value)
                }
            }
            return
        }
        if (children.length > 0) {
            cascadeUpFrom(nodeId, wasDeselected, selected, children)
        }
    }
}

/** 应用 treeCheckedStrategy 过滤选中值 */
function applyStrategy(selected: Set<string | number>, strategy: CheckedStrategy): (string | number)[] {
    if (strategy === 'all') return Array.from(selected)
    if (strategy === 'child') {
        // 仅返回叶子节点，但半选父节点也保留（用户可选择部分权限）
        const result = new Set(selected)
        function walk(nodes: SelectTreeOption[]) {
            for (const node of nodes) {
                const id = getKey(node)
                const children = getChildren(node)
                if (children.length > 0 && selected.has(id)) {
                    const descIds = collectDescendantIds(children)
                    const checkedCount = descIds.filter(did => selected.has(did)).length
                    if (checkedCount === descIds.length) {
                        result.delete(id) // 全选父节点不返回（子节点已覆盖）
                    }
                    // 半选父节点保留在 result 中
                }
                if (children.length > 0) walk(children)
            }
        }
        walk(source.value)
        return Array.from(result)
    }
    // 'parent' — 仅返回父节点（子节点全选的父节点保留，子节点移除）
    const result = new Set(selected)
    function walk(nodes: SelectTreeOption[]) {
        for (const node of nodes) {
            const children = getChildren(node)
            let allChildrenSelected = true
            for (const child of children) {
                if (!selected.has(getKey(child))) {
                    allChildrenSelected = false
                    break
                }
            }
            if (allChildrenSelected && children.length > 0) {
                // 子节点全选 → 移除子节点保留父节点
                for (const child of children) {
                    result.delete(getKey(child))
                }
            }
            if (children.length > 0) walk(children)
        }
    }
    walk(source.value)
    return Array.from(result)
}

/** 切换树节点选中 */
function handleNodeClick(node: SelectTreeOption) {
    if (isNodeDisabled(node) || props.disabled) return
    const isSingle = !isMultiple.value

    if (isSingle) {
        emit('update:modelValue', [getKey(node)])
        emit('change', [getKey(node)])
        closeDropdown()
        return
    }

    // 多选
    const selected = new Set<string | number>(props.modelValue.map(v => v))
    const nodeId = getKey(node)
    const wasSelected = selected.has(nodeId)

    if (props.treeCheckStrictly) {
        // 严格模式：父子独立选择，仅切换当前节点，不影响子节点
        if (wasSelected) {
            selected.delete(nodeId)
        } else {
            selected.add(nodeId)
        }
    } else {
        // 非严格模式：父子联动，选择/取消父节点同时选中/取消所有后代
        const ids = collectDescendantIds([node])
        if (wasSelected) {
            for (const id of ids) selected.delete(id)
        } else {
            for (const id of ids) selected.add(id)
        }
        cascadeUpFrom(nodeId, wasSelected, selected, source.value)
        // 收集半选父节点也加入选中集（cascadeUpFrom 仅处理全选父节点）
        collectIndeterminateParents(selected, source.value)
    }

    // 应用策略
    const result = applyStrategy(selected, props.treeCheckedStrategy)
    emit('update:modelValue', limitByMax(result))
    emit('change', limitByMax(result))
}

/** 切换扁平列表项 */
function handleItemClick(id: string | number) {
    if (props.disabled) return
    const isSingle = !isMultiple.value
    if (isSingle) {
        emit('update:modelValue', [id])
        emit('change', [id])
        return
    }
    const selected = new Set(props.modelValue.map(v => v))
    if (selected.has(id)) selected.delete(id)
    else selected.add(id)
    const result = Array.from(selected)
    emit('update:modelValue', limitByMax(result))
    emit('change', limitByMax(result))
}

// ── 选中态计算 ──

const selectedSet = computed(() => new Set(props.modelValue.map(v => v)))

function isChecked(node: SelectTreeOption): boolean {
    return selectedSet.value.has(getKey(node))
}

function isIndeterminate(node: SelectTreeOption): boolean {
    if (!isMultiple.value || !hasChildren(node)) return false
    const children = getChildren(node)
    const descIds = collectDescendantIds(children)
    const checked = descIds.filter(id => selectedSet.value.has(id)).length
    return checked > 0 && checked < descIds.length
}

function isActive(node: SelectTreeOption): boolean {
    return !isMultiple.value && props.modelValue[0] === getKey(node)
}

// ── 标签显示（多选） ──

const selectedLabels = computed<{ id: string | number; label: string }[]>(() => {
    const result: { id: string | number; label: string }[] = []
    function walk(nodes: SelectTreeOption[]) {
        for (const node of nodes) {
            const id = getKey(node)
            if (selectedSet.value.has(id)) {
                result.push({ id, label: getTitle(node) })
            }
            const children = getChildren(node)
            if (children.length) walk(children)
        }
    }
    walk(source.value)
    return result
})

const visibleTags = computed(() =>
    selectedLabels.value.slice(0, props.maxTagCount)
)
const hiddenTagCount = computed(() =>
    Math.max(0, selectedLabels.value.length - props.maxTagCount)
)

// 单选模式下显示的选中文本
const selectedLabel = computed(() => {
    if (isMultiple.value) return ''
    const id = props.modelValue[0]
    if (id == null) return ''
    const found = selectedLabels.value.find(t => t.id === id)
    return found?.label ?? ''
})

// ── 清除 ──

function handleClear(e: MouseEvent) {
    e.stopPropagation()
    emit('update:modelValue', [])
    emit('change', [])
    emit('clear')
}

// ── 移除标签 ──

function handleTagRemove(tag: { id: string | number; label: string }) {
    if (props.disabled) return
    const selected = new Set(props.modelValue.map(v => v))
    selected.delete(tag.id)
    const result = Array.from(selected)
    emit('update:modelValue', result)
    emit('change', result)
    emit('remove', tag.id)
}

// ── 搜索输入 ──

function handleSearchInput(e: Event) {
    const value = (e.target as HTMLInputElement).value
    searchValue.value = value
    emit('search', value)
    if (!innerPopupVisible.value) {
        openDropdown()
    }
}

// ── 高亮搜索文本 ──

function highlightText(text: string): string {
    if (!isSearching.value || !searchValue.value) return text
    const idx = text.toLowerCase().indexOf(searchValue.value.toLowerCase())
    if (idx === -1) return text
    const before = text.slice(0, idx)
    const match = text.slice(idx, idx + searchValue.value.length)
    const after = text.slice(idx + searchValue.value.length)
    return `${before}<mark>${match}</mark>${after}`
}
</script>

<template>
    <!-- ════ 下拉树选择模式（默认） ════ -->
    <div
        v-if="type === 'tree'"
        ref="triggerRef"
        class="app-tree-select"
        :class="[
            `ts-size--${size}`,
            {
                'is-disabled': disabled,
                'is-focused': dropdownVisible,
                'is-bordered': bordered,
                'is-borderless': !bordered,
            },
        ]"
        :tabindex="disabled ? -1 : 0"
        @click="toggleDropdown"
        @keydown.enter.prevent="toggleDropdown"
        @keydown.esc="closeDropdown"
        role="combobox"
        :aria-expanded="dropdownVisible"
    >
        <!-- ── 触发器渲染区域 ── -->
        <div class="ts-trigger">
            <!-- 前缀插槽 -->
            <slot name="prefix" />

            <!-- 多选：标签展示 -->
            <template v-if="isMultiple">
                <div class="ts-selection">
                    <span
                        v-for="tag in visibleTags"
                        :key="tag.id"
                        class="ts-tag"
                        :title="tag.label"
                    >
                        <span class="ts-tag-text">{{ tag.label }}</span>
                        <span
                            class="ts-tag-remove"
                            @click.stop="handleTagRemove(tag)"
                        >×</span>
                    </span>
                    <span v-if="hiddenTagCount > 0" class="ts-tag-more">
                        +{{ hiddenTagCount }}
                    </span>
                    <span
                        v-if="selectedLabels.length === 0"
                        class="ts-placeholder"
                    >{{ placeholder }}</span>
                </div>
            </template>

            <!-- 单选：文本展示 -->
            <template v-else>
                <div class="ts-selection ts-selection--single">
                    <span v-if="selectedLabel" class="ts-selected-label">{{ selectedLabel }}</span>
                    <span v-else class="ts-placeholder">{{ placeholder }}</span>
                </div>
            </template>

            <!-- 加载中 -->
            <span v-if="loading" class="ts-loading-icon">
                <svg viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-linecap="round" />
                </svg>
            </span>

            <!-- 清除按钮 -->
            <span
                v-if="allowClear && !disabled && props.modelValue.length > 0"
                class="ts-clear"
                @click.stop="handleClear"
            >×</span>

            <!-- 展开箭头 -->
            <span class="ts-arrow" :class="{ 'is-open': dropdownVisible }">
                <svg viewBox="0 0 12 12">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </span>
        </div>

        <!-- ── 下拉面板（Teleport 到 body 避免 overflow 截断） ── -->
        <Teleport to="body">
            <transition name="ts-dropdown-fade">
                <div
                    v-if="dropdownVisible"
                    ref="dropdownRef"
                    class="ts-dropdown"
                    :style="dropdownStyle"
                >
                    <!-- 头部插槽 -->
                    <div v-if="$slots.header" class="ts-dropdown-header">
                        <slot name="header" />
                    </div>

                    <!-- 搜索框 -->
                    <div v-if="showSearch" class="ts-search">
                        <svg class="ts-search-icon" viewBox="0 0 16 16">
                            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5" fill="none" />
                            <path d="M10 10L14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                        </svg>
                        <input
                            class="ts-search-input"
                            :placeholder="`搜索...`"
                            :value="searchValue"
                            autofocus
                            @input="handleSearchInput"
                        />
                    </div>

                    <!-- 加载态 -->
                    <div v-if="loading" class="ts-loading">加载中...</div>

                    <!-- 空态 -->
                    <div v-else-if="flatNodes.length === 0" class="ts-empty">
                        <slot name="empty">暂无数据</slot>
                    </div>

                    <!-- 树节点列表（扁平渲染） -->
                    <div v-else class="ts-tree" :style="{ maxHeight: maxHeight }">
                        <div
                            v-for="flat in flatNodes"
                            :key="flat.id"
                            class="ts-tree-node"
                            :class="{
                                'is-active': isActive(flat.origin),
                                'is-indeterminate': isIndeterminate(flat.origin),
                                'is-disabled': flat.isDisabled,
                            }"
                            :style="{ paddingLeft: `${12 + flat.level * 20}px` }"
                            @click.stop="handleNodeClick(flat.origin)"
                        >
                            <!-- 展开图标 -->
                            <span
                                v-if="flat.hasChildren"
                                class="ts-expand-icon"
                                :class="{ 'is-expanded': flat.isExpanded }"
                                @click.stop="toggleExpand(flat.id)"
                            >
                                <svg viewBox="0 0 12 12">
                                    <path d="M4 2.5L7.5 6L4 9.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                            </span>
                            <span v-else class="ts-expand-icon ts-expand-icon--spacer" />

                            <!-- 复选框（多选模式） -->
                            <input
                                v-if="isMultiple"
                                type="checkbox"
                                class="ts-checkbox"
                                :checked="isChecked(flat.origin)"
                                :indeterminate="isIndeterminate(flat.origin)"
                                :disabled="flat.isDisabled"
                                @click.stop="handleNodeClick(flat.origin)"
                            />

                            <!-- 单选框（单选模式） -->
                            <input
                                v-else
                                type="radio"
                                class="ts-radio"
                                :checked="isActive(flat.origin)"
                                :disabled="flat.isDisabled"
                                :name="`ts-radio-${uid}`"
                                @click.stop="handleNodeClick(flat.origin)"
                            />

                            <!-- 节点名称（支持搜索高亮） -->
                            <span
                                class="ts-node-title"
                                v-html="highlightText(flat.title)"
                            />
                        </div>
                    </div>

                    <!-- 底部插槽 -->
                    <div v-if="$slots.footer" class="ts-dropdown-footer">
                        <slot name="footer" />
                    </div>
                </div>
            </transition>
        </Teleport>
    </div>

    <!-- ════ 扁平模式（兼容旧版） ════ -->
    <div v-else class="flat-select" :style="{ maxHeight }">
        <template v-if="options.length > 0">
            <label
                class="flat-item"
                :class="{ 'is-active': !isMultiple && props.modelValue[0] === getKey(item) }"
                v-for="item in options" :key="getKey(item)"
            >
                <input
                    :type="isMultiple ? 'checkbox' : 'radio'"
                    :checked="selectedSet.has(getKey(item))"
                    :name="`ts-flat-${uid}`"
                    @change="handleItemClick(getKey(item))"
                />
                <span class="flat-item-name">{{ getTitle(item) }}</span>
            </label>
        </template>
        <p class="flat-empty" v-else>暂无数据</p>
    </div>
</template>

<style scoped>
/* ═══════════════════════════════════════════
   下拉树选择器（Arco Design 风格）
   ═══════════════════════════════════════════ */

/* ── 根容器 ── */
.app-tree-select {
    position: relative;
    display: inline-flex;
    align-items: center;
    width: 100%;
    min-height: 32px;
    font-size: 1rem;
    color: var(--color-text-primary);
    background: var(--color-bg-card);
    border-radius: var(--radius-comfortable);
    cursor: pointer;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
    user-select: none;
}
.app-tree-select.is-bordered {
    border: 1px solid var(--color-border-card);
}
.app-tree-select.is-borderless {
    border: 1px solid transparent;
}
.app-tree-select:hover {
    border-color: var(--color-accent);
}
.app-tree-select.is-focused {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px rgba(24, 99, 220, 0.15);
}
.app-tree-select.is-disabled {
    background: var(--color-bg-snow);
    color: var(--color-text-muted);
    cursor: not-allowed;
    border-color: var(--color-border-card);
}
.app-tree-select.is-disabled:hover {
    border-color: var(--color-border-card);
    box-shadow: none;
}

/* ── 尺寸 ── */
.ts-size--mini { min-height: 24px; font-size: 0.8571rem; }
.ts-size--small { min-height: 28px; font-size: 0.9286rem; }
.ts-size--default { min-height: 32px; font-size: 1rem; }
.ts-size--large { min-height: 36px; font-size: 1.0714rem; }

/* ── 触发器 ── */
.ts-trigger {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 2px 8px;
    box-sizing: border-box;
    overflow: hidden;
}
.ts-selection {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 4px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
}
.ts-selection--single {
    flex-wrap: nowrap;
}
.ts-selected-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--color-text-primary);
}

/* ── 占位文本 ── */
.ts-placeholder {
    color: var(--color-text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ── 标签 ── */
.ts-tag {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    max-width: 120px;
    padding: 0 6px;
    height: 22px;
    font-size: 0.8571rem;
    background: var(--color-bg-snow);
    border: 1px solid var(--color-border-card);
    border-radius: 4px;
    color: var(--color-text-primary);
    box-sizing: border-box;
    flex-shrink: 0;
}
.ts-tag-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.ts-tag-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    font-size: 1rem;
    line-height: 1;
    color: var(--color-text-muted);
    border-radius: 2px;
    cursor: pointer;
    flex-shrink: 0;
    transition: color 0.15s, background 0.15s;
}
.ts-tag-remove:hover {
    color: var(--color-text-primary);
    background: rgba(0, 0, 0, 0.06);
}
.ts-tag-more {
    font-size: 0.8571rem;
    color: var(--color-text-muted);
    flex-shrink: 0;
}

/* ── 清除按钮 ── */
.ts-clear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    font-size: 1.1429rem;
    color: var(--color-text-muted);
    border-radius: 50%;
    flex-shrink: 0;
    transition: color 0.15s, background 0.15s;
}
.ts-clear:hover {
    color: var(--color-text-primary);
    background: rgba(0, 0, 0, 0.06);
}

/* ── 加载图标 ── */
.ts-loading-icon {
    display: inline-flex;
    align-items: center;
    color: var(--color-text-muted);
    flex-shrink: 0;
    animation: ts-spin 0.8s linear infinite;
}
/* 原因：加载图标尺寸随基础字号缩放，使用 --icon-size-sm 保持与文字比例协调 */
.ts-loading-icon svg { width: var(--icon-size-sm, 0.85em); height: var(--icon-size-sm, 0.85em); display: block; }
@keyframes ts-spin {
    to { transform: rotate(360deg); }
}

/* ── 展开箭头 ── */
.ts-arrow {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-muted);
    flex-shrink: 0;
    transition: transform 0.2s;
}
/* 原因：箭头图标尺寸挂钩基础字号，保持与选择器文字的比例一致 */
.ts-arrow svg {
    display: block;
    width: var(--icon-size-sm, 0.85em);
    height: var(--icon-size-sm, 0.85em);
}
.ts-arrow.is-open {
    transform: rotate(180deg);
}

/* ── 下拉面板 ── */
.ts-dropdown {
    position: fixed;
    z-index: 1050;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-section);
    border-radius: var(--radius-comfortable);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    box-sizing: border-box;
}
.ts-dropdown-fade-enter-active,
.ts-dropdown-fade-leave-active {
    transition: opacity 0.15s, transform 0.15s;
}
.ts-dropdown-fade-enter-from,
.ts-dropdown-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

/* ── 头部 / 底部 ── */
.ts-dropdown-header,
.ts-dropdown-footer {
    padding: 8px 12px;
    border-bottom: 1px solid var(--color-border-card);
}
.ts-dropdown-footer {
    border-bottom: none;
    border-top: 1px solid var(--color-border-card);
}

/* ── 搜索框 ── */
.ts-search {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--color-border-card);
}
.ts-search-icon {
    flex-shrink: 0;
    color: var(--color-text-muted);
}
/* 原因：搜索图标尺寸挂钩基础字号，保持与搜索框文字比例一致 */
.ts-search-icon { width: var(--icon-size-sm, 0.85em); height: var(--icon-size-sm, 0.85em); }
.ts-search-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 0.9286rem;
    color: var(--color-text-primary);
    background: transparent;
}
.ts-search-input::placeholder {
    color: var(--color-text-muted);
}

/* ── 树容器 ── */
.ts-tree {
    overflow-y: auto;
    padding: 4px 0;
}

/* ── 树节点 ── */
.ts-tree-node {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    min-height: 30px;
    cursor: pointer;
    transition: background 0.12s;
    box-sizing: border-box;
}
.ts-tree-node:hover {
    background: var(--color-bg-snow);
}
.ts-tree-node.is-disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
.ts-tree-node.is-disabled:hover {
    background: transparent;
}
.ts-tree-node.is-active {
    background: rgba(24, 99, 220, 0.06);
}
.ts-tree-node.is-active > .ts-node-title {
    color: var(--color-accent);
    font-weight: 600;
}
.ts-tree-node.is-indeterminate {
    background: rgba(250, 173, 20, 0.06);
}

/* ── 展开图标 ── */
.ts-expand-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: var(--icon-size-md, 1.15em);
    height: var(--icon-size-md, 1.15em);
    flex-shrink: 0;
    color: var(--color-text-muted);
    cursor: pointer;
    transition: transform 0.15s, color 0.15s;
}
.ts-expand-icon:hover {
    color: var(--color-accent);
}
/* 原因：确保 SVG 填充父容器尺寸，避免 viewBox 默认尺寸与容器不一致 */
.ts-expand-icon svg { width: 100%; height: 100%; display: block; }
.ts-expand-icon.is-expanded {
    transform: rotate(90deg);
}
.ts-expand-icon--spacer {
    visibility: hidden;
}

/* ── 复选框 / 单选框 ── */
.ts-checkbox,
.ts-radio {
    margin: 0;
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    cursor: pointer;
    accent-color: var(--color-accent);
}
.ts-radio:disabled,
.ts-checkbox:disabled {
    cursor: not-allowed;
}

/* ── 节点标题 ── */
.ts-node-title {
    font-size: 1rem;
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
}
.ts-node-title :deep(mark) {
    background: rgba(24, 99, 220, 0.12);
    color: var(--color-accent);
    border-radius: 2px;
    padding: 0 1px;
}

/* ── 空态 ── */
.ts-empty {
    padding: 24px 16px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.9286rem;
}

/* ── 加载态 ── */
.ts-loading {
    padding: 24px 16px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.9286rem;
}

/* ═══════════════════════════════════════════
   扁平模式（兼容旧版）
   ═══════════════════════════════════════════ */
.flat-select {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding: 4px 0;
    border: 1px solid var(--color-border-card);
    border-radius: var(--radius-comfortable);
    background: var(--color-bg-card);
}
.flat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.15s;
    min-height: 32px;
}
.flat-item:hover {
    background: var(--color-bg-snow);
}
.flat-item.is-active .flat-item-name {
    color: var(--color-accent);
    font-weight: 600;
}
.flat-item input[type="checkbox"],
.flat-item input[type="radio"] {
    cursor: pointer;
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    accent-color: var(--color-accent);
}
.flat-item-name {
    font-size: 1rem;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.flat-empty {
    padding: 24px;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.9286rem;
}
</style>

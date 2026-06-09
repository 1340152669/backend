/**
 * @rbac/ui Vite 插件 — 自动注入 design-tokens.css
 *
 * 设计原则：
 * - 纯 Vite 插件，不引用任何 Vue 组件
 * - 自动注入 design-tokens.css 到 HTML <style>
 * - 零配置，添加插件即用
 *
 * 用法（app/client/vite.config.ts）：
 * ```ts
 * import { rbacUiPlugin } from '@rbac/ui/plugin'
 *
 * export default defineConfig({
 *   plugins: [vue(), rbacUiPlugin()],
 * })
 * ```
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/** CSS 文件路径列表（插件自动注入） */
const STYLE_FILES = [
  resolve(__dirname, './styles/design-tokens.css'),
] as const

/**
 * Vite 插件 — @rbac/ui 自动注入 design-tokens.css
 *
 * @remarks
 * 自动完成 design-tokens.css 注入。主题颜色覆盖 Arco CSS 变量实现统一主题。
 *
 * @returns Vite 插件实例
 */
export function rbacUiPlugin(): Plugin {
  let cssContent = ''

  return {
    name: '@rbac/ui',
    enforce: 'pre',

    buildStart(): void {
      cssContent = STYLE_FILES.map(f => readFileSync(f, 'utf-8')).join('\n')
    },

    transformIndexHtml() {
      return [
        {
          tag: 'style',
          attrs: { type: 'text/css' },
          children: cssContent,
        },
      ]
    },
  }
}

import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

/**
 * Vitest 配置 — @rbac/ui 子包测试
 *
 * @remarks
 * 使用 Vue 插件支持 SFC 解析，jsdom 环境。
 */
export default defineConfig({
    plugins: [vue()],
    test: {
        environment: 'jsdom',
        exclude: ['node_modules/**'],
        root: fileURLToPath(new URL('./', import.meta.url)),
        setupFiles: ['./src/__tests__/setup.ts'],
    },
})

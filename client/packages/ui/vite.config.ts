import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'

/**
 * Vite 配置 — @rbac/ui 子包
 *
 * @remarks
 * ESM 格式输出，外部依赖仅 vue（由主应用提供），生成 sourcemap。
 * 多入口：主入口 index.ts、Vue 插件 components.ts、Vite 插件 plugin.ts。
 */
export default defineConfig({
    plugins: [vue()],
    build: {
        lib: {
            entry: {
                'index': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
                'components': fileURLToPath(new URL('./src/components.ts', import.meta.url)),
                'plugin': fileURLToPath(new URL('./src/plugin.ts', import.meta.url)),
            },
            formats: ['es'],
        },
        rollupOptions: {
            external: ['vue'],
        },
        sourcemap: true,
    },
})

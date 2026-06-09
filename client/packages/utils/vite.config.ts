import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

/**
 * Vite 配置 — @rbac/utils 子包
 *
 * @remarks
 * ESM 格式输出，无外部依赖（纯函数库），生成 sourcemap。
 */
export default defineConfig({
    build: {
        lib: {
            entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
            formats: ['es'],
            fileName: 'index',
        },
        rollupOptions: {
            external: [],
        },
        sourcemap: true,
    },
})

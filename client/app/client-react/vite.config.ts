import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/**
 * Vite 配置 — @rbac/client-react 应用
 *
 * @remarks
 * - @ 别名指向 src/ 目录，与 tsconfig paths 一致
 * - /api 请求代理到 localhost:3000（后端）
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 原因：@/xxx 导入指向 src/ 目录，与 tsconfig paths 一致
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // 原因：开发时将 /api/* 请求转发到后端，避免 CORS
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    open: true,
  },
})

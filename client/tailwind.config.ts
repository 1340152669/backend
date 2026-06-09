import type { Config } from 'tailwindcss'

export default {
  // 原因：项目通过 data-theme="dark" 属性控制深浅主题，而非 OS 媒体查询。使用 'selector' 策略使 Tailwind dark: 变体匹配 [data-theme="dark"] 选择器。
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './app/client/src/**/*.{ts,vue}',
    './packages/ui/src/**/*.{ts,vue}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config

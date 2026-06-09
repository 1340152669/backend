/**
 * useThemeSwitch — 水波涟漪主题切换 Hook
 *
 * 设计原理：
 * - 使用 View Transition API（document.startViewTransition）实现水波扩散效果
 * - 涟漪圆心取自点击按钮时的鼠标位置，通过 --ripple-x / --ripple-y 传入 CSS
 * - 降级方案：浏览器不支持 View Transition API 时直接切换
 * - 切换时临时添加 .theme-transitioning 类实现 Ant Design 风格平滑过渡
 *
 * @returns { toggleTheme } - 接收点击事件的切换函数
 *
 * @example
 * const { toggleTheme } = useThemeSwitch()
 * <button onClick={toggleTheme}>切换主题</button>
 *
 * @remarks
 * 副作作用：修改 document.documentElement 的 data-theme 属性、CSS 变量和 class。
 * View Transition API 仅支持同源 document 切换，不支持跨 document 动画。
 */
import { useCallback } from 'react'

/** 主题切换过渡时长（ms），与 CSS transition-duration 保持一致 */
const THEME_TRANSITION_MS = 300

export function useThemeSwitch() {
  const toggleTheme = useCallback((e: React.MouseEvent<HTMLElement>) => {
    // 获取点击位置相对于视口的坐标，作为涟漪扩散圆心
    const { clientX, clientY } = e
    const root = document.documentElement

    // 设置 CSS 变量，供 View Transition 伪元素 ::view-transition-new(root) 定位涟漪圆心
    root.style.setProperty('--ripple-x', `${clientX}px`)
    root.style.setProperty('--ripple-y', `${clientY}px`)

    // 判断当前主题，确定切换目标
    const isDark = root.getAttribute('data-theme') === 'dark'

    // 添加过渡类：所有颜色属性以 300ms ease 过渡，避免生硬跳变
    // 仅在切换瞬间生效，日常交互无性能开销
    root.classList.add('theme-transitioning')

    // DOM 更新函数（同步执行）
    const applyTheme = () => {
      root.setAttribute('data-theme', isDark ? 'light' : 'dark')
    }

    if (document.startViewTransition) {
      // 浏览器支持 View Transition API → 水波涟漪效果
      // startViewTransition 捕获旧状态快照 → 执行 applyTheme → 捕获新状态快照 → 动画过渡
      document.startViewTransition(applyTheme)
    } else {
      // 降级：不支持 VT API 的浏览器直接切换主题
      applyTheme()
    }

    // 过渡结束后移除过渡类，恢复日常无 transition 状态
    setTimeout(() => {
      root.classList.remove('theme-transitioning')
    }, THEME_TRANSITION_MS + 50)
  }, [])

  return { toggleTheme }
}

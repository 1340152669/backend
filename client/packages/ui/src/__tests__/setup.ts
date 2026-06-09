/**
 * Vitest 全局 setup — 在 jsdom 环境中补齐浏览器 API
 */
import { vi } from 'vitest'

// jsdom 未实现 ResizeObserver，AppSelectTree 等组件依赖它
vi.stubGlobal('ResizeObserver', class {
    constructor(_callback: ResizeObserverCallback) {
        // jsdom 不会触发尺寸变化，不做任何操作
    }
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
})

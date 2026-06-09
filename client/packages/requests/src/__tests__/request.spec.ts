import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock axios before importing the module under test
const mockRequestInterceptor = vi.fn()
const mockResponseInterceptor = vi.fn()

vi.mock('axios', () => ({
  default: {
    create: () => ({
      interceptors: {
        request: { use: mockRequestInterceptor },
        response: { use: mockResponseInterceptor },
      },
      get: vi.fn(),
      post: vi.fn(),
    }),
  },
}))

const mockStorage: Record<string, string> = {}

function setupLocalStorage() {
  // Clear all keys
  Object.keys(mockStorage).forEach(k => delete mockStorage[k])
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => { mockStorage[key] = value },
    removeItem: (key: string) => { delete mockStorage[key] },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]) },
  })
}

describe('request interceptor', () => {
  beforeEach(async () => {
    setupLocalStorage()
    vi.clearAllMocks()
    // Clear module cache so each test re-runs axios.create()
    vi.resetModules()
    // Force re-import to trigger module init
    await import('../request')
  })

  it('should inject Authorization header when token exists', async () => {
    mockStorage['token'] = 'test-jwt-token'

    const requestHandler = mockRequestInterceptor.mock.calls[0][0]
    const config = { headers: {} }
    const result = requestHandler(config)

    expect(result.headers.Authorization).toBe('Bearer test-jwt-token')
  })

  it('should not inject Authorization header when no token', () => {
    const requestHandler = mockRequestInterceptor.mock.calls[0][0]
    const config = { headers: {} }
    const result = requestHandler(config)

    expect(result.headers.Authorization).toBeUndefined()
  })

  it('should handle response with code 0 as success', () => {
    const responseHandler = mockResponseInterceptor.mock.calls[0][0]
    const mockResponse = {
      data: { code: 0, message: 'success', data: { id: 1 } },
      config: {},
    }

    const result = responseHandler(mockResponse)
    expect(result).toEqual(mockResponse)
  })

  it('should reject response with non-zero code', async () => {
    const responseHandler = mockResponseInterceptor.mock.calls[0][0]
    const mockResponse = {
      data: { code: 1004, message: '参数错误', data: null },
      config: {},
    }

    await expect(responseHandler(mockResponse)).rejects.toThrow('参数错误')
  })
})

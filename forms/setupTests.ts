import { afterEach, expect, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import '@testing-library/jest-dom'

// Auto cleanup after each test
afterEach(() => {
  cleanup()
})

// Polyfill matchMedia (used by some components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Optional: Polyfill ResizeObserver if used in layouts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })

// Extend Vitest's expect with Testing Library's matchers
expect.extend((await import('@testing-library/jest-dom/matchers')) as any)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock CSS modules to prevent issues with imports
vi.mock('*.css', () => ({ default: {} }))

// Fix for CSS requests in Vitest
vi.mock('vitest/node', async (importOriginal) => {
  const mod = await importOriginal()
  return {
    ...mod,
    // Add a mock implementation of isCSSRequest
    isCSSRequest: (id: string) => id.endsWith('.css') || id.includes('?css'),
  }
})
console.log('Test setup complete!')

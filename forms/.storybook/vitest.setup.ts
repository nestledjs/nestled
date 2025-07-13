import { setProjectAnnotations } from '@storybook/react-vite'
import * as projectAnnotations from './preview'
import '@testing-library/jest-dom'
import { expect, vi } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with Testing Library's matchers
expect.extend(matchers as any)

// Mock CSS modules as needed
vi.mock('*.css', () => ({ default: {} }))

// Handle dynamic imports that might fail during testing
vi.stubGlobal('fetch', vi.fn())
// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([projectAnnotations])

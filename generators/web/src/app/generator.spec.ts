import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { execSync } from 'child_process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import generator from './generator'
import { applicationGenerator } from '@nx/react/src/generators/application/application'

vi.mock('child_process', async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    ...(originalModule as object),
    execSync: vi.fn(),
  }
})

vi.mock('@nx/react/src/generators/application/application', async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    ...(originalModule as object),
    applicationGenerator: vi.fn(async (tree) => {
      tree.write('apps/web/src/app.tsx', '// app entry')
      tree.write('apps/web/vite.config.ts', '// vite config')
      return Promise.resolve()
    }),
  }
})

describe('web app generator', () => {
  let tree: Tree
  const mockedExecSync = execSync as ReturnType<(typeof vi)['fn']>

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    tree.write('package.json', JSON.stringify({ name: 'test-repo', scripts: {} }))

    mockedExecSync.mockImplementation(() => {
      // Simulate file creation as if the Nx generator ran
      tree.write('apps/web/src/app/app.tsx', '// app entry')
      tree.write('apps/web/vite.config.ts', '// vite config')
      tree.write('apps/web/postcss.config.js', '// postcss config')
      tree.write('apps/web/tailwind.config.js', '// tailwind config')
      tree.write('apps/web/tailwind.config.ts', '// tailwind config ts')
      return ''
    })

    vi.spyOn(console, 'log').mockImplementation(() => { /* empty */ })
    vi.spyOn(console, 'warn').mockImplementation(() => { /* empty */ })
    vi.spyOn(console, 'error').mockImplementation(() => { /* empty */ })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mockedExecSync.mockClear()
  })

  it('should run successfully and update files', async () => {
    await generator(tree, {})

    // postcss and tailwind config files should be deleted
    expect(tree.exists('apps/web/postcss.config.js')).toBe(false)
    expect(tree.exists('apps/web/tailwind.config.js')).toBe(false)
    expect(tree.exists('apps/web/tailwind.config.ts')).toBe(false)

    // dev:web script should be added
    const packageJson = JSON.parse(tree.read('package.json', 'utf-8'))
    expect(packageJson.scripts['dev:web']).toBe('nx serve web')

    // Custom files should be generated (example: vite.config.ts)
    expect(tree.exists('apps/web/vite.config.ts')).toBe(true)
    expect(tree.exists('apps/web/src/app.tsx')).toBe(true)
  })
}) 
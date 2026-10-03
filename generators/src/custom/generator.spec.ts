import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { customGeneratorLogic, CustomGeneratorDependencies } from './generator'

describe('custom-generator', () => {
  let tree: Tree
  let mockDependencies: CustomGeneratorDependencies

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    mockDependencies = {
      formatFiles: vi.fn(),
      installPackagesTask: vi.fn(),
      apiLibraryGenerator: vi.fn(),
      execSync: vi.fn(),
      join: vi.fn((...args: string[]) => args.join('/')),
    }
    vi.clearAllMocks()
  })

  it('creates the custom library shell without generating a wrapper for every model', async () => {
    await customGeneratorLogic(tree, { name: 'custom' }, mockDependencies)
    expect(mockDependencies.apiLibraryGenerator).toHaveBeenCalledWith(tree, { name: 'custom' }, '', undefined, false)
    expect(tree.exists('libs/api/custom/src/index.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/src/lib/default/index.ts')).toBe(true)
    expect(tree.read('libs/api/custom/src/lib/plugins/index.ts', 'utf-8')).toBe('export const customPlugins = []\n')
    expect(tree.exists('libs/api/custom/src/lib/default/user/user.resolver.ts')).toBe(false)
  })

  it('is idempotent and preserves explicitly generated model extensions', async () => {
    await customGeneratorLogic(tree, { name: 'custom' }, mockDependencies)
    tree.write('libs/api/custom/src/lib/default/user/custom.txt', 'do not overwrite')
    await customGeneratorLogic(tree, { name: 'custom' }, mockDependencies)
    expect(tree.read('libs/api/custom/src/lib/default/user/custom.txt', 'utf-8')).toBe('do not overwrite')
  })

  it('restores an accidentally emptied plugins index without changing other custom code', async () => {
    tree.write('libs/api/custom/src/lib/plugins/index.ts', '')
    tree.write('libs/api/custom/src/lib/default/user/custom.txt', 'preserve me')

    await customGeneratorLogic(tree, { name: 'custom' }, mockDependencies)

    expect(tree.read('libs/api/custom/src/lib/plugins/index.ts', 'utf-8')).toBe('export const customPlugins = []\n')
    expect(tree.read('libs/api/custom/src/lib/default/user/custom.txt', 'utf-8')).toBe('preserve me')
  })
})

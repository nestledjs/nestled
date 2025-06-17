import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { formatFiles, generateFiles, joinPathFragments, Tree } from '@nx/devkit'
import { addToModules } from '@nestledjs/utils'
import generator from './generator'

vi.mock('@nx/devkit', async () => {
  const actual = await vi.importActual('@nx/devkit')
  return {
    ...actual,
    formatFiles: vi.fn(),
    generateFiles: vi.fn(),
    joinPathFragments: actual.joinPathFragments,
  }
})

vi.mock('@nx/js/src/utils/package-json/get-npm-scope', async () => {
  return {
    getNpmScope: vi.fn(() => 'myscope'),
  }
})

vi.mock('@nestledjs/utils', async () => {
  return {
    addToModules: vi.fn(),
  }
})

describe('auth generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    // Simulate the index file existing
    tree.write('libs/api/custom/src/index.ts', '')
    vi.clearAllMocks()
  })

  it('should generate files, add to modules, and update index', async () => {
    await generator(tree)

    expect(generateFiles).toHaveBeenCalledWith(
      tree,
      expect.any(String),
      joinPathFragments('libs', 'api/custom/src/lib/plugins', 'auth'),
      expect.objectContaining({ npmScope: 'myscope', overwrite: false }),
    )
    expect(addToModules).toHaveBeenCalledWith(
      expect.objectContaining({
        tree,
        modulePath: 'apps/api/src/app.module.ts',
        moduleArrayName: 'pluginModules',
        moduleToAdd: 'AuthModule',
        importPath: '@myscope/api/custom',
      }),
    )
    const indexContent = tree.read('libs/api/custom/src/index.ts', 'utf-8')
    expect(indexContent).toContain("export * from './lib/plugins/auth/auth.module'")
    expect(formatFiles).toHaveBeenCalledWith(tree)
  })
})

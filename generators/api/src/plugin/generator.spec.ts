import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import generator from './generator'

describe('plugin-generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('should generate plugin files in the plugins folder', async () => {
    await generator(tree, { name: 'TestPlugin' })
    expect(tree.exists('libs/api/custom/src/lib/plugins/test-plugin/test-plugin.service.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/src/lib/plugins/test-plugin/test-plugin.resolver.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/src/lib/plugins/test-plugin/test-plugin.module.ts')).toBe(true)
  })
}) 
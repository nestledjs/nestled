import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { readProjectConfiguration, Tree } from '@nx/devkit'

import generator from './generator'
import { ApiFeatureGeneratorSchema } from './schema'

describe('api-feature generator', () => {
  let tree: Tree
  const options: ApiFeatureGeneratorSchema = { name: 'test', appName: 'test-app' }

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('should run successfully', async () => {
    await generator(tree, options)
    const config = readProjectConfiguration(tree, 'test')
    expect(config).toBeDefined()
  })
})

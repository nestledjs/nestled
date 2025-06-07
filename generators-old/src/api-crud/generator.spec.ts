import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { readProjectConfiguration, Tree } from '@nx/devkit'

import generator from './generator'
import { ApiCrudGeneratorSchema } from './schema'

describe('api-crud generator', () => {
  let tree: Tree
  const options: ApiCrudGeneratorSchema = { name: 'test' }

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('should run successfully', async () => {
    await generator(tree, options, 'test')
    const config = readProjectConfiguration(tree, 'test')
    expect(config).toBeDefined()
  })
})

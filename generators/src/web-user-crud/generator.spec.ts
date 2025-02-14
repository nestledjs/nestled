import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { readProjectConfiguration, Tree } from '@nx/devkit'

import generator from './generator'
import { WebUserCrudGeneratorSchema } from './schema'

describe('web-user-crud generator', () => {
  let tree: Tree
  const options: WebUserCrudGeneratorSchema = { name: 'test', plural: null, primaryField: 'name' }

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('should run successfully', async () => {
    await generator(tree, options)
    const config = readProjectConfiguration(tree, 'test')
    expect(config).toBeDefined()
  })
})

import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree, readProjectConfiguration } from '@nx/devkit'

import generator from './generator'
import { ApiLibGeneratorSchema } from './schema'

describe('api-lib generator', () => {
  let tree: Tree
  const options: ApiLibGeneratorSchema = { useDefaults: true }

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('should run successfully', async () => {
    await generator(tree, options)
    const config = readProjectConfiguration(tree, 'api-feature')
    expect(config).toBeDefined()
  })
})

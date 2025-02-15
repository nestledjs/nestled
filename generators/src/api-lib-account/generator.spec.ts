import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree, readProjectConfiguration } from '@nx/devkit'

import generator from './generator'
import { ApiLibAccountGeneratorSchema } from './schema'

describe('api-lib-account generator', () => {
  let tree: Tree
  const options: ApiLibAccountGeneratorSchema = { directory: 'libs/api/account' }

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('should run successfully', async () => {
    await generator(tree, options)
    const config = readProjectConfiguration(tree, 'api-account-feature')
    expect(config).toBeDefined()
  })
})

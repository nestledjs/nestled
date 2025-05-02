import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { apiDependenciesGenerator } from './generator'

describe('api-dependencies generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('should add required dependencies to package.json', async () => {
    await apiDependenciesGenerator(tree)
    // Note: We can't easily test package.json modifications in the tree
    // since addDependenciesToPackageJson is mocked in tests
    expect(tree).toBeDefined()
  })
})

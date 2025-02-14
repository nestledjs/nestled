import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { readProjectConfiguration, Tree } from '@nx/devkit'
import generator from './generator'

describe('api-lib-core generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    // Dynamically setting the npmScope in nx.json
    tree.write(
      'nx.json',
      JSON.stringify({
        npmScope: 'my-org', // Test with dynamic scope
        projects: {},
      }),
    )
  })

  it('should run successfully and create data-access library', async () => {
    // Run the generator for 'data-access'
    await generator(tree)

    // Check if the 'data-access' library config exists
    const dataAccessConfig = readProjectConfiguration(tree, 'api-core-data-access')
    expect(dataAccessConfig).toBeDefined()
    expect(dataAccessConfig.root).toBe('libs/api/core/data-access')

    // Check if the expected files are generated for 'data-access'
    expect(tree.exists('libs/api/core/src/lib/core-paging.input.ts')).toBeTruthy()
    expect(tree.exists('libs/api/core/src/lib/core-paging.ts')).toBeTruthy()
  })

  it('should run successfully and create feature library', async () => {
    // Run the generator for 'feature'
    await generator(tree)

    // Check if the 'feature' library config exists
    const featureConfig = readProjectConfiguration(tree, 'api-core-feature')
    expect(featureConfig).toBeDefined()
    expect(featureConfig.root).toBe('libs/api/core/feature')

    // Check if the expected files are generated for 'feature'
    expect(tree.exists('libs/api/core/src/lib/core-feature.service.ts')).toBeTruthy()
    expect(tree.exists('libs/api/core/src/lib/core-feature.module.ts')).toBeTruthy()
  })

  it('should add the correct tags to the project configuration', async () => {
    await generator(tree)

    const dataAccessConfig = readProjectConfiguration(tree, 'api-core-data-access')
    expect(dataAccessConfig).toBeDefined()
    expect(dataAccessConfig.tags).toContain('scope:api')
    expect(dataAccessConfig.tags).toContain('type:data-access')

    const featureConfig = readProjectConfiguration(tree, 'api-core-feature')
    expect(featureConfig.tags).toContain('scope:api')
    expect(featureConfig.tags).toContain('type:feature')
  })

  it('should insert the correct dynamic npmScope into generated files', async () => {
    await generator(tree)

    // Read a generated file and check for the correct npmScope
    const corePagingInput = tree.read('libs/api/core/src/lib/core-paging.input.ts', 'utf-8')
    expect(corePagingInput).toContain('@my-org') // Check for the dynamic npmScope
  })
})

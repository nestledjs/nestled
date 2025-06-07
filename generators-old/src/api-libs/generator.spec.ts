import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree, readProjectConfiguration, writeJson, addProjectConfiguration } from '@nx/devkit'
import * as nxNest from '@nx/nest'

import generator from './generator'
import { ApiLibGeneratorSchema } from './schema'

// Mock the library generator
jest.mock('@nx/nest', () => ({
  libraryGenerator: jest.fn().mockResolvedValue({}),
  Linter: {
    EsLint: 'eslint',
  },
}))

describe('api-lib generator', () => {
  let tree: Tree
  const options: ApiLibGeneratorSchema = { useDefaults: true }

  beforeEach(() => {
    // Create a workspace with nx.json and package.json
    tree = createTreeWithEmptyWorkspace()
    
    // Create a basic nx.json
    writeJson(tree, 'nx.json', {
      npmScope: 'test',
      targetDefaults: {
        build: {
          dependsOn: ['^build'],
        },
      },
    })

    // Create a basic package.json with npm scope
    writeJson(tree, 'package.json', {
      name: '@test/workspace',
      version: '0.0.0',
    })


    // Create the app.module.ts file that the generator expects
    tree.write(
      'apps/api/src/app.module.ts',
      `import { Module } from '@nestjs/common';

export const appModules = [];

@Module({
  imports: [...appModules],
})
export class AppModule {}
`
    )

    // Mock project configuration
    addProjectConfiguration(tree, 'api', {
      root: 'apps/api',
      sourceRoot: 'apps/api/src',
      projectType: 'application',
      targets: {},
    })
  })

  it('should run successfully', async () => {
    // Mock the library generator to return a project configuration
    const mockLibraryGenerator = nxNest.libraryGenerator as jest.Mock
    mockLibraryGenerator.mockResolvedValueOnce({
      projectName: 'api-feature',
      projectRoot: 'libs/api/feature',
    })

    await generator(tree, options)
    
    // Verify the library generator was called
    expect(mockLibraryGenerator).toHaveBeenCalled()
    
    // Verify the project was created
    const config = readProjectConfiguration(tree, 'api-feature')
    expect(config).toBeDefined()
  })
})

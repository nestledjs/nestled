// generators/api/src/generate-crud/generator.spec.ts

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { GenerateCrudGeneratorDependencies, generateCrudLogic } from './generator'
import { Tree } from '@nx/devkit'

// The mocked DMMF object
const userDmmf = {
  datamodel: {
    models: [
      {
        name: 'User',
        fields: [
          { name: 'id', type: 'Int', isId: true },
          { name: 'name', type: 'String', isId: false },
        ],
      },
    ],
  },
}

describe('generate-crud generator', () => {
  let tree: Tree
  let mockDependencies: GenerateCrudGeneratorDependencies

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    tree.write('prisma/schema.prisma', 'model User {}')

    mockDependencies = {
      formatFiles: vi.fn(),
      generateFiles: vi.fn(),
      installPackagesTask: vi.fn(),
      joinPathFragments: vi.fn((...args: string[]) => args.join('/')),
      names: vi.fn((name: string) => ({
        name,
        className: name.charAt(0).toUpperCase() + name.slice(1),
        propertyName: name,
        constantName: name.toUpperCase(),
        fileName: name,
      })),
      getDMMF: vi.fn().mockResolvedValue(userDmmf),
      apiLibraryGenerator: vi.fn().mockResolvedValue(undefined),
      getPrismaSchemaPath: vi.fn(() => 'prisma/schema.prisma'),
      readPrismaSchema: vi.fn(
        () => `
        /// @crudAuth: { "create": "public", "readMany": "user" }
        model User {
          id Int @id
          name String
        }
      `,
      ),
      getNpmScope: vi.fn(() => 'testscope'),
      // FIX: Add the missing mock for 'pluralize'
      pluralize: vi.fn((name: string) => (name.endsWith('s') ? name : `${name}s`)) as any,
    }
    vi.clearAllMocks()
  })

  it('returns early if no Prisma models are found', async () => {
    mockDependencies.getDMMF = vi.fn().mockResolvedValue({ datamodel: { models: [] } })

    // The test now correctly calls the exported logic function
    const result = await generateCrudLogic(tree, { name: 'crud' } as any, mockDependencies)

    expect(result).toBeUndefined()
    expect(mockDependencies.apiLibraryGenerator).not.toHaveBeenCalled()
    expect(mockDependencies.generateFiles).not.toHaveBeenCalled()
  })

  it('generates files and calls utilities for valid models', async () => {
    const callback = await generateCrudLogic(tree, { name: 'crud' } as any, mockDependencies)

    expect(mockDependencies.apiLibraryGenerator).toHaveBeenCalled()
    expect(mockDependencies.formatFiles).toHaveBeenCalled()

    expect(typeof callback).toBe('function')
    if (callback) callback()
    expect(mockDependencies.installPackagesTask).toHaveBeenCalled()
  })

  it('appends "List" to plural when singular and plural forms are the same', async () => {
    const dataDmmf = {
      datamodel: {
        models: [
          {
            name: 'Data',
            fields: [{ name: 'id', type: 'Int', isId: true }],
          },
        ],
      },
    }
    mockDependencies.getDMMF = vi.fn().mockResolvedValue(dataDmmf)
    mockDependencies.pluralize = vi.fn((name: string) => {
      if (name.toLowerCase() === 'data') {
        return name // Simulate plural('data') => 'data'
      }
      return name.endsWith('s') ? name : `${name}s`
    }) as any

    await generateCrudLogic(tree, { name: 'crud' } as any, mockDependencies)

    const modelsArg = (mockDependencies.apiLibraryGenerator as any).mock.calls[0][1].models[0]
    expect(modelsArg.pluralName).toBe('DataList')
    expect(modelsArg.pluralModelName).toBe('DataList')
    expect(modelsArg.pluralModelPropertyName).toBe('dataList')
  })
})

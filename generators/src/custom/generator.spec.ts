import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { customGeneratorLogic, CustomGeneratorDependencies } from './generator'

const dmmf = {
  datamodel: {
    models: [
      {
        name: 'User',
        fields: [
          { name: 'id', type: 'Int', isId: true },
          { name: 'name', type: 'String' },
        ],
      },
    ],
  },
}

describe('custom-generator', () => {
  let tree: Tree
  let mockDependencies: CustomGeneratorDependencies

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    mockDependencies = {
      formatFiles: vi.fn(),
      installPackagesTask: vi.fn(),
      getDMMF: vi.fn().mockResolvedValue(dmmf),
      addToModules: vi.fn(),
      apiLibraryGenerator: vi.fn(),
      getPrismaSchemaPath: vi.fn(() => 'prisma/schema.prisma'),
      readPrismaSchema: vi.fn(() => `model User {}`),
      execSync: vi.fn(),
      getNpmScope: vi.fn(() => 'test-scope'),
      pluralize: vi.fn((name: string) => (name.endsWith('s') ? name : name + 's')) as any,
      join: vi.fn((...args: string[]) => args.join('/')),
    }
    vi.clearAllMocks()
  })

  it('should generate files correctly', async () => {
    await customGeneratorLogic(tree, { name: 'custom' }, mockDependencies)
    expect(mockDependencies.apiLibraryGenerator).toHaveBeenCalledWith(
      tree,
      { name: 'custom' },
      '',
      undefined,
      false,
    )
    // Check if files are generated in the new structure
    expect(tree.exists('libs/api/custom/src/lib/default/user/user.service.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/src/lib/default/user/user.resolver.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/src/lib/default/user/user.module.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/src/index.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/src/lib/plugins')).toBe(true)
  })

  it('should be idempotent and not overwrite existing model folders', async () => {
    // First run
    await customGeneratorLogic(tree, { name: 'custom' }, mockDependencies)
    // Write a marker file to simulate user customization
    tree.write('libs/api/custom/src/lib/default/user/custom.txt', 'do not overwrite')
    // Second run
    await customGeneratorLogic(tree, { name: 'custom' }, mockDependencies)
    // The marker file should still exist
    expect(tree.read('libs/api/custom/src/lib/default/user/custom.txt', 'utf-8')).toBe('do not overwrite')
  })

  it('should not generate files if no models are found', async () => {
    mockDependencies.getDMMF = vi.fn().mockResolvedValue({ datamodel: { models: [] } })
    await customGeneratorLogic(tree, { name: 'custom' }, mockDependencies)
    expect(mockDependencies.execSync).not.toHaveBeenCalled()
  })
})

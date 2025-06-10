import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import { getDMMF } from '@prisma/internals'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import generator from './generator'
import { apiLibraryGenerator, getPrismaSchemaPath, readPrismaSchema } from '@nestled/utils'

// Mock dependencies
vi.mock('child_process')
vi.mock('@prisma/internals')
vi.mock('@nestled/utils', async () => {
  const actual = await vi.importActual<typeof import('@nestled/utils')>('@nestled/utils')
  return {
    ...actual,
    apiLibraryGenerator: vi.fn().mockResolvedValue(undefined),
    getPrismaSchemaPath: vi.fn(),
    readPrismaSchema: vi.fn(),
  }
})
vi.mock('@nx/js/src/utils/package-json/get-npm-scope')

describe('custom-generator', () => {
  let tree: Tree

  beforeEach(async () => {
    tree = createTreeWithEmptyWorkspace()
    vi.clearAllMocks()

    vi.mocked(getNpmScope).mockReturnValue('test-scope')
    vi.mocked(getPrismaSchemaPath).mockReturnValue('prisma/schema.prisma')
    vi.mocked(readPrismaSchema).mockReturnValue(`
      model User {
        id Int @id @default(autoincrement())
        name String
      }
    `)
    vi.mocked(getDMMF).mockResolvedValue({
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
    } as any)
  })

  it('should generate files correctly', async () => {
    await generator(tree, { name: 'custom' })
    expect(apiLibraryGenerator).toHaveBeenCalledWith(tree, { name: 'custom' }, '', undefined, false)
    // Check if files are generated in the new structure
    expect(tree.exists('libs/api/custom/src/lib/default/user/user.service.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/src/lib/default/user/user.resolver.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/src/lib/default/user/user.module.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/src/index.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/src/lib/plugins')).toBe(true)
  })

  it('should be idempotent and not overwrite existing model folders', async () => {
    await generator(tree, { name: 'custom' })
    // Write a marker file to simulate user customization
    tree.write('libs/api/custom/src/lib/default/user/custom.txt', 'do not overwrite')
    await generator(tree, { name: 'custom' })
    // The marker file should still exist
    expect(tree.read('libs/api/custom/src/lib/default/user/custom.txt', 'utf-8')).toBe('do not overwrite')
  })

  it('should not generate files if no models are found', async () => {
    vi.mocked(getDMMF).mockResolvedValue({ datamodel: { models: [] } } as any)
    await generator(tree, { name: 'custom' })
    expect(execSync).not.toHaveBeenCalled()
  })
})

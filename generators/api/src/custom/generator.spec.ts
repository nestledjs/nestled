import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import { getDMMF } from '@prisma/internals'
import { getPrismaSchemaPath, readPrismaSchema } from '@nestled/utils'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import generator from './generator'

// Mock dependencies
vi.mock('child_process')
vi.mock('@prisma/internals')
vi.mock('@nestled/utils')
vi.mock('@nx/js/src/utils/package-json/get-npm-scope')

describe('custom-generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    vi.clearAllMocks()

    // Mock implementations
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

    // Check if libraries were "created"
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('nx g @nx/nest:library --name=api-custom-data-access'), expect.any(Object))
    expect(execSync).toHaveBeenCalledWith(expect.stringContaining('nx g @nx/nest:library --name=api-custom-feature'), expect.any(Object))

    // Check if files are generated
    expect(tree.exists('libs/api/custom/data-access/src/lib/user.service.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/feature/src/lib/user.resolver.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/data-access/src/lib/api-custom-data-access.module.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/feature/src/lib/api-custom-feature.module.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/data-access/src/index.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/feature/src/index.ts')).toBe(true)
  })

  it('should not generate files if no models are found', async () => {
    vi.mocked(getDMMF).mockResolvedValue({ datamodel: { models: [] } } as any)
    await generator(tree, { name: 'custom' })
    expect(execSync).not.toHaveBeenCalled()
  })
}) 
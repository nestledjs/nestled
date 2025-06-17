import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { getDMMF } from '@prisma/internals'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import generator from './generator'
import { apiLibraryGenerator, getPrismaSchemaPath, readPrismaSchema } from '@nestledjs/utils'

// Mock dependencies
vi.mock('@prisma/internals')
vi.mock('@nestledjs/utils', () => {
  return {
    apiLibraryGenerator: vi.fn().mockResolvedValue(undefined),
    getPrismaSchemaPath: vi.fn(),
    readPrismaSchema: vi.fn(),
  }
})
vi.mock('@nx/js/src/utils/package-json/get-npm-scope')

describe('extended-generator', () => {
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
      model Post {
        id Int @id @default(autoincrement())
        title String
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
          {
            name: 'Post',
            fields: [
              { name: 'id', type: 'Int', isId: true },
              { name: 'title', type: 'String' },
            ],
          },
        ],
      },
    } as any)
  })

  it('should generate a library for each model with expected files', async () => {
    await generator(tree, { overwrite: true })
    // User library
    expect(apiLibraryGenerator).toHaveBeenCalledWith(
      tree,
      { name: 'extended-user', overwrite: true },
      '',
      undefined,
      false,
    )
    expect(tree.exists('libs/api/extended/user/src/lib/user.service.ts')).toBe(true)
    expect(tree.exists('libs/api/extended/user/src/lib/user.resolver.ts')).toBe(true)
    expect(tree.exists('libs/api/extended/user/src/lib/user.module.ts')).toBe(true)
    expect(tree.exists('libs/api/extended/user/src/index.ts')).toBe(true)
    // Post library
    expect(apiLibraryGenerator).toHaveBeenCalledWith(
      tree,
      { name: 'extended-post', overwrite: true },
      '',
      undefined,
      false,
    )
    expect(tree.exists('libs/api/extended/post/src/lib/post.service.ts')).toBe(true)
    expect(tree.exists('libs/api/extended/post/src/lib/post.resolver.ts')).toBe(true)
    expect(tree.exists('libs/api/extended/post/src/lib/post.module.ts')).toBe(true)
    expect(tree.exists('libs/api/extended/post/src/index.ts')).toBe(true)
  })

  it('should not generate files if no models are found', async () => {
    vi.mocked(getDMMF).mockResolvedValue({ datamodel: { models: [] } } as any)
    await generator(tree, { overwrite: true })
    // No libraries should be created
    expect(apiLibraryGenerator).not.toHaveBeenCalled()
  })
})

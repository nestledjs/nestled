vi.mock('child_process')
import { Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { execSync } from 'child_process'
import { getDMMF } from '@prisma/internals'
import * as devkit from '@nx/devkit'
import * as nestledUtils from '@nestled/utils'

import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import generator from './generator'
import { GenerateCrudGeneratorSchema } from './schema'
import { updateTypeScriptConfigs } from '@nestled/utils'

// Mock dependencies
vi.mock('@prisma/internals')
vi.mock('@nestled/utils')
vi.mock('@nx/js/src/utils/package-json/get-npm-scope')
vi.mock('@nx/devkit', async () => {
  const actual = await vi.importActual<typeof devkit>('@nx/devkit')
  return {
    ...actual,
    formatFiles: vi.fn(),
    installPackagesTask: vi.fn(),
  }
})

describe('generate-crud generator', () => {
  let tree: Tree

  const mockSchema = `
    /// @crudAuth: { "create": "user", "readMany": "public" }
    model User {
      id Int @id @default(autoincrement())
      name String
    }

    model Post {
      id Int @id @default(autoincrement())
      title String
    }
    `
  const mockDMMF = {
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
  }

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    vi.clearAllMocks()

    // Mock implementations
    vi.mocked(getNpmScope).mockReturnValue('test-scope')
    vi.mocked(nestledUtils.getPrismaSchemaPath).mockReturnValue('prisma/schema.prisma')
    vi.mocked(nestledUtils.readPrismaSchema).mockReturnValue(mockSchema)
    vi.mocked(getDMMF).mockResolvedValue(mockDMMF as any)
  })

  it('should run successfully and generate correct files with auth guards', async () => {
    const options: GenerateCrudGeneratorSchema = {
      name: 'generated-crud',
      directory: 'libs/api',
      model: 'user',
      plural: 'users',
    }
    await generator(tree, options)

    // Check that the correct files are created
    expect(tree.exists('libs/api/generated-crud/feature/src/lib/user.resolver.ts')).toBe(true)
    expect(tree.exists('libs/api/generated-crud/feature/src/lib/post.resolver.ts')).toBe(true)
    expect(tree.exists('libs/api/generated-crud/feature/src/lib/api-admin-crud-feature.module.ts')).toBe(true)
    expect(tree.exists('libs/api/generated-crud/feature/src/index.ts')).toBe(true)
    expect(tree.exists('libs/api/generated-crud/data-access/src/lib/api-crud-data-access.service.ts')).toBe(true)
    expect(tree.exists('libs/api/generated-crud/data-access/src/index.ts')).toBe(true)

    // Verify auth guards in the User resolver
    const userResolver = tree.read('libs/api/generated-crud/feature/src/lib/user.resolver.ts', 'utf-8')
    expect(userResolver).toContain('@UseGuards(GqlAuthGuard)\n  create') // create: 'user'
    expect(userResolver).not.toContain('@UseGuards(GqlAuthGuard)\n  users')
    expect(userResolver).toContain('@UseGuards(GqlAuthAdminGuard)\n  user(') // readOne: 'admin' (default)

    // Verify auth guards in the Post resolver (should all be default admin)
    const postResolver = tree.read('libs/api/generated-crud/feature/src/lib/post.resolver.ts', 'utf-8')
    expect(postResolver).toContain('@UseGuards(GqlAuthAdminGuard)')
    expect(postResolver).not.toContain('@UseGuards(GqlAuthGuard)')

    // Check that formatFiles is called
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree)
  })

  it('should do nothing if no models are found', async () => {
    vi.mocked(getDMMF).mockResolvedValue({ datamodel: { models: [] } } as any)
    const options: GenerateCrudGeneratorSchema = {
      name: 'generated-crud',
      directory: 'libs/api',
      model: 'user',
      plural: 'users',
    }
    await generator(tree, options)
    expect(execSync).not.toHaveBeenCalled()
    expect(tree.exists('libs/api/generated-crud/data-access/src/lib/api-crud-data-access.service.ts')).toBe(false)
    expect(tree.exists('libs/api/generated-crud/feature/src/lib/user.resolver.ts')).toBe(false)
  })
}) 
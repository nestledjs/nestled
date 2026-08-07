import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { sdkGeneratorLogic, SdkGeneratorDependencies } from './generator'
import { Tree } from '@nx/devkit'

const prismaSchema = `
generator client {
  provider = "prisma-client"
}

datasource db {
  provider = "sqlite"
}

model User {
  id   Int @id @default(autoincrement())
}
`

const prismaSchemaWithEnums = `
generator client {
  provider = "prisma-client"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  ADMIN
  USER
  GUEST
}

enum Permission {
  READ
  WRITE
  DELETE
}

model User {
  id          Int          @id @default(autoincrement())
  name        String
  role        Role
  permissions Permission[]
}
`

describe('sdk generator', () => {
  let tree: Tree
  let mockDependencies: SdkGeneratorDependencies

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    // Add a package.json to the root for getNpmScope to work
    tree.write('package.json', JSON.stringify({ name: '@test/workspace' }))
    mockDependencies = {
      formatFiles: vi.fn(),
      installPackagesTask: vi.fn(),
      generateFiles: vi.fn(),
      joinPathFragments: vi.fn((...args: string[]) => args.join('/')),
      readJson: vi.fn().mockReturnValue({ prisma: { schema: 'prisma/schema.prisma' } }),
      addDependenciesToPackageJson: vi.fn(),
      addScriptToPackageJson: vi.fn(),
      getPluralName: vi.fn((name: string) => name + 's'),
      libraryGenerator: vi.fn(),
      getNpmScope: vi.fn().mockReturnValue('test'),
      join: vi.fn((...args: string[]) => args.join('/')),
      existsSync: vi.fn().mockReturnValue(true),
      statSync: vi.fn().mockReturnValue({ isDirectory: () => false }),
      readdirSync: vi.fn().mockReturnValue([]),
      readFileSync: vi.fn().mockReturnValue(prismaSchema),
    }
    vi.clearAllMocks()
  })

  it('throws if prisma schema path is missing in config or package.json', async () => {
    mockDependencies.readJson = vi.fn().mockReturnValue({})
    await expect(sdkGeneratorLogic(tree, {}, mockDependencies)).rejects.toThrow(
      'Prisma schema path not found (config or package.json)',
    )
  })

  it('throws if prisma schema file does not exist', async () => {
    mockDependencies.existsSync = vi.fn().mockReturnValue(false)
    await expect(sdkGeneratorLogic(tree, {}, mockDependencies)).rejects.toThrow('Prisma schema not found at')
  })

  it('generates the admin SDK without scaffolding public CRUD operations', async () => {
    const callback = await sdkGeneratorLogic(tree, {}, mockDependencies)
    expect(mockDependencies.generateFiles).toHaveBeenCalled()
    expect(mockDependencies.addScriptToPackageJson).toHaveBeenCalledWith(tree, 'sdk', expect.any(String))
    expect(mockDependencies.addDependenciesToPackageJson).toHaveBeenCalled()
    expect(mockDependencies.formatFiles).toHaveBeenCalledWith(tree)
    expect(typeof callback).toBe('function')
    if (callback) callback()
    expect(mockDependencies.installPackagesTask).toHaveBeenCalledWith(tree)

    // Model-derived documents belong only to the regenerated admin namespace.
    const calls = vi.mocked(mockDependencies.generateFiles).mock.calls
    const publicModelCall = calls.find(
      ([_, templateDir, modelDir]) =>
        typeof templateDir === 'string' &&
        templateDir.includes('/sdk/graphql') &&
        typeof modelDir === 'string' &&
        !modelDir.includes('__admin'),
    )
    const adminCall = calls.find(
      ([_, __, modelDir, context]) =>
        typeof modelDir === 'string' && modelDir.includes('__admin') && context?.adminPrefix === '__Admin',
    )
    expect(publicModelCall).toBeUndefined()
    expect(adminCall).toBeTruthy()
    expect(adminCall[3].adminPrefix).toBe('__Admin')
  })

  it('preserves hand-written public SDK operations', async () => {
    mockDependencies.readFileSync = vi.fn().mockReturnValue(`
generator client {
  provider = "prisma-client"
}

datasource db {
  provider = "sqlite"
}

/// @skipCrud
model PasswordHistory {
  id Int @id
}
`)
    const publicOperationPath = 'libs/shared/sdk/src/graphql/password-history/account-security.graphql'
    const publicOperation = 'query MyProfile { me { id } }\n'
    tree.write(publicOperationPath, publicOperation)

    await sdkGeneratorLogic(tree, {}, mockDependencies)

    expect(tree.read(publicOperationPath, 'utf-8')).toBe(publicOperation)
  })

  describe('database-models.ts security metadata', () => {
    const schema = `
model Account {
  id Int @id
}
`

    async function generateAndReadDatabaseModels(schemaContent = schema) {
      tree.write('libs/api/prisma/src/lib/schemas/schema.prisma', schemaContent)
      await sdkGeneratorLogic(tree, {}, mockDependencies)
      const content = tree.read('libs/shared/sdk/src/lib/database-models.ts', 'utf-8') as string
      const marker = 'export const DATABASE_MODELS: DatabaseModel[] = '
      const start = content.indexOf(marker) + marker.length
      return {
        content,
        models: JSON.parse(content.slice(start, content.indexOf('\n\nexport const DATABASE_MODELS_BY_NAME'))),
      }
    }

    it('omits obsolete per-model auth metadata', async () => {
      const { content, models } = await generateAndReadDatabaseModels()

      expect(models.find((model: any) => model.modelName === 'Account')).not.toHaveProperty('auth')
      expect(content).not.toContain('auth?:')
    })

    it('rejects @crudAuth rather than preserving a lower-privilege configuration', async () => {
      await expect(
        generateAndReadDatabaseModels(`
/// @crudAuth: { "readMany": "user" }
model Session {
  id Int @id
}
`),
      ).rejects.toThrow(/Remove @crudAuth from: Session/)
    })
  })

  describe('enum field handling', () => {
    it('includes single-select and multi-select enum fields in fragment fields', async () => {
      mockDependencies.readFileSync = vi.fn().mockReturnValue(prismaSchemaWithEnums)

      await sdkGeneratorLogic(tree, {}, mockDependencies)

      const calls = vi.mocked(mockDependencies.generateFiles).mock.calls

      // Find the admin SDK call for User model
      const adminCall = calls.find(
        ([_, __, modelDir, context]) =>
          typeof modelDir === 'string' && modelDir.includes('__admin/user') && context?.adminPrefix === '__Admin',
      )
      expect(adminCall).toBeTruthy()

      // Check that fragmentFields includes both the single enum (role) and multi-select enum (permissions)
      const fragmentFields = adminCall![3].fragmentFields as string
      expect(fragmentFields).toContain('name')
      expect(fragmentFields).toContain('role') // Single-select enum
      expect(fragmentFields).toContain('permissions') // Multi-select enum

      const publicModelCall = calls.find(
        ([_, templateDir, modelDir]) =>
          typeof templateDir === 'string' &&
          templateDir.includes('/sdk/graphql') &&
          typeof modelDir === 'string' &&
          !modelDir.includes('__admin'),
      )
      expect(publicModelCall).toBeUndefined()
    })
  })

  describe('codegen.yml handling', () => {
    it('generates new codegen.yml when file does not exist', async () => {
      tree.exists = vi.fn().mockImplementation((path: string) => {
        return path !== 'libs/shared/sdk/src/codegen.yml'
      })

      await sdkGeneratorLogic(tree, {}, mockDependencies)

      expect(mockDependencies.generateFiles).toHaveBeenCalledWith(
        tree,
        expect.stringContaining('./files'),
        'libs/shared/sdk/src',
        { tmpl: '' },
      )
    })

    it('preserves existing codegen.yml by default', async () => {
      const existingContent = 'overwrite: true\nschema: "./api-schema.graphql"'
      tree.exists = vi.fn().mockImplementation((path: string) => {
        return path === 'libs/shared/sdk/src/codegen.yml' || path === 'package.json'
      })
      tree.read = vi.fn().mockImplementation((path: string) => {
        if (path === 'libs/shared/sdk/src/codegen.yml') {
          return existingContent
        }
        return null
      })
      tree.write = vi.fn()

      await sdkGeneratorLogic(tree, {}, mockDependencies)

      expect(tree.read).toHaveBeenCalledWith('libs/shared/sdk/src/codegen.yml', 'utf-8')
      expect(tree.write).toHaveBeenCalledWith('libs/shared/sdk/src/codegen.yml', existingContent)
    })

    it('forces regeneration when forceCodegen is true', async () => {
      tree.exists = vi.fn().mockImplementation((path: string) => {
        return path === 'libs/shared/sdk/src/codegen.yml' || path === 'package.json'
      })
      tree.read = vi.fn()
      tree.write = vi.fn()

      await sdkGeneratorLogic(tree, { forceCodegen: true }, mockDependencies)

      expect(mockDependencies.generateFiles).toHaveBeenCalledWith(
        tree,
        expect.stringContaining('./files'),
        'libs/shared/sdk/src',
        { tmpl: '' },
      )
      // Should not preserve existing content when force regenerating
      expect(tree.read).not.toHaveBeenCalledWith('libs/shared/sdk/src/codegen.yml', 'utf-8')
    })

    it('handles null return from tree.read gracefully', async () => {
      tree.exists = vi.fn().mockImplementation((path: string) => {
        return path === 'libs/shared/sdk/src/codegen.yml' || path === 'package.json'
      })
      tree.read = vi.fn().mockReturnValue(null)
      tree.write = vi.fn()

      await sdkGeneratorLogic(tree, {}, mockDependencies)

      expect(tree.write).toHaveBeenCalledWith('libs/shared/sdk/src/codegen.yml', '')
    })
  })
})

// generators/api/src/generate-crud/generator.spec.ts

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { GenerateCrudGeneratorDependencies, generateCrudLogic, generateResolverContent } from './generator'
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

    expect(mockDependencies.apiLibraryGenerator).toHaveBeenNthCalledWith(
      1,
      tree,
      expect.objectContaining({ name: 'crud' }),
      expect.any(String),
      'data-access',
    )
    expect(mockDependencies.apiLibraryGenerator).toHaveBeenNthCalledWith(
      2,
      tree,
      expect.objectContaining({ name: 'crud' }),
      expect.any(String),
      'feature',
      true,
    )
    expect(mockDependencies.formatFiles).toHaveBeenCalled()

    expect(typeof callback).toBe('function')
    if (callback) callback()
    expect(mockDependencies.installPackagesTask).toHaveBeenCalled()
  })

  it('rejects @crudAuth before writing generated output', async () => {
    mockDependencies.getDMMF = vi.fn().mockResolvedValue({
      datamodel: {
        models: [
          {
            name: 'User',
            documentation: '@crudAuth: { "readMany": "user" }',
            fields: [{ name: 'id', type: 'String', isId: true }],
          },
        ],
      },
    })

    await expect(generateCrudLogic(tree, { name: 'crud' } as any, mockDependencies)).rejects.toThrow(
      /generated CRUD is always admin-only.*Remove @crudAuth from: User/,
    )
    expect(mockDependencies.apiLibraryGenerator).not.toHaveBeenCalled()
  })

  it('writes one canonical populated feature module and removes the legacy duplicate', async () => {
    const legacyPath = 'libs/api/crud/feature/src/lib/api-admin-crud-feature.module.ts'
    tree.write(legacyPath, 'legacy module')

    await generateCrudLogic(tree, { name: 'crud' } as any, mockDependencies)

    const canonicalPath = 'libs/api/crud/feature/src/lib/api-generated-crud-feature.module.ts'
    expect(tree.read(canonicalPath, 'utf-8')).toContain('export class ApiGeneratedCrudFeatureModule')
    expect(tree.read(canonicalPath, 'utf-8')).toContain('providers: [GeneratedUserResolver]')
    expect(tree.exists(legacyPath)).toBe(false)
    expect(tree.read('libs/api/crud/feature/src/index.ts', 'utf-8')).toContain(
      "export * from './lib/api-generated-crud-feature.module'",
    )
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

  const baseResolverModel: any = {
    name: 'User',
    pluralName: 'Users',
    fields: [],
    primaryField: 'name',
    modelName: 'User',
    modelPropertyName: 'user',
    pluralModelName: 'Users',
    pluralModelPropertyName: 'users',
    idFieldType: 'String',
  }

  describe('admin-only resolver boundary', () => {
    it('protects the generated resolver once at class level', () => {
      const source = generateResolverContent(baseResolverModel, 'scope')

      expect(source).toContain("import { UseGuards } from '@nestjs/common'")
      expect(source).toContain(
        "import { AdminOnly, GqlAuthAdminGuard, RequirePlatformPermissionUnderClassGuard } from '@scope/api/utils'",
      )
      expect(source).toContain(
        '@Resolver(() => User)\n@UseGuards(GqlAuthAdminGuard)\n@AdminOnly()\nexport class GeneratedUserResolver',
      )
      expect(source.match(/@AdminOnly\(\)/g)).toHaveLength(1)
      expect(source.match(/@RequirePlatformPermissionUnderClassGuard\('platform\.data-browser\.read'\)/g)).toHaveLength(3)
      expect(source.match(/@RequirePlatformPermissionUnderClassGuard\('platform\.data-browser\.manage'\)/g)).toHaveLength(3)
      expect(source).not.toContain('@Public()')
      expect(source).not.toContain('@Authenticated()')
      expect(source).not.toContain('GqlAuthGuard')
    })

    it('cannot be lowered by obsolete auth metadata supplied programmatically', () => {
      const source = generateResolverContent(
        { ...baseResolverModel, auth: { readMany: 'public', create: 'user' } },
        'scope',
      )

      expect(source).toBe(generateResolverContent(baseResolverModel, 'scope'))
    })
  })

  // The posture file is the same single source of truth the downstream doctor and guard-posture
  // spec read (nestled-dev-template#140): the generator must emit what the repo declares, so
  // `db-update` is idempotent mid-migration instead of silently re-tightening rolled-back guards.
  describe('guard posture', () => {
    const posturePath = '.nestled-updates/security/generated-crud-posture.json'
    const resolverPath = 'libs/api/crud/feature/src/lib/user.resolver.ts'

    it('emits the authenticated tier when the posture file declares it', async () => {
      tree.write(posturePath, JSON.stringify({ posture: 'authenticated', reason: 'staged rollback' }))
      await generateCrudLogic(tree, { name: 'crud' } as any, mockDependencies)

      const source = tree.read(resolverPath, 'utf-8')!
      expect(source).toContain("import { Authenticated, GqlAuthGuard } from '@testscope/api/utils'")
      expect(source).toContain('@UseGuards(GqlAuthGuard)\n@Authenticated()')
      expect(source).not.toContain('AdminOnly')
      expect(source).not.toContain('GqlAuthAdminGuard')
      expect(source).not.toContain('RequirePlatformPermissionUnderClassGuard')
    })

    it('defaults to admin, quietly, when no posture file exists', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      await generateCrudLogic(tree, { name: 'crud' } as any, mockDependencies)

      expect(tree.read(resolverPath, 'utf-8')).toContain('@UseGuards(GqlAuthAdminGuard)\n@AdminOnly()')
      expect(warn).not.toHaveBeenCalled()
      warn.mockRestore()
    })

    it('fails closed to admin and warns on unparseable JSON', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      tree.write(posturePath, '{ not json')
      await generateCrudLogic(tree, { name: 'crud' } as any, mockDependencies)

      expect(tree.read(resolverPath, 'utf-8')).toContain('@UseGuards(GqlAuthAdminGuard)\n@AdminOnly()')
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('unparseable JSON'))
      warn.mockRestore()
    })

    it('fails closed to admin and warns on an unrecognized posture value', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      tree.write(posturePath, JSON.stringify({ posture: 'authetnicated' }))
      await generateCrudLogic(tree, { name: 'crud' } as any, mockDependencies)

      expect(tree.read(resolverPath, 'utf-8')).toContain('@UseGuards(GqlAuthAdminGuard)\n@AdminOnly()')
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('unrecognized posture "authetnicated"'))
      warn.mockRestore()
    })

    it('fails closed to admin and warns on a wrong-typed posture value', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      tree.write(posturePath, JSON.stringify({ posture: 1 }))
      await generateCrudLogic(tree, { name: 'crud' } as any, mockDependencies)

      expect(tree.read(resolverPath, 'utf-8')).toContain('@UseGuards(GqlAuthAdminGuard)\n@AdminOnly()')
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('a non-string posture (1)'))
      warn.mockRestore()
    })

    it('fails closed to admin and warns when the posture key is absent', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      tree.write(posturePath, JSON.stringify({ reason: 'forgot the key' }))
      await generateCrudLogic(tree, { name: 'crud' } as any, mockDependencies)

      expect(tree.read(resolverPath, 'utf-8')).toContain('@UseGuards(GqlAuthAdminGuard)\n@AdminOnly()')
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('no "posture" key'))
      warn.mockRestore()
    })
  })

  describe('filter inputs', () => {
    // Prisma's `where` is built from the database model, so before typed filter inputs any column
    // was filterable whether or not it was queryable — @graphqlOmit gave no protection, and
    // credential columns could be read back a character at a time using result presence as an
    // oracle. The omitted fields are stripped before filter generation, so they cannot be filtered.
    const sensitiveDmmf = {
      datamodel: {
        models: [
          {
            name: 'User',
            fields: [
              { name: 'id', type: 'String', isId: true, isRequired: true },
              { name: 'email', type: 'String', isRequired: true },
              { name: 'passwordResetToken', type: 'String', documentation: '@graphqlOmit' },
              { name: 'inviteToken', type: 'String', documentation: 'some note @graphqlOmit trailing' },
            ],
          },
        ],
      },
    }

    it('never emits a filter for a @graphqlOmit column', async () => {
      mockDependencies.getDMMF = vi.fn().mockResolvedValue(sensitiveDmmf)

      await generateCrudLogic(tree, { name: 'crud' } as any, mockDependencies)

      const { filterInputs } = (mockDependencies.apiLibraryGenerator as any).mock.calls[0][1]
      expect(filterInputs).toContain('email?: StringFilterInput')
      expect(filterInputs).not.toContain('passwordResetToken')
      expect(filterInputs).not.toContain('inviteToken')
    })

    it('passes the filter variables through to the templates', async () => {
      mockDependencies.getDMMF = vi.fn().mockResolvedValue(sensitiveDmmf)

      await generateCrudLogic(tree, { name: 'crud' } as any, mockDependencies)

      const templateSchema = (mockDependencies.apiLibraryGenerator as any).mock.calls[0][1]
      expect(templateSchema.filterInputNames).toEqual({ User: 'UserFilterInput' })
      expect(templateSchema.filterInputs).toContain('export class UserFilterInput')
    })

    it('honours a configured filter depth', async () => {
      mockDependencies.getDMMF = vi.fn().mockResolvedValue(sensitiveDmmf)

      await generateCrudLogic(tree, { name: 'crud', filterDepth: 1 } as any, mockDependencies)

      const { filterInputs } = (mockDependencies.apiLibraryGenerator as any).mock.calls[0][1]
      expect(filterInputs).toContain('export class UserFilterInput')
      expect(filterInputs).not.toContain('UserFilterInput2')
    })
  })
})

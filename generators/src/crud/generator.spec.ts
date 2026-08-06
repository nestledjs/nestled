// generators/api/src/generate-crud/generator.spec.ts

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import {
  GenerateCrudGeneratorDependencies,
  generateCrudLogic,
  generateResolverContent,
  getAccessLevelDecoratorForAuthLevel,
  getCrudAuthForModel,
  getGuardForAuthLevel,
} from './generator'
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

  it('does not inherit @crudAuth from a model whose name merely starts with this model name', async () => {
    // Regression: looking up `User` used to match `model UserSessionProgress` because the schema
    // scan had no word boundary, so User silently inherited the other model's user-level config.
    const collidingDmmf = {
      datamodel: {
        models: [
          {
            name: 'UserSessionProgress',
            documentation:
              '@crudAuth: { "readOne": "user", "readMany": "user", "count": "user", "create": "user", "update": "user" }',
            fields: [{ name: 'id', type: 'Int', isId: true }],
          },
          {
            name: 'User',
            fields: [{ name: 'id', type: 'Int', isId: true }],
          },
        ],
      },
    }
    mockDependencies.getDMMF = vi.fn().mockResolvedValue(collidingDmmf)

    await generateCrudLogic(tree, { name: 'crud' } as any, mockDependencies)

    const models = (mockDependencies.apiLibraryGenerator as any).mock.calls[0][1].models
    const user = models.find((model: any) => model.name === 'User')
    expect(user.auth).toEqual({
      readOne: 'admin',
      readMany: 'admin',
      count: 'admin',
      create: 'admin',
      update: 'admin',
      delete: 'admin',
    })

    // The annotated model itself must still keep its own configuration.
    const progress = models.find((model: any) => model.name === 'UserSessionProgress')
    expect(progress.auth).toMatchObject({ readOne: 'user', readMany: 'user', delete: 'admin' })
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

  describe('getAccessLevelDecoratorForAuthLevel', () => {
    it('maps the built-in levels', () => {
      expect(getAccessLevelDecoratorForAuthLevel('admin')).toBe('AdminOnly')
      expect(getAccessLevelDecoratorForAuthLevel('user')).toBe('Authenticated')
      expect(getAccessLevelDecoratorForAuthLevel('public')).toBe('Public')
    })

    it('is case insensitive, matching the guard resolver', () => {
      expect(getAccessLevelDecoratorForAuthLevel('PUBLIC')).toBe('Public')
      expect(getAccessLevelDecoratorForAuthLevel('Admin')).toBe('AdminOnly')
    })

    it('treats a custom level as authenticated without guessing a stricter level', () => {
      // The custom guard remains authoritative; the decorator only declares that a level exists.
      expect(getAccessLevelDecoratorForAuthLevel('billingAdmin')).toBe('Authenticated')
      expect(getAccessLevelDecoratorForAuthLevel('noaccess')).toBe('Authenticated')
      expect(getAccessLevelDecoratorForAuthLevel('superAdmin')).toBe('Authenticated')
    })

    it('falls back to admin for an empty level', () => {
      expect(getAccessLevelDecoratorForAuthLevel('')).toBe('AdminOnly')
    })

    it('treats an empty level the same as an absent one when generating', () => {
      // resolveOperationAccess uses a default parameter, which only covers undefined — this pins
      // that a malformed empty level still resolves to admin rather than emitting a bare guard.
      const emptyLevel: any = { ...baseResolverModel, auth: { readMany: '' } }
      const absent: any = { ...baseResolverModel }

      const withEmpty = generateResolverContent(emptyLevel, 'scope')
      const withAbsent = generateResolverContent(absent, 'scope')
      expect(withEmpty).toBe(withAbsent)
      expect(withEmpty).toContain('@AdminOnly()')
    })
  })

  describe('access level decorators', () => {
    // The template registers a global APP_GUARD that refuses any operation which has not declared
    // an access level. Generated operations must therefore declare one themselves, so the interim
    // bridge that accepted an attached guard as a declaration can be deleted.
    const baseModel = baseResolverModel

    const allLevels = (level: string) => ({
      readOne: level,
      readMany: level,
      count: level,
      create: level,
      update: level,
      delete: level,
    })

    /** Decorator lines attached to an operation, i.e. between its @Query/@Mutation and its body. */
    function decoratorsFor(source: string, methodName: string): string[] {
      const lines = source.split('\n')
      const methodIndex = lines.findIndex((l) => l.trimStart().startsWith(`${methodName}(`))
      const decorators: string[] = []
      for (let i = methodIndex - 1; i >= 0 && lines[i].trimStart().startsWith('@'); i--) {
        decorators.unshift(lines[i].trim())
      }
      return decorators
    }

    function utilsImport(source: string): string[] {
      const line = source.split('\n').find((l) => l.includes("/api/utils'")) ?? ''
      return (/import \{([^}]*)\}/.exec(line)?.[1] ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }

    it('maps admin to @AdminOnly() with the admin guard', () => {
      const source = generateResolverContent({ ...baseModel, auth: allLevels('admin') }, 'scope')

      expect(decoratorsFor(source, 'users')).toEqual([
        '@Query(() => [User], { nullable: true })',
        '@AdminOnly()',
        '@UseGuards(GqlAuthAdminGuard)',
      ])
    })

    it('maps user to @Authenticated() with the user guard', () => {
      const source = generateResolverContent({ ...baseModel, auth: allLevels('user') }, 'scope')

      expect(decoratorsFor(source, 'users')).toEqual([
        '@Query(() => [User], { nullable: true })',
        '@Authenticated()',
        '@UseGuards(GqlAuthGuard)',
      ])
    })

    it('maps public to @Public() with no guard', () => {
      // Previously this emitted no decorator at all — output indistinguishable from a dropped one.
      const source = generateResolverContent({ ...baseModel, auth: allLevels('public') }, 'scope')

      expect(decoratorsFor(source, 'users')).toEqual(['@Query(() => [User], { nullable: true })', '@Public()'])
      expect(source).not.toContain('@UseGuards')
    })

    it('maps a custom level to @Authenticated() while keeping its own guard', () => {
      // The decorator declares intent; the custom guard stays authoritative about what it means.
      const source = generateResolverContent({ ...baseModel, auth: allLevels('billingAdmin') }, 'scope')

      expect(decoratorsFor(source, 'users')).toEqual([
        '@Query(() => [User], { nullable: true })',
        '@Authenticated()',
        '@UseGuards(GqlAuthBillingAdminGuard)',
      ])
    })

    it('defaults an unannotated model to @AdminOnly()', () => {
      const source = generateResolverContent(baseModel, 'scope')

      for (const method of ['users', 'usersCount', 'user', 'createUser', 'updateUser', 'deleteUser']) {
        expect(decoratorsFor(source, method)).toContain('@AdminOnly()')
      }
    })

    it('declares a level on every operation', () => {
      const source = generateResolverContent(
        {
          ...baseModel,
          auth: {
            readMany: 'public',
            count: 'user',
            readOne: 'admin',
            create: 'billingAdmin',
            update: 'admin',
            delete: 'admin',
          },
        },
        'scope',
      )

      for (const method of ['users', 'usersCount', 'user', 'createUser', 'updateUser', 'deleteUser']) {
        const levels = decoratorsFor(source, method).filter((d) =>
          ['@Public()', '@Authenticated()', '@AdminOnly()'].includes(d),
        )
        expect(levels, `${method} must declare exactly one access level`).toHaveLength(1)
      }
    })

    describe('imports', () => {
      it('imports exactly the symbols used and no more', () => {
        const source = generateResolverContent(
          {
            ...baseModel,
            auth: {
              readMany: 'public',
              count: 'user',
              readOne: 'admin',
              create: 'admin',
              update: 'admin',
              delete: 'admin',
            },
          },
          'scope',
        )

        expect(utilsImport(source)).toEqual([
          'AdminOnly',
          'Authenticated',
          'GqlAuthAdminGuard',
          'GqlAuthGuard',
          'Public',
        ])
      })

      it('does not import Public for an all-admin model', () => {
        const source = generateResolverContent({ ...baseModel, auth: allLevels('admin') }, 'scope')

        expect(utilsImport(source)).toEqual(['AdminOnly', 'GqlAuthAdminGuard'])
      })

      it('does not import AdminOnly or a guard for an all-public model', () => {
        const source = generateResolverContent({ ...baseModel, auth: allLevels('public') }, 'scope')

        expect(utilsImport(source)).toEqual(['Public'])
        // No guard is attached, so importing UseGuards would leave an unused import.
        expect(source).not.toContain("from '@nestjs/common'")
      })

      it('imports UseGuards whenever any operation attaches a guard', () => {
        const source = generateResolverContent(
          { ...baseModel, auth: { ...allLevels('public'), delete: 'admin' } },
          'scope',
        )

        expect(source).toContain("import { UseGuards } from '@nestjs/common'")
        expect(utilsImport(source)).toEqual(['AdminOnly', 'GqlAuthAdminGuard', 'Public'])
      })
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

  describe('getCrudAuthForModel', () => {
    it('defaults every operation to admin when the model carries no documentation', () => {
      expect(getCrudAuthForModel({})).toEqual({
        readOne: 'admin',
        readMany: 'admin',
        count: 'admin',
        create: 'admin',
        update: 'admin',
        delete: 'admin',
      })
    })

    it('merges a partial annotation over the admin defaults', () => {
      expect(getCrudAuthForModel({ documentation: '@crudAuth: { "readMany": "user" }' })).toEqual({
        readOne: 'admin',
        readMany: 'user',
        count: 'admin',
        create: 'admin',
        update: 'admin',
        delete: 'admin',
      })
    })

    it('falls back to admin defaults when the annotation is not valid JSON', () => {
      expect(getCrudAuthForModel({ documentation: '@crudAuth: { not json }' })).toEqual({
        readOne: 'admin',
        readMany: 'admin',
        count: 'admin',
        create: 'admin',
        update: 'admin',
        delete: 'admin',
      })
    })

    it('reads the annotation when other doc lines surround it', () => {
      const documentation = 'Some note about the model\n@crudAuth: { "create": "user" }\nAnother note'
      expect(getCrudAuthForModel({ documentation }).create).toBe('user')
    })
  })

  describe('getGuardForAuthLevel', () => {
    it('maps the built-in levels', () => {
      expect(getGuardForAuthLevel('admin')).toBe('GqlAuthAdminGuard')
      expect(getGuardForAuthLevel('user')).toBe('GqlAuthGuard')
      expect(getGuardForAuthLevel('')).toBe('GqlAuthAdminGuard')
      expect(getGuardForAuthLevel('public')).toBeNull()
    })

    it('accepts the built-in levels case-insensitively', () => {
      expect(getGuardForAuthLevel('Admin')).toBe('GqlAuthAdminGuard')
      expect(getGuardForAuthLevel('USER')).toBe('GqlAuthGuard')
      expect(getGuardForAuthLevel('Public')).toBeNull()
    })

    it('preserves interior casing for custom levels', () => {
      // Regression: the level used to be lowercased in full, yielding
      // GqlAuthBillingadminGuard, which matches no real class.
      expect(getGuardForAuthLevel('billingAdmin')).toBe('GqlAuthBillingAdminGuard')
      expect(getGuardForAuthLevel('organizationOwner')).toBe('GqlAuthOrganizationOwnerGuard')
    })

    it('still capitalises the first character of a custom level', () => {
      expect(getGuardForAuthLevel('staff')).toBe('GqlAuthStaffGuard')
      expect(getGuardForAuthLevel('noaccess')).toBe('GqlAuthNoaccessGuard')
    })
  })
})

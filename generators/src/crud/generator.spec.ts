// generators/api/src/generate-crud/generator.spec.ts

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import {
  GenerateCrudGeneratorDependencies,
  generateCrudLogic,
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

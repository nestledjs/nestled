import { describe, expect, it } from 'vitest'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { generateFiles, joinPathFragments, Tree } from '@nx/devkit'
import { DEFAULT_FILTER_DEPTH, generateFilterInputs } from './filter-inputs'
import { ModelField, ModelType } from '../lib/engine'

function field(name: string, type: string, extra: Partial<ModelField> = {}): ModelField {
  return { name, type, kind: 'scalar', ...extra }
}

function relation(name: string, type: string, extra: Partial<ModelField> = {}): ModelField {
  return { name, type, kind: 'object', relationName: `${type}Relation`, ...extra }
}

function model(modelName: string, fields: ModelField[]): ModelType {
  const propertyName = modelName.charAt(0).toLowerCase() + modelName.slice(1)
  return {
    name: modelName,
    pluralName: `${modelName}s`,
    fields,
    primaryField: 'name',
    modelName,
    modelPropertyName: propertyName,
    pluralModelName: `${modelName}s`,
    pluralModelPropertyName: `${propertyName}s`,
    idFieldType: 'String',
  }
}

/** User <-> Post (list) and User -> Profile (to-one), covering every scalar family. */
function buildModels(): ModelType[] {
  return [
    model('User', [
      field('id', 'String', { isId: true }),
      field('email', 'String'),
      field('age', 'Int'),
      field('score', 'Float'),
      field('balance', 'Decimal'),
      field('big', 'BigInt'),
      field('isActive', 'Boolean'),
      field('createdAt', 'DateTime'),
      field('role', 'Role', { kind: 'enum' }),
      field('meta', 'Json'),
      field('tags', 'String', { isList: true }),
      relation('posts', 'Post', { isList: true }),
      relation('profile', 'Profile'),
    ]),
    model('Post', [field('id', 'String', { isId: true }), field('title', 'String'), relation('author', 'User')]),
    model('Profile', [field('id', 'String', { isId: true }), field('bio', 'String')]),
  ]
}

describe('generateFilterInputs', () => {
  describe('scalar operators', () => {
    it('gives string fields only string-appropriate operators', () => {
      const { source } = generateFilterInputs([model('User', [field('email', 'String')])])

      expect(source).toContain('export class StringFilterInput')
      for (const op of ['equals', 'in', 'contains', 'startsWith', 'endsWith']) {
        expect(source).toContain(`${op}?:`)
      }
      // Ordering comparisons are meaningless for strings and would widen the oracle surface.
      expect(source).not.toContain('gte?:')
      expect(source).not.toContain('lt?:')
    })

    it('gives numeric and date fields ordering operators but not string matching', () => {
      const { source } = generateFilterInputs([
        model('Event', [field('count', 'Int'), field('startsAt', 'DateTime')]),
      ])

      expect(source).toContain('export class IntFilterInput')
      expect(source).toContain('export class DateTimeFilterInput')
      for (const op of ['lt', 'lte', 'gt', 'gte']) {
        expect(source).toContain(`${op}?: number`)
      }
      expect(source).not.toContain('contains?:')
      expect(source).not.toContain('startsWith?:')
    })

    it('gives boolean and enum fields equality only', () => {
      const { source } = generateFilterInputs([
        model('User', [field('isActive', 'Boolean'), field('role', 'Role', { kind: 'enum' })]),
      ])

      expect(source).toContain('export class BooleanFilterInput')
      expect(source).toContain('export class RoleFilterInput')
      expect(source).toContain('@Field(() => Role, { nullable: true })\n  equals?: Role')
      expect(source).toContain('@Field(() => [Role], { nullable: true })\n  in?: Role[]')
      expect(source).not.toContain('gt?:')
      expect(source).not.toContain('contains?:')
    })

    it('maps each Prisma scalar family to the right GraphQL type', () => {
      const { source } = generateFilterInputs([buildModels()[0]])

      expect(source).toContain('@Field(() => Int, { nullable: true })')
      expect(source).toContain('@Field(() => Float, { nullable: true })')
      expect(source).toContain('@Field(() => GraphQLBigInt, { nullable: true })')
      expect(source).toContain('@Field(() => GraphQLISODateTime, { nullable: true })')
      // Decimal shares Float's filter rather than getting one of its own.
      expect(source).toContain('balance?: FloatFilterInput')
      expect(source).not.toContain('DecimalFilterInput')
    })

    it('omits Json fields, which would reintroduce arbitrary structure', () => {
      const { source } = generateFilterInputs([buildModels()[0]])

      expect(source).not.toContain('meta?:')
      expect(source).not.toContain('JsonFilterInput')
    })

    it('omits scalar list fields, which use a different Prisma grammar', () => {
      const { source } = generateFilterInputs([buildModels()[0]])

      expect(source).not.toContain('tags?:')
    })

    it('never emits AND/OR/NOT, which would allow unbounded nesting', () => {
      const { source } = generateFilterInputs(buildModels())

      expect(source).not.toContain('AND')
      expect(source).not.toContain('OR?:')
      expect(source).not.toContain('NOT')
    })
  })

  describe('@graphqlOmit', () => {
    it('cannot filter on a field the caller never received', () => {
      // The CRUD generator strips @graphqlOmit fields before this module runs, so an omitted
      // column is absent from `fields` — unfilterable by construction, not by a second list.
      const withoutOmitted = model('User', [field('email', 'String')])
      const { source } = generateFilterInputs([withoutOmitted])

      expect(source).toContain('email?: StringFilterInput')
      expect(source).not.toContain('passwordResetToken')
    })
  })

  describe('relation filters', () => {
    it('wraps list relations in some/every/none over the related filter input', () => {
      const { source } = generateFilterInputs(buildModels())

      expect(source).toContain('export class PostListRelationFilterInput')
      expect(source).toContain('posts?: PostListRelationFilterInput')
      for (const op of ['some', 'every', 'none']) {
        expect(source).toContain(`${op}?: PostFilterInput2`)
      }
    })

    it('references the related filter input directly for to-one relations', () => {
      const { source } = generateFilterInputs(buildModels())

      expect(source).toContain('profile?: ProfileFilterInput2')
      expect(source).not.toContain('ProfileListRelationFilterInput')
    })

    it('ignores relations pointing at models that were filtered out', () => {
      // @skipCrud models are gone from the model list before this runs; a dangling relation
      // must not emit a reference to a type that will never exist.
      const models = [model('User', [field('email', 'String'), relation('secrets', 'Secret', { isList: true })])]
      const { source } = generateFilterInputs(models)

      expect(source).not.toContain('Secret')
    })
  })

  describe('depth cap', () => {
    it('terminates recursion with a scalars-only type at the deepest level', () => {
      const { source } = generateFilterInputs(buildModels(), 3)

      // User -> Post -> User, and the level-3 type carries no relation fields.
      expect(source).toContain('export class UserFilterInput3')
      const level3 = source.slice(source.indexOf('export class UserFilterInput3'))
      expect(level3).toContain('email?: StringFilterInput')
      expect(level3).not.toContain('posts?:')
      expect(level3).not.toContain('FilterInput4')
    })

    it('emits nothing deeper than the configured depth', () => {
      const { source } = generateFilterInputs(buildModels(), 2)

      expect(source).toContain('export class UserFilterInput2')
      expect(source).not.toContain('FilterInput3')
    })

    it('drops relation filtering entirely at depth 1', () => {
      const { source } = generateFilterInputs(buildModels(), 1)

      expect(source).toContain('export class UserFilterInput')
      expect(source).not.toContain('FilterInput2')
      expect(source).not.toContain('ListRelationFilterInput')
      expect(source).toContain('email?: StringFilterInput')
    })

    it('falls back to the default depth for nonsensical values', () => {
      const expected = generateFilterInputs(buildModels(), DEFAULT_FILTER_DEPTH).source

      expect(generateFilterInputs(buildModels(), 0).source).toBe(expected)
      expect(generateFilterInputs(buildModels(), -5).source).toBe(expected)
      expect(generateFilterInputs(buildModels(), Number.NaN).source).toBe(expected)
      expect(generateFilterInputs(buildModels(), undefined).source).toBe(expected)
    })
  })

  describe('empty inputs', () => {
    it('emits no type for a model with nothing filterable', () => {
      // An @InputType with zero fields is invalid in GraphQL.
      const { source, modelsWithFilterInput } = generateFilterInputs([
        model('Blob', [field('payload', 'Json'), field('tags', 'String', { isList: true })]),
      ])

      expect(source).toBe('')
      expect(modelsWithFilterInput).toEqual([])
    })

    it('does not reference a related model that has no filter input at the next level', () => {
      // Ledger's only content is a relation, so at the deepest level it has no type at all,
      // and the level above must not point at one.
      const models = [
        model('Ledger', [relation('entries', 'Entry', { isList: true })]),
        model('Entry', [field('amount', 'Int')]),
      ]
      const { source, modelsWithFilterInput } = generateFilterInputs(models, 2)

      expect(modelsWithFilterInput).toEqual(['Ledger', 'Entry'])
      expect(source).not.toContain('LedgerFilterInput2')
      expect(source).toContain('EntryFilterInput2')
    })
  })

  describe('reporting which models got a filter input', () => {
    it('lists exactly the models with a depth-1 type', () => {
      const models = [...buildModels(), model('Blob', [field('payload', 'Json')])]
      const { modelsWithFilterInput } = generateFilterInputs(models)

      expect(modelsWithFilterInput).toEqual(['User', 'Post', 'Profile'])
    })
  })
})

describe('dto template rendering', () => {
  function renderDto(models: ModelType[], depth?: number): string {
    const tree: Tree = createTreeWithEmptyWorkspace()
    const { source: filterInputs, modelsWithFilterInput } = generateFilterInputs(models, depth as number)

    generateFiles(tree, joinPathFragments(__dirname, 'files/data-access'), 'out', {
      name: 'generated-crud',
      models,
      filterInputs,
      modelsWithFilterInput,
      npmScope: 'testscope',
      tmpl: '',
    })

    return tree.read('out/src/lib/dto/index.ts', 'utf-8') as string
  }

  it('replaces the inherited opaque blob with a typed filters field', () => {
    const dto = renderDto(buildModels())

    expect(dto).toContain('export class ListUserInput extends CorePagingInput {')
    expect(dto).toContain('@Field(() => UserFilterInput, { nullable: true })\n  filters?: UserFilterInput')
    // The blob type must not reappear anywhere in the generated DTOs.
    expect(dto).not.toContain('GraphQLJSONObject')
  })

  it('emits the filter input classes into the dto file', () => {
    const dto = renderDto(buildModels())

    expect(dto).toContain('export class StringFilterInput')
    expect(dto).toContain('export class UserFilterInput')
    expect(dto).toContain('export class PostListRelationFilterInput')
  })

  it('imports every scalar type the filter inputs reference', () => {
    const dto = renderDto(buildModels())

    const importLine = dto.split('\n').find((l) => l.startsWith('import {') && l.includes('@nestjs/graphql')) ?? ''
    expect(importLine).toContain('Int')
    expect(importLine).toContain('Float')
    expect(importLine).toContain('GraphQLISODateTime')
    expect(dto).toContain("import { GraphQLBigInt } from 'graphql-scalars'")
    expect(dto).toContain("import { Role } from '@testscope/api/core/models'")
  })

  it('omits the filters field for a model with nothing filterable', () => {
    const dto = renderDto([model('Blob', [field('id', 'String', { isId: true }), field('payload', 'Json')])])

    // id is filterable here, so Blob does get an input; assert the negative case separately.
    expect(dto).toContain('filters?: BlobFilterInput')

    const unfilterable = renderDto([model('Blob', [field('payload', 'Json')])])
    expect(unfilterable).not.toContain('filters?:')
    expect(unfilterable).toContain('export class ListBlobInput extends CorePagingInput {')
  })

  it('still renders for callers that do not pass the filter variables', () => {
    const tree: Tree = createTreeWithEmptyWorkspace()

    expect(() =>
      generateFiles(tree, joinPathFragments(__dirname, 'files/data-access'), 'out', {
        name: 'generated-crud',
        models: buildModels(),
        npmScope: 'testscope',
        tmpl: '',
      }),
    ).not.toThrow()

    const dto = tree.read('out/src/lib/dto/index.ts', 'utf-8') as string
    expect(dto).toContain('export class ListUserInput extends CorePagingInput {')
    expect(dto).not.toContain('filters?:')
  })
})

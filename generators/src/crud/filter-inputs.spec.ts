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

/** Body of one generated class, so assertions cannot bleed into neighbouring classes. */
function classBody(source: string, className: string): string {
  const start = source.indexOf(`export class ${className} {`)
  if (start === -1) return ''
  return source.slice(start, source.indexOf('\n}', start))
}

describe('generateFilterInputs', () => {
  describe('scalar operators', () => {
    it('gives string fields only string-appropriate operators', () => {
      const { source } = generateFilterInputs([model('User', [field('email', 'String')])])

      expect(source).toContain('export class StringFilterInput')
      for (const op of ['equals', 'in', 'not', 'contains', 'startsWith', 'endsWith']) {
        expect(source).toContain(`${op}?:`)
      }
      // Ordering comparisons are meaningless for strings and would widen the oracle surface.
      expect(source).not.toContain('gte?:')
      expect(source).not.toContain('lt?:')
    })

    it('gives numeric and date fields ordering operators but not string matching', () => {
      const { source } = generateFilterInputs([model('Event', [field('count', 'Int'), field('startsAt', 'DateTime')])])

      expect(source).toContain('export class IntFilterInput')
      expect(source).toContain('export class DateTimeFilterInput')
      for (const op of ['lt', 'lte', 'gt', 'gte']) {
        expect(source).toContain(`${op}?: number`)
      }
      expect(source).not.toContain('contains?:')
      expect(source).not.toContain('startsWith?:')
    })

    it('gives boolean and enum fields equality and negation operators only', () => {
      const { source } = generateFilterInputs([
        model('User', [field('isActive', 'Boolean'), field('role', 'Role', { kind: 'enum' })]),
      ])

      expect(source).toContain('export class BooleanFilterInput')
      expect(source).toContain('export class RoleFilterInput')
      expect(source).toContain('@Field(() => Role, { nullable: true })\n  equals?: Role')
      expect(source).toContain('@Field(() => [Role], { nullable: true })\n  in?: Role[]')
      expect(source).toContain('@Field(() => Boolean, { nullable: true })\n  not?: boolean')
      expect(source).toContain('@Field(() => Role, { nullable: true })\n  not?: Role')
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

    it('emits AND/OR/NOT against the next depth instead of self-referencing', () => {
      const { source } = generateFilterInputs(buildModels())
      const level1 = classBody(source, 'UserFilterInput')
      const level2 = classBody(source, 'UserFilterInput2')
      const level3 = classBody(source, 'UserFilterInput3')

      for (const op of ['AND', 'OR', 'NOT']) {
        expect(level1).toContain(`${op}?: UserFilterInput2[]`)
        expect(level2).toContain(`${op}?: UserFilterInput3[]`)
        expect(level3).not.toContain(`${op}?:`)
      }
      expect(level1).not.toContain('AND?: UserFilterInput[]')
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

    it('supports is/isNot and the existing direct shorthand for to-one relations', () => {
      const { source } = generateFilterInputs(buildModels())
      const wrapper = classBody(source, 'ProfileRelationFilterInput')

      expect(source).toContain('profile?: ProfileRelationFilterInput')
      expect(wrapper).toContain('is?: ProfileFilterInput2 | null')
      expect(wrapper).toContain('isNot?: ProfileFilterInput2 | null')
      expect(wrapper).toContain('bio?: StringFilterInput')
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
      const level3 = classBody(source, 'UserFilterInput3')
      expect(level3).toContain('email?: StringFilterInput')
      expect(level3).not.toContain('posts?:')
      expect(level3).not.toContain('profile?:')
      expect(level3).not.toContain('AND?:')
      expect(level3).not.toContain('OR?:')
      expect(level3).not.toContain('NOT?:')
      expect(source).not.toContain('FilterInput4')
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
      expect(source).not.toContain('AND?:')
      expect(source).not.toContain('OR?:')
      expect(source).not.toContain('NOT?:')
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

  describe('declaration order', () => {
    // emitDecoratorMetadata evaluates `__metadata("design:type", X)` eagerly when the containing
    // class is defined, and class declarations are not hoisted. A class that references one
    // declared later in the file throws "Cannot access X before initialization" on import. The
    // file typechecks either way, so only a runtime import catches it.
    it('declares every referenced filter input before the class that references it', () => {
      const { source } = generateFilterInputs(buildModels())

      const declarationOrder = new Map<string, number>()
      const classRe = /export class (\w+) \{/g
      let match: RegExpExecArray | null
      while ((match = classRe.exec(source)) !== null) {
        declarationOrder.set(match[1], match.index)
      }
      expect(declarationOrder.size).toBeGreaterThan(5)

      for (const [className, position] of declarationOrder) {
        const body = classBody(source, className)
        const referenceRe = /@Field\(\(\) => \[?(\w+)\]?,/g
        let ref: RegExpExecArray | null
        while ((ref = referenceRe.exec(body)) !== null) {
          const referenced = ref[1]
          if (!declarationOrder.has(referenced)) continue // built-in scalar or enum
          expect(
            declarationOrder.get(referenced),
            `${className} references ${referenced}, which is declared later`,
          ).toBeLessThan(position)
        }
      }
    })

    it('emits the deepest level first', () => {
      const { source } = generateFilterInputs(buildModels(), 3)

      expect(source.indexOf('export class UserFilterInput3')).toBeLessThan(
        source.indexOf('export class UserFilterInput2'),
      )
      expect(source.indexOf('export class UserFilterInput2')).toBeLessThan(
        source.indexOf('export class UserFilterInput {'),
      )
    })
  })

  describe('empty inputs', () => {
    it('falls back to the shared unfilterable input for a model with nothing filterable', () => {
      // An @InputType with zero fields is invalid in GraphQL, but the model still needs an
      // explicit override or its list input keeps inheriting the untyped blob.
      const { source, filterInputNames } = generateFilterInputs([
        model('Blob', [field('payload', 'Json'), field('tags', 'String', { isList: true })]),
      ])

      expect(filterInputNames).toEqual({ Blob: 'UnfilterableInput' })
      expect(source).toContain('export class UnfilterableInput')
      expect(source).not.toContain('export class BlobFilterInput')
      // The placeholder must not let a caller express any column filter.
      expect(source).not.toContain('payload?:')
      expect(source).not.toContain('tags?:')
    })

    it('emits the unfilterable input only when some model needs it', () => {
      const { source } = generateFilterInputs(buildModels())

      expect(source).not.toContain('UnfilterableInput')
    })

    it('does not reference a related model that has no filter input at the next level', () => {
      // Ledger's only content is a relation, so at the deepest level it has no type at all,
      // and the level above must not point at one.
      const models = [
        model('Ledger', [relation('entries', 'Entry', { isList: true })]),
        model('Entry', [field('amount', 'Int')]),
      ]
      const { source, filterInputNames } = generateFilterInputs(models, 2)

      expect(filterInputNames).toEqual({ Ledger: 'LedgerFilterInput', Entry: 'EntryFilterInput' })
      expect(source).not.toContain('LedgerFilterInput2')
      expect(source).toContain('EntryFilterInput2')
    })
  })

  describe('reporting the filter input per model', () => {
    it('names a real type for filterable models and the fallback for the rest', () => {
      const models = [...buildModels(), model('Blob', [field('payload', 'Json')])]
      const { filterInputNames } = generateFilterInputs(models)

      expect(filterInputNames).toEqual({
        User: 'UserFilterInput',
        Post: 'PostFilterInput',
        Profile: 'ProfileFilterInput',
        Blob: 'UnfilterableInput',
      })
    })

    it('covers every model, so none can inherit the untyped blob', () => {
      const models = [...buildModels(), model('Blob', [field('payload', 'Json')])]
      const { filterInputNames } = generateFilterInputs(models)

      expect(Object.keys(filterInputNames).sort()).toEqual(models.map((m) => m.modelName).sort())
    })
  })
})

describe('dto template rendering', () => {
  function renderDto(models: ModelType[], depth?: number): string {
    const tree: Tree = createTreeWithEmptyWorkspace()
    const { source: filterInputs, filterInputNames } = generateFilterInputs(models, depth as number)

    generateFiles(tree, joinPathFragments(__dirname, 'files/data-access'), 'out', {
      name: 'generated-crud',
      models,
      filterInputs,
      filterInputNames,
      npmScope: 'testscope',
      tmpl: '',
    })

    return tree.read('out/src/lib/dto/index.ts', 'utf-8') as string
  }

  it('replaces the inherited opaque blob with a typed filters field', () => {
    const dto = renderDto(buildModels())

    expect(dto).toContain('export class ListUserInput extends CorePagingInput {')
    expect(dto).toContain('@Field(() => UserFilterInput, { nullable: true })\n  filters?: UserFilterInput = undefined')
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

  it('always overrides filters, even for a model with nothing filterable', () => {
    const dto = renderDto([model('Blob', [field('id', 'String', { isId: true }), field('payload', 'Json')])])
    expect(dto).toContain('filters?: BlobFilterInput')

    // Without an explicit override this model would keep inheriting CorePagingInput's blob.
    const unfilterable = renderDto([model('Blob', [field('payload', 'Json')])])
    expect(unfilterable).toContain(
      '@Field(() => UnfilterableInput, { nullable: true })\n  filters?: UnfilterableInput = undefined',
    )
    expect(unfilterable).toContain('export class UnfilterableInput')
  })

  it('initializes the legacy filters override for ES2022 class-field semantics', () => {
    const dto = renderDto(buildModels())

    expect(dto).toContain('filters?: UserFilterInput = undefined')
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

describe('admin data-access template rendering', () => {
  function renderDataAccess(): { service: string; index: string } {
    const tree: Tree = createTreeWithEmptyWorkspace()
    const models = buildModels()
    const { source: filterInputs, filterInputNames } = generateFilterInputs(models)

    generateFiles(tree, joinPathFragments(__dirname, 'files/data-access'), 'out', {
      name: 'generated-crud',
      models,
      filterInputs,
      filterInputNames,
      npmScope: 'testscope',
      tmpl: '',
    })

    return {
      service: tree.read('out/src/lib/api-crud-data-access.service.ts', 'utf-8') as string,
      index: tree.read('out/src/index.ts', 'utf-8') as string,
    }
  }

  it('keeps the recursive selector private to generated admin data access', () => {
    const { service, index } = renderDataAccess()

    expect(service).toContain("import graphqlFields from 'graphql-fields'")
    expect(service).toContain("from './database-models'")
    expect(service).toContain('return DATABASE_MODELS_BY_NAME[typeName]')
    expect(service).toContain('const relatedModel = DATABASE_MODELS_BY_NAME[field.type]')
    expect(service).not.toContain('DATABASE_MODELS.find')
    expect(service).toContain('function buildAdminSelect(info: GraphQLResolveInfo)')
    expect(service).not.toContain('export function buildAdminSelect')
    expect(service).not.toContain('/api/core/helpers')
    expect(index).not.toContain('buildAdminSelect')
  })

  it('normalizes compatible to-one filter shapes before passing them to Prisma', () => {
    const { service } = renderDataAccess()

    expect(service).toContain('"profile": {\n      "targetModel": "Profile",\n      "isList": false')
    expect(service).toContain("normalizeListInputFilters('User', input)")
    expect(service).toContain('normalized.is = hasIs')
    expect(service).toContain("throw new BadRequestException('A to-one relation filter cannot combine is: null")
  })
})

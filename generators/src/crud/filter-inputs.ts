import { ModelField, ModelType } from '../lib/engine'

/**
 * Typed filter inputs for generated list queries.
 *
 * Generated list queries used to inherit an opaque `filters` blob (`GraphQLJSONObject`) from the
 * template's `CorePagingInput`, which reached Prisma's `where` clause verbatim. Because the blob
 * was untyped, GraphQL could not validate it, so a caller controlled the full Prisma filter
 * grammar — and Prisma's `where` is built from the *database* model, not the GraphQL model. Every
 * column was therefore filterable whether or not it was queryable, including credential columns
 * removed from the GraphQL layer with `@graphqlOmit`. Presence/absence of results is an oracle,
 * so those columns could be read back one character at a time.
 *
 * These generated inputs close that off: a caller can only filter on columns we emit, using
 * operators the column's type supports. `@graphqlOmit` fields never reach this module — the CRUD
 * generator strips them from `model.fields` before we see them — so an omitted column is
 * unfilterable by construction rather than by a second exclusion list that could drift.
 *
 * Operator and field names deliberately mirror Prisma's own filter grammar, so the emitted object
 * remains a valid Prisma `where` subset and consuming template code can keep merging it directly.
 *
 * Two deliberate omissions:
 * - `AND`/`OR`/`NOT` are not emitted. They are self-referencing, so they would reintroduce
 *   unbounded nesting depth that the depth cap below exists to prevent.
 * - Scalar list fields (`String[]`) are not filterable. Prisma models those with
 *   `has`/`hasEvery`/`hasSome` rather than the operators here, and nothing downstream filters on
 *   them today.
 */

/** Relation nesting levels to emit. Level `maxDepth` carries scalars only, which terminates recursion. */
export const DEFAULT_FILTER_DEPTH = 3

const COMPARABLE_OPERATORS = ['lt', 'lte', 'gt', 'gte'] as const
const STRING_OPERATORS = ['contains', 'startsWith', 'endsWith'] as const

interface ScalarFilterDef {
  className: string
  /** Type referenced inside `@Field(() => X)`. */
  gqlType: string
  tsType: string
  /** Operators beyond the universal `equals` / `in`. */
  extraOperators: readonly string[]
}

const STRING_FILTER: ScalarFilterDef = {
  className: 'StringFilterInput',
  gqlType: 'String',
  tsType: 'string',
  extraOperators: STRING_OPERATORS,
}

const FLOAT_FILTER: ScalarFilterDef = {
  className: 'FloatFilterInput',
  gqlType: 'Float',
  tsType: 'number',
  extraOperators: COMPARABLE_OPERATORS,
}

/**
 * Prisma scalar type -> filter input. Types absent here (Json, Bytes, Unsupported) are not
 * filterable: they have no meaningful typed operator set, and Json in particular would hand back
 * the arbitrary-structure hole this whole module exists to close.
 */
const SCALAR_FILTERS: Record<string, ScalarFilterDef> = {
  String: STRING_FILTER,
  ID: STRING_FILTER,
  Int: {
    className: 'IntFilterInput',
    gqlType: 'Int',
    tsType: 'number',
    extraOperators: COMPARABLE_OPERATORS,
  },
  BigInt: {
    className: 'BigIntFilterInput',
    gqlType: 'GraphQLBigInt',
    tsType: 'bigint',
    extraOperators: COMPARABLE_OPERATORS,
  },
  Float: FLOAT_FILTER,
  Decimal: FLOAT_FILTER,
  Boolean: {
    className: 'BooleanFilterInput',
    gqlType: 'Boolean',
    tsType: 'boolean',
    extraOperators: [],
  },
  DateTime: {
    className: 'DateTimeFilterInput',
    gqlType: 'GraphQLISODateTime',
    tsType: 'Date',
    extraOperators: COMPARABLE_OPERATORS,
  },
}

export interface FilterInputsResult {
  /** Source for the generated filter input classes; empty when nothing is filterable. */
  source: string
  /** Models that have a depth-1 filter input, i.e. whose list input gets a typed `filters` field. */
  modelsWithFilterInput: string[]
}

function isRelationField(field: ModelField): boolean {
  return field.kind === 'object' || Boolean(field.relationName)
}

function isEnumField(field: ModelField): boolean {
  return field.kind === 'enum'
}

function scalarFilterFor(field: ModelField): ScalarFilterDef | null {
  if (isEnumField(field)) {
    return {
      className: `${field.type}FilterInput`,
      gqlType: field.type,
      tsType: field.type,
      extraOperators: [],
    }
  }
  return SCALAR_FILTERS[field.type] ?? null
}

/** Depth 1 is unsuffixed so the public-facing type name stays `<Model>FilterInput`. */
function depthSuffix(depth: number): string {
  return depth === 1 ? '' : String(depth)
}

function modelFilterInputName(modelName: string, depth: number): string {
  return `${modelName}FilterInput${depthSuffix(depth)}`
}

function listRelationFilterInputName(modelName: string, depth: number): string {
  return `${modelName}ListRelationFilterInput${depthSuffix(depth)}`
}

function renderField(gqlType: string, name: string, tsType: string): string {
  return `  @Field(() => ${gqlType}, { nullable: true })\n  ${name}?: ${tsType}\n`
}

function renderScalarFilterClass(def: ScalarFilterDef): string {
  const fields = [
    renderField(def.gqlType, 'equals', def.tsType),
    renderField(`[${def.gqlType}]`, 'in', `${def.tsType}[]`),
    ...def.extraOperators.map((op) => renderField(def.gqlType, op, def.tsType)),
  ]
  return `@InputType()\nexport class ${def.className} {\n${fields.join('\n')}}\n`
}

function renderListRelationFilterClass(className: string, targetType: string): string {
  const fields = ['some', 'every', 'none'].map((op) => renderField(targetType, op, targetType))
  return `@InputType()\nexport class ${className} {\n${fields.join('\n')}}\n`
}

/**
 * Depth-1 filter inputs are assigned to `List<Model>Input.filters`, which overrides the
 * `filters?: Record<string, unknown>` still declared on the template's `CorePagingInput`. TypeScript
 * rejects that override — a class type has no implicit index signature — so the generated code
 * would not compile until the template drops its blob. This index signature makes the generated
 * output compile both before and after that template change, decoupling the two rollouts. It is a
 * type-level shim only: GraphQL validation is driven by the `@Field` decorators, so it does not
 * widen what a caller can actually send. Once every consuming template has dropped `filters` from
 * `CorePagingInput`, this line can go.
 */
const INDEX_SIGNATURE_SHIM = '  [key: string]: unknown\n'

function renderModelFilterClass(className: string, fields: string[], includeShim: boolean): string {
  const body = (includeShim ? INDEX_SIGNATURE_SHIM + '\n' : '') + fields.join('\n')
  return `@InputType()\nexport class ${className} {\n${body}}\n`
}

/**
 * Builds the filter input classes for the given models.
 *
 * Relation nesting is capped by generating a distinct type per level rather than a single
 * self-referencing type: `UserFilterInput` points at `PostFilterInput2`, which points at
 * `UserFilterInput3`, which carries scalars only. A recursive input type would let a caller nest
 * relation filters arbitrarily deep at query time, which typing alone would not prevent.
 *
 * @param models Models to emit filters for, already stripped of `@skipCrud` and `@graphqlOmit`.
 * @param maxDepth Relation nesting levels to emit; values below 1 fall back to the default.
 */
export function generateFilterInputs(
  models: readonly ModelType[],
  maxDepth: number = DEFAULT_FILTER_DEPTH,
): FilterInputsResult {
  const depth = Number.isFinite(maxDepth) && maxDepth >= 1 ? Math.floor(maxDepth) : DEFAULT_FILTER_DEPTH
  const modelNames = new Set(models.map((m) => m.modelName))

  const neededScalarFilters = new Map<string, ScalarFilterDef>()
  // fieldsByDepth[d] holds the rendered field lines for each model that has any at depth d.
  const fieldsByDepth = new Map<number, Map<string, string[]>>()
  // Wrapper types needed at depth d, keyed by the related model they point into.
  const wrappersByDepth = new Map<number, Set<string>>()

  // Walk deepest level first: whether a relation field can be emitted at depth d depends on
  // whether its target actually has a filter input at depth d + 1. A model whose only filterable
  // content is relations ends up with no type at the deepest level, and that absence has to
  // propagate back up rather than leaving a dangling reference.
  for (let d = depth; d >= 1; d--) {
    const fieldsForDepth = new Map<string, string[]>()
    const wrappersForDepth = new Set<string>()

    for (const model of models) {
      const lines: string[] = []

      for (const field of model.fields) {
        if (isRelationField(field)) {
          // The deepest level is scalars-only — that is what terminates the recursion.
          if (d === depth) continue
          if (!modelNames.has(field.type)) continue
          const targetHasFilter = fieldsByDepth.get(d + 1)?.has(field.type)
          if (!targetHasFilter) continue

          if (field.isList) {
            const wrapper = listRelationFilterInputName(field.type, d)
            lines.push(renderField(wrapper, field.name, wrapper))
            wrappersForDepth.add(field.type)
          } else {
            const target = modelFilterInputName(field.type, d + 1)
            lines.push(renderField(target, field.name, target))
          }
          continue
        }

        // Scalar lists use a different Prisma grammar (has/hasEvery/hasSome); not modelled.
        if (field.isList) continue

        const def = scalarFilterFor(field)
        if (!def) continue
        neededScalarFilters.set(def.className, def)
        lines.push(renderField(def.className, field.name, def.className))
      }

      // An @InputType with no fields is invalid in GraphQL, so a model with nothing filterable
      // simply has no filter input at this depth.
      if (lines.length > 0) fieldsForDepth.set(model.modelName, lines)
    }

    fieldsByDepth.set(d, fieldsForDepth)
    wrappersByDepth.set(d, wrappersForDepth)
  }

  const modelsWithFilterInput = models
    .map((m) => m.modelName)
    .filter((name) => fieldsByDepth.get(1)?.has(name))

  if (modelsWithFilterInput.length === 0) {
    return { source: '', modelsWithFilterInput: [] }
  }

  const blocks: string[] = []

  // Scalar and enum operator inputs, emitted once and shared across every level.
  for (const def of [...neededScalarFilters.values()].sort((a, b) => a.className.localeCompare(b.className))) {
    blocks.push(renderScalarFilterClass(def))
  }

  for (let d = 1; d <= depth; d++) {
    for (const target of [...(wrappersByDepth.get(d) ?? [])].sort((a, b) => a.localeCompare(b))) {
      blocks.push(
        renderListRelationFilterClass(listRelationFilterInputName(target, d), modelFilterInputName(target, d + 1)),
      )
    }
    for (const model of models) {
      const lines = fieldsByDepth.get(d)?.get(model.modelName)
      if (!lines) continue
      blocks.push(renderModelFilterClass(modelFilterInputName(model.modelName, d), lines, d === 1))
    }
  }

  return { source: blocks.join('\n'), modelsWithFilterInput }
}

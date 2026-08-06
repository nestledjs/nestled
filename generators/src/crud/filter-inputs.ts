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

/**
 * Filter input for a model with no filterable column of its own.
 *
 * Such a model still needs *something* to override the inherited blob with. An explicit `@Field`
 * override is the only mechanism that actually removes an inherited field from a code-first
 * schema — `@HideField()` is a no-op at runtime (it exists to steer the CLI plugin), and leaving
 * the field alone keeps `filters: JSONObject` on that model, which is the whole vulnerability.
 * GraphQL rejects an input type with zero fields, so this carries one inert placeholder.
 */
export const UNFILTERABLE_INPUT_NAME = 'UnfilterableInput'

export interface FilterInputsResult {
  /** Source for the generated filter input classes; empty only when there are no models. */
  source: string
  /**
   * Filter input class name per model, for the `filters` override on its list input. Every model
   * gets an entry — models with nothing filterable map to {@link UNFILTERABLE_INPUT_NAME} — so no
   * generated list input is left inheriting the untyped blob.
   */
  filterInputNames: Record<string, string>
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

function renderUnfilterableInputClass(): string {
  const field =
    `  @Field(() => Boolean, {\n` +
    `    nullable: true,\n` +
    `    description: 'This model exposes no filterable columns. Present only because GraphQL ' +\n` +
    `      'requires an input type to declare at least one field.',\n` +
    `  })\n` +
    `  unavailable?: boolean\n`
  return `@InputType()\nexport class ${UNFILTERABLE_INPUT_NAME} {\n${INDEX_SIGNATURE_SHIM}\n${field}}\n`
}

interface ScanContext {
  maxDepth: number
  modelNames: Set<string>
  /** Operator inputs actually referenced, keyed by class name so each is emitted once. */
  neededScalarFilters: Map<string, ScalarFilterDef>
  /** Rendered field lines per model, per depth. Populated deepest level first. */
  fieldsByDepth: Map<number, Map<string, string[]>>
  /** Related models needing a list-relation wrapper at each depth. */
  wrappersByDepth: Map<number, Set<string>>
}

/**
 * A relation field is only emitted when its target actually has a filter input one level down.
 * `wrappers` collects the related models that need a list-relation wrapper at this depth.
 */
function relationFieldLine(
  field: ModelField,
  depth: number,
  ctx: ScanContext,
  wrappers: Set<string>,
): string | null {
  // The deepest level is scalars-only — that is what terminates the recursion.
  if (depth === ctx.maxDepth) return null
  if (!ctx.modelNames.has(field.type)) return null
  if (!ctx.fieldsByDepth.get(depth + 1)?.has(field.type)) return null

  if (field.isList) {
    const wrapper = listRelationFilterInputName(field.type, depth)
    wrappers.add(field.type)
    return renderField(wrapper, field.name, wrapper)
  }

  const target = modelFilterInputName(field.type, depth + 1)
  return renderField(target, field.name, target)
}

function scalarFieldLine(field: ModelField, ctx: ScanContext): string | null {
  // Scalar lists use a different Prisma grammar (has/hasEvery/hasSome); not modelled.
  if (field.isList) return null

  const def = scalarFilterFor(field)
  if (!def) return null

  ctx.neededScalarFilters.set(def.className, def)
  return renderField(def.className, field.name, def.className)
}

function fieldLine(field: ModelField, depth: number, ctx: ScanContext, wrappers: Set<string>): string | null {
  return isRelationField(field)
    ? relationFieldLine(field, depth, ctx, wrappers)
    : scalarFieldLine(field, ctx)
}

/** Records, for one nesting level, which models have filterable content and what it renders to. */
function scanDepth(models: readonly ModelType[], depth: number, ctx: ScanContext): void {
  const fieldsForDepth = new Map<string, string[]>()
  const wrappers = new Set<string>()

  for (const model of models) {
    const lines = model.fields
      .map((field) => fieldLine(field, depth, ctx, wrappers))
      .filter((line): line is string => line !== null)

    // An @InputType with no fields is invalid in GraphQL, so a model with nothing filterable
    // simply has no filter input at this depth.
    if (lines.length > 0) fieldsForDepth.set(model.modelName, lines)
  }

  ctx.fieldsByDepth.set(depth, fieldsForDepth)
  ctx.wrappersByDepth.set(depth, wrappers)
}

function renderDepth(models: readonly ModelType[], depth: number, ctx: ScanContext): string[] {
  const wrappers = [...(ctx.wrappersByDepth.get(depth) ?? [])]
    .sort((a, b) => a.localeCompare(b))
    .map((target) =>
      renderListRelationFilterClass(
        listRelationFilterInputName(target, depth),
        modelFilterInputName(target, depth + 1),
      ),
    )

  const modelClasses = models
    .map((model) => ({ model, lines: ctx.fieldsByDepth.get(depth)?.get(model.modelName) }))
    .filter((entry): entry is { model: ModelType; lines: string[] } => Boolean(entry.lines))
    .map(({ model, lines }) => renderModelFilterClass(modelFilterInputName(model.modelName, depth), lines, depth === 1))

  return [...wrappers, ...modelClasses]
}

function normaliseDepth(maxDepth: number): number {
  return Number.isFinite(maxDepth) && maxDepth >= 1 ? Math.floor(maxDepth) : DEFAULT_FILTER_DEPTH
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
  const depth = normaliseDepth(maxDepth)
  const ctx: ScanContext = {
    maxDepth: depth,
    modelNames: new Set(models.map((m) => m.modelName)),
    neededScalarFilters: new Map(),
    fieldsByDepth: new Map(),
    wrappersByDepth: new Map(),
  }

  // Walk deepest level first: whether a relation field can be emitted at depth d depends on
  // whether its target actually has a filter input at depth d + 1. A model whose only filterable
  // content is relations ends up with no type at the deepest level, and that absence has to
  // propagate back up rather than leaving a dangling reference.
  for (let d = depth; d >= 1; d--) {
    scanDepth(models, d, ctx)
  }

  // Every model gets an entry. A model with nothing filterable still needs an explicit override,
  // or its list input silently keeps inheriting the untyped blob.
  const filterInputNames: Record<string, string> = {}
  let needsUnfilterableInput = false
  for (const model of models) {
    if (ctx.fieldsByDepth.get(1)?.has(model.modelName)) {
      filterInputNames[model.modelName] = modelFilterInputName(model.modelName, 1)
    } else {
      filterInputNames[model.modelName] = UNFILTERABLE_INPUT_NAME
      needsUnfilterableInput = true
    }
  }

  if (models.length === 0) {
    return { source: '', filterInputNames }
  }

  // Operator inputs are shared across every level, so they are emitted once up front.
  const operatorInputs = [...ctx.neededScalarFilters.values()]
    .sort((a, b) => a.className.localeCompare(b.className))
    .map(renderScalarFilterClass)

  // Deepest level first. `emitDecoratorMetadata` — which NestJS requires — emits
  // `__metadata("design:type", X)` for every decorated property, and that evaluates the class
  // reference eagerly when the containing class is defined. Class declarations are not hoisted, so
  // emitting depth 1 before depth 2 makes importing the generated file throw
  // `Cannot access 'XFilterInput2' before initialization`. The file typechecks either way, so this
  // only shows up at runtime. The depth cap makes the reference graph acyclic (a level only ever
  // points one level deeper), so descending order is a valid topological sort. Within a level,
  // renderDepth emits the list-relation wrappers before the model inputs that reference them.
  const levels = Array.from({ length: depth }, (_, i) => renderDepth(models, depth - i, ctx)).flat()
  const unfilterable = needsUnfilterableInput ? [renderUnfilterableInputClass()] : []

  return { source: [...operatorInputs, ...unfilterable, ...levels].join('\n'), filterInputNames }
}

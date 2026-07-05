import { formatFiles, joinPathFragments, readJson, Tree } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'
import {
  filterSkippedRelationFields,
  getPrismaSchemaPath,
  getSkippedModelNames,
  readPrismaSchema,
} from '../lib/engine'
import { GenerateModelsGeneratorSchema } from './schema'

const DEFAULT_OUTPUT_PATH = 'libs/api/core/models/src/lib/models'

// The Prisma client wrapper library re-exports the generated enums. We resolve the
// import path for it from the workspace's tsconfig.base.json path aliases so the
// generator is not tied to any one workspace scope.
const PRISMA_INDEX_TARGET = 'libs/api/prisma/src/index.ts'

const SCALAR_TS_TYPE: Record<string, string> = {
  Int: 'number',
  Float: 'number',
  Decimal: 'Decimal',
  String: 'string',
  ID: 'string',
  Boolean: 'boolean',
  DateTime: 'Date',
  Json: 'JsonValue',
  BigInt: 'bigint',
  Bytes: 'Buffer',
}

const SCALAR_GQL_TYPE: Record<string, string> = {
  Int: 'Int',
  Float: 'Float',
  Decimal: 'GraphQLDecimal',
  BigInt: 'GraphQLBigInt',
  Json: 'GraphQLJSON',
  DateTime: 'GraphQLISODateTime',
  Boolean: 'Boolean',
  String: 'String',
  ID: 'String',
}

function resolveGraphQLType(originalType: string, kind: string): string {
  if (kind === 'scalar') return SCALAR_GQL_TYPE[originalType] ?? originalType
  return originalType
}

function resolveTsType(originalType: string, kind: string): string {
  if (kind === 'scalar') return SCALAR_TS_TYPE[originalType] ?? originalType
  return originalType
}

function buildFieldDecorator(field: any): string {
  const isRelation = field.kind === 'object'
  const isFieldRequired = isRelation ? false : field.isRequired
  const gqlType = resolveGraphQLType(field.type, field.kind)
  const decoratorType = field.isList ? `() => [${gqlType}]` : `() => ${gqlType}`
  const options = isFieldRequired ? '' : ', { nullable: true }'
  return `@Field(${decoratorType}${options})`
}

function buildFieldDeclaration(field: any): string {
  const isRelation = field.kind === 'object'
  const isFieldRequired = isRelation ? false : field.isRequired
  let tsType = resolveTsType(field.type, field.kind)
  if (isRelation) tsType = `Partial<${tsType}>`
  const typeMarker = isFieldRequired ? '!' : '?'
  const nullUnion = isFieldRequired ? '' : ' | null'
  return `  ${field.name}${typeMarker}: ${tsType}${field.isList ? '[]' : ''}${nullUnion};`
}

function usesType(models: readonly any[], type: string): boolean {
  return models.some(m => m.fields.some((f: { type: string }) => f.type === type))
}

export function generateModels(models: readonly any[], enums: readonly any[], prismaImportPath: string): string {
  // @graphqlOmit fields must not reach the ObjectType. In code-first NestJS the emitted
  // @Field() IS the server GraphQL schema, so an omitted field would otherwise stay
  // queryable in api-schema.graphql. Enforce it here — the same predicate the sdk/crud
  // generators use — so models.ts is the single authoritative enforcement point. Filtering
  // up front also keeps the scalar import scans (usesType) from emitting unused imports.
  const visibleModels = models.map(m => ({
    ...m,
    fields: m.fields.filter((f: { documentation?: string }) => !f.documentation?.includes('@graphqlOmit')),
  }))

  const gqlImports = ['Field', 'ObjectType', 'Int']
  if (usesType(visibleModels, 'Float')) gqlImports.push('Float')
  if (usesType(visibleModels, 'DateTime')) gqlImports.push('GraphQLISODateTime')

  let output = `import { ${gqlImports.join(', ')} } from '@nestjs/graphql';\n`
  output += `import { GraphQLJSON } from 'graphql-type-json';\n`

  if (usesType(visibleModels, 'Decimal')) {
    output += `import Decimal from 'decimal.js';\n`
    output += `import { GraphQLDecimal } from 'prisma-graphql-type-decimal';\n`
  }
  if (usesType(visibleModels, 'BigInt')) output += `import { GraphQLBigInt } from 'graphql-scalars';\n`
  if (usesType(visibleModels, 'Json'))
    output += `import type { JsonValue } from '${prismaImportPath}';\n`

  const enumNames = enums.map((e: { name: string }) => e.name)
  if (enumNames.length > 0) output += `import { ${enumNames.join(', ')} } from './enums';\n`
  output += `\n`

  for (const model of visibleModels) {
    output += `@ObjectType({ description: undefined })\nexport class ${model.name} {\n`
    for (const field of model.fields) {
      output += `  ${buildFieldDecorator(field)}\n`
      output += `${buildFieldDeclaration(field)}\n\n`
    }
    output += `}\n\n`
  }
  return output
}

export function generateEnums(enums: readonly any[], prismaImportPath: string): string {
  let output = '// Generated from Prisma schema\n\n'
  output += "import { registerEnumType } from '@nestjs/graphql';\n"

  if (enums.length > 0) {
    const enumNames = enums.map(e => e.name).join(', ')
    // Import first to make enums available in scope, then export separately
    output += `import { ${enumNames} } from '${prismaImportPath}';\n`
    output += `export { ${enumNames} };\n\n`

    enums.forEach(enumType => {
      output += `registerEnumType(${enumType.name}, { name: '${enumType.name}' });\n\n`
    })
  } else {
    output += '// No enums found in schema to generate.\n'
  }

  return output
}

export function generateIndex(): string {
  return `// Generated from Prisma schema
export * from './models'
export * from './enums'
`
}

/**
 * Resolve the Prisma wrapper import path. Prefers an explicit override, otherwise
 * finds the tsconfig.base.json path alias that maps to libs/api/prisma/src/index.ts.
 * Fails loudly if neither is available.
 */
export function resolvePrismaImportPath(tree: Tree, override?: string): string {
  if (override) return override

  if (!tree.exists('tsconfig.base.json')) {
    throw new Error(
      'generators:models — tsconfig.base.json not found and no prismaImportPath override was provided. ' +
        'Pass --prismaImportPath to specify the Prisma wrapper import path.',
    )
  }

  const tsconfig = readJson(tree, 'tsconfig.base.json')
  const paths: Record<string, string[]> = tsconfig?.compilerOptions?.paths ?? {}
  for (const [alias, targets] of Object.entries(paths)) {
    if (
      Array.isArray(targets) &&
      targets.some((t) => t === PRISMA_INDEX_TARGET || t.replace(/^\.\//, '') === PRISMA_INDEX_TARGET)
    ) {
      return alias
    }
  }

  throw new Error(
    `generators:models — could not resolve the Prisma wrapper import path. Expected a tsconfig.base.json ` +
      `"paths" alias mapping to "${PRISMA_INDEX_TARGET}", or pass --prismaImportPath explicitly.`,
  )
}

export async function generateModelsLogic(tree: Tree, schema: GenerateModelsGeneratorSchema) {
  const outputPath = schema.outputPath || DEFAULT_OUTPUT_PATH
  const prismaImportPath = resolvePrismaImportPath(tree, schema.prismaImportPath)

  // Read and concatenate the Prisma schema (multi-file dirs supported by the engine helper).
  const prismaPath = getPrismaSchemaPath(tree)
  const schemaContent = readPrismaSchema(tree, prismaPath)
  if (!schemaContent) {
    throw new Error(`generators:models — no Prisma schema found at ${prismaPath}`)
  }

  const dmmf = await getDMMF({ datamodel: schemaContent })

  // Exclude @skipCrud models and their relation fields from other models so
  // security-sensitive types don't appear in the generated GraphQL schema.
  const allModels = dmmf.datamodel.models
  const skippedModelNames = getSkippedModelNames(allModels)
  const models = allModels
    .filter(m => !skippedModelNames.has(m.name))
    .map(m => ({
      ...m,
      fields: filterSkippedRelationFields(m.fields, skippedModelNames),
    }))
  const enums = dmmf.datamodel.enums

  tree.write(joinPathFragments(outputPath, 'models.ts'), generateModels(models, enums, prismaImportPath))
  tree.write(joinPathFragments(outputPath, 'enums.ts'), generateEnums(enums, prismaImportPath))
  tree.write(joinPathFragments(outputPath, 'index.ts'), generateIndex())

  // Format the emitted files with the workspace's Prettier config, exactly as the crud/sdk/
  // custom generators do, so generated code is consistent with the rest of the codebase and
  // stable under `nx format:write`. (The hand-written string form above uses semicolons; the
  // template repo's config is semi:false, so this is where they get normalized.)
  await formatFiles(tree)
}

export default async function (tree: Tree, schema: GenerateModelsGeneratorSchema) {
  return generateModelsLogic(tree, schema)
}

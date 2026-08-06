import { formatFiles, generateFiles, installPackagesTask, joinPathFragments, names, Tree } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'
import {
  apiLibraryGenerator,
  filterSkippedRelationFields,
  generateDatabaseModelContent,
  getCrudAuthForModel,
  getPluralName,
  getPrismaSchemaPath,
  getSkippedModelNames,
  ModelType,
  readPrismaSchema,
} from '../lib/engine'
import { GenerateCrudGeneratorSchema } from './schema'
import { generateFilterInputs } from './filter-inputs'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'

// STEP 1: DEFINE INTERFACES FOR DATA AND DEPENDENCIES

// `@crudAuth` resolution lives in lib/engine so this generator and getAllPrismaModels cannot
// drift. Re-exported here because it has always been part of this module's public surface.
export { getCrudAuthForModel, parseCrudAuth } from '../lib/engine'

// This interface makes the generator logic testable by defining its external dependencies.
export interface GenerateCrudGeneratorDependencies {
  formatFiles: typeof formatFiles
  generateFiles: typeof generateFiles
  installPackagesTask: typeof installPackagesTask
  joinPathFragments: typeof joinPathFragments
  names: typeof names
  getDMMF: typeof getDMMF
  apiLibraryGenerator: typeof apiLibraryGenerator
  getPrismaSchemaPath: typeof getPrismaSchemaPath
  readPrismaSchema: typeof readPrismaSchema
  getNpmScope: typeof getNpmScope
}

// STEP 2: DEFINE PURE HELPER & CONTENT GENERATION FUNCTIONS
// These functions are side-effect-free and can be tested independently.

export function getGuardForAuthLevel(level: string): string | null {
  if (!level) return 'GqlAuthAdminGuard'
  const normalized = level.toLowerCase()
  if (normalized === 'public') return null
  if (normalized === 'user') return 'GqlAuthGuard'
  if (normalized === 'admin') return 'GqlAuthAdminGuard'
  // Only the first character is normalised. The previous implementation lowercased the whole level
  // first, so a custom level like "billingAdmin" produced GqlAuthBillingadminGuard — a symbol that
  // does not exist — and downstream repos had to alias their real guard to the mangled name to make
  // generated code compile. Preserve the author's casing so "billingAdmin" resolves to
  // GqlAuthBillingAdminGuard, matching the convention documented in AGENTS.md.
  return `GqlAuth${level.charAt(0).toUpperCase()}${level.slice(1)}Guard`
}

/**
 * The access-level decorator for a resolved `@crudAuth` level.
 *
 * The template registers a global `APP_GUARD` that refuses any operation which has not declared an
 * access level, because NestJS applies no guard unless one is asked for — so a missing `@UseGuards`
 * used to be anonymously reachable and indistinguishable from an oversight. Hand-written resolvers
 * declare themselves with these decorators; generated ones could not, so the template carried an
 * interim bridge that accepted an attached auth guard as a declaration. Emitting the decorator here
 * lets that bridge be deleted, so an attached guard no longer substitutes for a declaration.
 *
 * It also makes `public` positive rather than absent: `@crudAuth: { "readMany": "public" }` used to
 * emit no decorator at all, output byte-identical to a dropped decorator or a generator bug.
 */
export function getAccessLevelDecoratorForAuthLevel(level: string): string {
  if (!level) return 'AdminOnly'
  const normalized = level.toLowerCase()
  if (normalized === 'public') return 'Public'
  if (normalized === 'user') return 'Authenticated'
  if (normalized === 'admin') return 'AdminOnly'
  // A custom level declares intent; it does not enforce. Only the custom guard knows what the level
  // means and it stays authoritative — a `noaccess` guard still denies everyone even though the
  // operation declares @Authenticated(). Deliberately no attempt to infer a stricter level from the
  // name: guessing would either under-declare (and be wrong) or over-declare (and be misleading).
  return 'Authenticated'
}

interface OperationAccess {
  levelDecorator: string
  guard: string | null
}

/**
 * Unannotated operations default to admin, matching {@link getCrudAuthForModel}. The default only
 * covers `undefined`; both resolvers below already treat any other falsy level as admin too.
 */
function resolveOperationAccess(level = 'admin'): OperationAccess {
  return {
    levelDecorator: getAccessLevelDecoratorForAuthLevel(level),
    guard: getGuardForAuthLevel(level),
  }
}

/** Level decorator first, then the guard when the level has one. `public` gets no guard. */
function renderAccessDecorators(access: OperationAccess): string {
  const decorators = [`@${access.levelDecorator}()`]
  if (access.guard) decorators.push(`@UseGuards(${access.guard})`)
  return decorators.join('\n  ')
}

function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

export function generateResolverContent(model: ModelType, npmScope: string): string {
  const access = {
    readMany: resolveOperationAccess(model.auth?.readMany),
    count: resolveOperationAccess(model.auth?.count),
    readOne: resolveOperationAccess(model.auth?.readOne),
    create: resolveOperationAccess(model.auth?.create),
    update: resolveOperationAccess(model.auth?.update),
    delete: resolveOperationAccess(model.auth?.delete),
  }

  // Level decorators and guards come from the same barrel, so they share one import. Only what the
  // file actually uses — a model whose operations are all admin must not import Public.
  const usedUtils = new Set<string>()
  for (const operation of Object.values(access)) {
    usedUtils.add(operation.levelDecorator)
    if (operation.guard) usedUtils.add(operation.guard)
  }
  const utilsImports = `import { ${Array.from(usedUtils)
    .sort((a, b) => a.localeCompare(b))
    .join(', ')} } from '@${npmScope}/api/utils'`

  // An all-public model attaches no guard, so importing UseGuards would leave an unused import.
  const nestCommonImports = Object.values(access).some((operation) => operation.guard)
    ? `\nimport { UseGuards } from '@nestjs/common'`
    : ''

  const readManyMethodName = model.pluralModelPropertyName
  const countMethodName = `${model.pluralModelPropertyName}Count`
  const readOneMethodName = model.modelPropertyName

  // Handle BigInt ID fields: use GraphQLBigInt scalar from graphql-scalars
  // to properly serialize/deserialize bigint values in GraphQL
  const idTsType = model.idFieldType === 'BigInt' ? 'bigint' : 'string'
  const idArgsType = model.idFieldType === 'BigInt' ? ", { type: () => GraphQLBigInt }" : ''
  const graphqlScalarImport = model.idFieldType === 'BigInt' ? "\nimport { GraphQLBigInt } from 'graphql-scalars'" : ''

  return `import { Args, Mutation, Query, Resolver, Info } from '@nestjs/graphql'${nestCommonImports}
import type { GraphQLResolveInfo } from 'graphql'
import { CorePaging } from '@${npmScope}/api/core/data-access'
import { ${model.modelName} } from '@${npmScope}/api/core/models'
import {
    ApiCrudDataAccessService,
    Create${model.modelName}Input,
    List${model.modelName}Input,
    Update${model.modelName}Input
    } from '@${npmScope}/api/generated-crud/data-access'${graphqlScalarImport}
${utilsImports}

@Resolver(() => ${model.modelName})
export class Generated${model.modelName}Resolver {
  constructor(private readonly generatedService: ApiCrudDataAccessService) {}

  @Query(() => [${model.modelName}], { nullable: true })
  ${renderAccessDecorators(access.readMany)}
  ${readManyMethodName}(
    @Info() info: GraphQLResolveInfo,
    @Args({ name: 'input', type: () => List${model.modelName}Input, nullable: true }) input?: List${
    model.modelName
  }Input,
  ) {
    return this.generatedService.${readManyMethodName}(info, input)
  }

  @Query(() => CorePaging, { nullable: true })
  ${renderAccessDecorators(access.count)}
  ${countMethodName}(
    @Args({ name: 'input', type: () => List${model.modelName}Input, nullable: true }) input?: List${
    model.modelName
  }Input,
  ) {
    return this.generatedService.${countMethodName}(input)
  }

  @Query(() => ${model.modelName}, { nullable: true })
  ${renderAccessDecorators(access.readOne)}
  ${readOneMethodName}(
    @Info() info: GraphQLResolveInfo,
    @Args('${model.modelPropertyName}Id'${idArgsType}) ${model.modelPropertyName}Id: ${idTsType}
  ) {
    return this.generatedService.${readOneMethodName}(info, ${model.modelPropertyName}Id)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  ${renderAccessDecorators(access.create)}
  create${model.modelName}(
    @Info() info: GraphQLResolveInfo,
    @Args('input') input: Create${model.modelName}Input,
  ) {
    return this.generatedService.create${model.modelName}(info, input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  ${renderAccessDecorators(access.update)}
  update${model.modelName}(
    @Info() info: GraphQLResolveInfo,
    @Args('${model.modelPropertyName}Id'${idArgsType}) ${model.modelPropertyName}Id: ${idTsType},
    @Args('input') input: Update${model.modelName}Input,
  ) {
    return this.generatedService.update${model.modelName}(info, ${model.modelPropertyName}Id, input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  ${renderAccessDecorators(access.delete)}
  delete${model.modelName}(
    @Args('${model.modelPropertyName}Id'${idArgsType}) ${model.modelPropertyName}Id: ${idTsType},
  ) {
    return this.generatedService.delete${model.modelName}(${model.modelPropertyName}Id)
  }
}
`
}

export function generateFeatureModuleContent(models: ModelType[], npmScope: string): string {
  return `import { Module } from '@nestjs/common'\nimport { ApiCrudDataAccessModule } from '@${npmScope}/api/generated-crud/data-access'\n${models
    .map((model) => `import { Generated${model.modelName}Resolver } from './${toKebabCase(model.modelName)}.resolver'`)
    .join('\n')}\n\n@Module({\n  imports: [ApiCrudDataAccessModule],\n  providers: [${models
    .map((model) => `Generated${model.modelName}Resolver`)
    .join(', ')}],\n})\nexport class ApiGeneratedCrudFeatureModule {}\n`
}

export function generateFeatureIndexContent(models: ModelType[]): string {
  return `export * from './lib/api-admin-crud-feature.module'\n${models
    .map((model) => `export * from './lib/${toKebabCase(model.modelName)}.resolver'`)
    .join('\n')}\n`
}

// STEP 3: DEFINE THE CORE LOGIC FUNCTION
// This function contains all the generator's logic but uses injected dependencies, making it testable.
export async function generateCrudLogic(
  tree: Tree,
  schema: GenerateCrudGeneratorSchema,
  dependencies: GenerateCrudGeneratorDependencies,
) {
  // Helper functions that now use injected dependencies
  async function getAllPrismaModels(tree: Tree): Promise<ModelType[]> {
    const prismaPath = dependencies.getPrismaSchemaPath(tree)
    const prismaSchema = dependencies.readPrismaSchema(tree, prismaPath)
    if (!prismaSchema) {
      console.error(`No Prisma schema found at ${prismaPath}`)
      return []
    }
    try {
      const dmmf = await dependencies.getDMMF({ datamodel: prismaSchema })
      const skippedModelNames = getSkippedModelNames(dmmf.datamodel.models)
      return dmmf.datamodel.models.filter(model => !skippedModelNames.has(model.name)).map((model) => {
        const singularPropertyName = model.name.charAt(0).toLowerCase() + model.name.slice(1)
        const pluralPropertyName = getPluralName(singularPropertyName)
        const authConfig = getCrudAuthForModel(model)
        const idField = model.fields.find((f) => f.isId)
        const idFieldType = idField ? idField.type : 'String'
        return {
          name: model.name,
          pluralName: getPluralName(model.name),
          fields: filterSkippedRelationFields(model.fields, skippedModelNames)
            .filter((field) => !field.documentation?.includes('@graphqlOmit'))
            .map((field) => ({
              name: field.name,
              kind: field.kind,
              type: field.type,
              isOptional: !field.isRequired,
              isId: field.isId,
              isUnique: field.isUnique,
              isList: field.isList,
              isReadOnly: field.isReadOnly,
              hasDefaultValue: field.hasDefaultValue,
              default: field.default,
              relationName: field.relationName,
              relationFromFields: field.relationFromFields ? [...field.relationFromFields] : undefined,
              relationToFields: field.relationToFields ? [...field.relationToFields] : undefined,
              relationOnDelete: field.relationOnDelete,
              relationOnUpdate: field.relationOnUpdate,
              isGenerated: field.isGenerated,
              isUpdatedAt: field.isUpdatedAt,
              documentation: field.documentation,
            })),
          primaryField: model.fields.find((f) => !f.isId && f.type === 'String')?.name || 'name',
          modelName: model.name,
          modelPropertyName: singularPropertyName,
          pluralModelName: getPluralName(model.name),
          pluralModelPropertyName: pluralPropertyName,
          auth: authConfig,
          idFieldType,
        }
      })
    } catch (error) {
      console.error('Error parsing Prisma schema:', error)
      return []
    }
  }

  async function createLibraries(tree: Tree, name: string, models: ModelType[]) {
    const dataAccessLibraryRoot = `libs/api/${name}/data-access`
    const featureLibraryRoot = `libs/api/${name}/feature`
    const templatePath = dependencies.joinPathFragments(__dirname, './files')

    // Filter inputs are built here rather than in the DTO template so the logic stays testable
    // and the template keeps to rendering. `models` has already had @skipCrud models and
    // @graphqlOmit fields stripped, so omitted columns cannot become filterable.
    const { source: filterInputs, filterInputNames } = generateFilterInputs(models, schema.filterDepth)
    const templateSchema = { name, models, filterInputs, filterInputNames }

    await dependencies.apiLibraryGenerator(tree, templateSchema, templatePath, 'data-access')
    await dependencies.apiLibraryGenerator(tree, templateSchema, templatePath, 'feature')
    return { dataAccessLibraryRoot, featureLibraryRoot }
  }

  async function generateModelFiles(
    tree: Tree,
    dataAccessLibraryRoot: string,
    featureLibraryRoot: string,
    models: ModelType[],
  ) {
    const npmScope = dependencies.getNpmScope(tree)

    // Generate feature module and resolvers
    const featureModuleContent = generateFeatureModuleContent(models, npmScope)
    tree.write(
      dependencies.joinPathFragments(featureLibraryRoot, 'src/lib/api-admin-crud-feature.module.ts'),
      featureModuleContent,
    )

    const featureIndexContent = generateFeatureIndexContent(models)
    tree.write(dependencies.joinPathFragments(featureLibraryRoot, 'src/index.ts'), featureIndexContent)

    // Generate database models file for frontend consumption
    const databaseModelContent = generateDatabaseModelContent(models)
    tree.write(
      dependencies.joinPathFragments(dataAccessLibraryRoot, 'src/lib/database-models.ts'),
      databaseModelContent,
    )

    // Delete stale resolver files for models that now have @skipCrud
    const allDmmfModels = await dependencies.getDMMF({
      datamodel: dependencies.readPrismaSchema(tree, dependencies.getPrismaSchemaPath(tree))!,
    })
    const skippedModelNames = getSkippedModelNames(allDmmfModels.datamodel.models)
    for (const skippedName of skippedModelNames) {
      const stalePath = dependencies.joinPathFragments(
        featureLibraryRoot,
        `src/lib/${toKebabCase(skippedName)}.resolver.ts`,
      )
      if (tree.exists(stalePath)) tree.delete(stalePath)
    }

    // Generate resolvers
    for (const model of models) {
      const resolverFilePath = dependencies.joinPathFragments(
        featureLibraryRoot,
        `src/lib/${toKebabCase(model.modelName)}.resolver.ts`,
      )
      const resolverContent = generateResolverContent(model, npmScope)
      tree.write(resolverFilePath, resolverContent)
    }
  }

  // Main Orchestration Logic
  const name = schema.name || 'generated-crud'
  const models = await getAllPrismaModels(tree)
  if (models.length === 0) {
    console.error('No Prisma models found')
    return // Return early for the test case
  }

  const { dataAccessLibraryRoot, featureLibraryRoot } = await createLibraries(tree, name, models)
  await generateModelFiles(tree, dataAccessLibraryRoot, featureLibraryRoot, models)
  await dependencies.formatFiles(tree)

  return () => {
    dependencies.installPackagesTask(tree)
  }
}

// STEP 4: DEFINE THE DEFAULT EXPORT
// This is what Nx CLI executes. It's a simple wrapper that provides the *real* dependencies to the logic function.
export default async function (tree: Tree, schema: GenerateCrudGeneratorSchema) {
  const dependencies: GenerateCrudGeneratorDependencies = {
    formatFiles,
    generateFiles,
    installPackagesTask,
    joinPathFragments,
    names,
    getDMMF,
    apiLibraryGenerator,
    getPrismaSchemaPath,
    readPrismaSchema,
    getNpmScope,
  }

  try {
    return await generateCrudLogic(tree, schema, dependencies)
  } catch (error) {
    console.error('Error in CRUD generator:', error)
    throw error
  }
}

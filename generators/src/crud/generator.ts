import { formatFiles, generateFiles, installPackagesTask, joinPathFragments, names, Tree } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'
import {
  apiLibraryGenerator,
  assertNoCrudAuthAnnotations,
  filterSkippedRelationFields,
  generateDatabaseModelContent,
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

function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

// The guard posture of the generated CRUD resolvers. Normally `admin`; `authenticated` only while
// a repo has a deliberate rollback in effect, declared in the posture file below. That file is the
// single source of truth — the same one the repo's doctor and guard-posture spec read — so the
// generator, doctor and spec agree by construction and `db-update` is safe to run at any point of
// a staged migration instead of only at the endpoints (nestled-dev-template#140).
//
// Anything not positively readable as a KNOWN posture resolves to `admin`: a missing file,
// unparseable JSON, an absent key, or a typo. This decides what guard gets written onto every
// generated resolver, so the default has to be the strict one. A present-but-invalid file is
// additionally reported, because failing closed *silently* would leave a config nobody realises
// has stopped meaning anything. (Semantics mirror the downstream doctor's reader — keep in step.)
export const GENERATED_CRUD_POSTURES = ['admin', 'authenticated'] as const
export type GeneratedCrudPosture = (typeof GENERATED_CRUD_POSTURES)[number]
export const GENERATED_CRUD_POSTURE_PATH = '.nestled-updates/security/generated-crud-posture.json'

export function readGeneratedCrudPosture(tree: Tree): { posture: GeneratedCrudPosture; invalid?: string } {
  if (!tree.exists(GENERATED_CRUD_POSTURE_PATH)) return { posture: 'admin' }

  let parsed: unknown
  try {
    parsed = JSON.parse(tree.read(GENERATED_CRUD_POSTURE_PATH, 'utf-8') ?? '')
  } catch {
    return { posture: 'admin', invalid: 'unparseable JSON' }
  }

  const declared = (parsed as { posture?: unknown })?.posture
  if (typeof declared === 'string' && (GENERATED_CRUD_POSTURES as readonly string[]).includes(declared)) {
    return { posture: declared as GeneratedCrudPosture }
  }
  if (typeof declared === 'string') return { posture: 'admin', invalid: `an unrecognized posture "${declared}"` }
  if (declared === undefined) return { posture: 'admin', invalid: 'no "posture" key' }
  return { posture: 'admin', invalid: `a non-string posture (${JSON.stringify(declared)})` }
}

export function generateResolverContent(
  model: ModelType,
  npmScope: string,
  posture: GeneratedCrudPosture = 'admin',
): string {
  const readManyMethodName = model.pluralModelPropertyName
  const countMethodName = `${model.pluralModelPropertyName}Count`
  const readOneMethodName = model.modelPropertyName

  // Handle BigInt ID fields: use GraphQLBigInt scalar from graphql-scalars
  // to properly serialize/deserialize bigint values in GraphQL
  const idTsType = model.idFieldType === 'BigInt' ? 'bigint' : 'string'
  const idArgsType = model.idFieldType === 'BigInt' ? ', { type: () => GraphQLBigInt }' : ''
  const graphqlScalarImport = model.idFieldType === 'BigInt' ? "\nimport { GraphQLBigInt } from 'graphql-scalars'" : ''

  const guard =
    posture === 'authenticated'
      ? { imports: 'Authenticated, GqlAuthGuard', guardClass: 'GqlAuthGuard', decorator: '@Authenticated()' }
      : {
          imports: 'AdminOnly, GqlAuthAdminGuard, RequirePlatformPermission',
          guardClass: 'GqlAuthAdminGuard',
          decorator: '@AdminOnly()',
        }
  const readPermission = posture === 'admin' ? "  @RequirePlatformPermission('platform.data-browser.read')\n" : ''
  const managePermission = posture === 'admin' ? "  @RequirePlatformPermission('platform.data-browser.manage')\n" : ''

  return `import { UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver, Info } from '@nestjs/graphql'
import type { GraphQLResolveInfo } from 'graphql'
import { CorePaging } from '@${npmScope}/api/core/data-access'
import { ${model.modelName} } from '@${npmScope}/api/core/models'
import {
    ApiCrudDataAccessService,
    Create${model.modelName}Input,
    List${model.modelName}Input,
    Update${model.modelName}Input
    } from '@${npmScope}/api/generated-crud/data-access'${graphqlScalarImport}
import { ${guard.imports} } from '@${npmScope}/api/utils'

@Resolver(() => ${model.modelName})
@UseGuards(${guard.guardClass})
${guard.decorator}
export class Generated${model.modelName}Resolver {
  constructor(private readonly generatedService: ApiCrudDataAccessService) {}

  @Query(() => [${model.modelName}], { nullable: true })
${readPermission}  ${readManyMethodName}(
    @Info() info: GraphQLResolveInfo,
    @Args({ name: 'input', type: () => List${model.modelName}Input, nullable: true }) input?: List${model.modelName}Input,
  ) {
    return this.generatedService.${readManyMethodName}(info, input)
  }

  @Query(() => CorePaging, { nullable: true })
${readPermission}  ${countMethodName}(
    @Args({ name: 'input', type: () => List${model.modelName}Input, nullable: true }) input?: List${model.modelName}Input,
  ) {
    return this.generatedService.${countMethodName}(input)
  }

  @Query(() => ${model.modelName}, { nullable: true })
${readPermission}  ${readOneMethodName}(
    @Info() info: GraphQLResolveInfo,
    @Args('${model.modelPropertyName}Id'${idArgsType}) ${model.modelPropertyName}Id: ${idTsType}
  ) {
    return this.generatedService.${readOneMethodName}(info, ${model.modelPropertyName}Id)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
${managePermission}  create${model.modelName}(
    @Info() info: GraphQLResolveInfo,
    @Args('input') input: Create${model.modelName}Input,
  ) {
    return this.generatedService.create${model.modelName}(info, input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
${managePermission}  update${model.modelName}(
    @Info() info: GraphQLResolveInfo,
    @Args('${model.modelPropertyName}Id'${idArgsType}) ${model.modelPropertyName}Id: ${idTsType},
    @Args('input') input: Update${model.modelName}Input,
  ) {
    return this.generatedService.update${model.modelName}(info, ${model.modelPropertyName}Id, input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
${managePermission}  delete${model.modelName}(
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
  return `export * from './lib/api-generated-crud-feature.module'\n${models
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
    let dmmf: Awaited<ReturnType<typeof dependencies.getDMMF>>
    try {
      dmmf = await dependencies.getDMMF({ datamodel: prismaSchema })
    } catch (error) {
      console.error('Error parsing Prisma schema:', error)
      return []
    }

    assertNoCrudAuthAnnotations(dmmf.datamodel.models)
    const skippedModelNames = getSkippedModelNames(dmmf.datamodel.models)
    return dmmf.datamodel.models
      .filter((model) => !skippedModelNames.has(model.name))
      .map((model) => {
        const singularPropertyName = model.name.charAt(0).toLowerCase() + model.name.slice(1)
        const pluralPropertyName = getPluralName(singularPropertyName)
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
          idFieldType,
        }
      })
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
    // The generated resolver module is the single registration point for generated CRUD. Import
    // it into the API's core module list instead of relying on custom resolvers to inherit the
    // generated classes and register their methods indirectly.
    await dependencies.apiLibraryGenerator(tree, templateSchema, templatePath, 'feature', true)
    return { dataAccessLibraryRoot, featureLibraryRoot }
  }

  async function generateModelFiles(
    tree: Tree,
    dataAccessLibraryRoot: string,
    featureLibraryRoot: string,
    models: ModelType[],
    posture: GeneratedCrudPosture,
  ) {
    const npmScope = dependencies.getNpmScope(tree)

    // Generate feature module and resolvers
    const featureModuleContent = generateFeatureModuleContent(models, npmScope)
    tree.write(
      dependencies.joinPathFragments(featureLibraryRoot, 'src/lib/api-generated-crud-feature.module.ts'),
      featureModuleContent,
    )

    // Older releases wrote the populated module beside the empty module scaffolded by @nx/nest.
    // Remove that alternate file so the library has one canonical module and one exported class.
    const legacyFeatureModulePath = dependencies.joinPathFragments(
      featureLibraryRoot,
      'src/lib/api-admin-crud-feature.module.ts',
    )
    if (tree.exists(legacyFeatureModulePath)) tree.delete(legacyFeatureModulePath)

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
      const resolverContent = generateResolverContent(model, npmScope, posture)
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

  const { posture, invalid } = readGeneratedCrudPosture(tree)
  if (invalid) {
    // Fail closed AND say so at emission time: a typo'd posture file silently emitting admin would
    // regress a declared `authenticated` rollback with nothing but the downstream spec to catch it.
    console.warn(
      `⚠️  ${GENERATED_CRUD_POSTURE_PATH} declares ${invalid}; emitting "admin" guards. ` +
        `Valid values: ${GENERATED_CRUD_POSTURES.join(', ')}.`,
    )
  }

  const { dataAccessLibraryRoot, featureLibraryRoot } = await createLibraries(tree, name, models)
  await generateModelFiles(tree, dataAccessLibraryRoot, featureLibraryRoot, models, posture)
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

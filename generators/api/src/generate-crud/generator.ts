import { formatFiles, generateFiles, installPackagesTask, joinPathFragments, names, Tree } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'
import { apiLibraryGenerator, getPrismaSchemaPath, readPrismaSchema, generateDatabaseModelContent, ModelType, getPluralName } from '@nestledjs/utils'
import { GenerateCrudGeneratorSchema } from './schema'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'

// STEP 1: DEFINE INTERFACES FOR DATA AND DEPENDENCIES
interface CrudAuthConfig {
  readOne?: string
  readMany?: string
  count?: string
  create?: string
  update?: string
  delete?: string
}

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
// These functions are side-effect free and can be tested independently.

export function parseCrudAuth(comment: string): CrudAuthConfig | null {
  try {
    const match = comment.match(/@crudAuth:\s*(\{.*\})/)
    if (!match) return null
    return JSON.parse(match[1])
  } catch (e) {
    console.error('Error parsing @crudAuth:', e)
    return null
  }
}

export function getCrudAuthForModel(schema: string, modelName: string): CrudAuthConfig {
  const defaultConfig: CrudAuthConfig = {
    readOne: 'admin',
    readMany: 'admin',
    count: 'admin',
    create: 'admin',
    update: 'admin',
    delete: 'admin',
  }
  const lines = schema.split('\n')
  let modelDoc: string[] = []
  let foundModel = false
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (
      trimmedLine.startsWith(`model ${modelName}`) ||
      trimmedLine.startsWith(`model ${modelName} `) ||
      trimmedLine.startsWith(`model ${modelName}{`)
    ) {
      foundModel = true
      break
    } else if (trimmedLine.startsWith('model ')) {
      modelDoc = []
    } else if (trimmedLine.startsWith('///') && !foundModel) {
      modelDoc.push(trimmedLine)
    }
  }
  if (!foundModel) return defaultConfig
  const authLine = modelDoc.find((line) => line.includes('@crudAuth:'))
  if (!authLine) return defaultConfig
  const config = parseCrudAuth(authLine)
  return config ? { ...defaultConfig, ...config } : defaultConfig
}

export function getGuardForAuthLevel(level: string): string | null {
  if (!level) return 'GqlAuthAdminGuard'
  level = level.toLowerCase()
  if (level === 'public') return null
  if (level === 'user') return 'GqlAuthGuard'
  if (level === 'admin') return 'GqlAuthAdminGuard'
  const pascalCase = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase()
  return `GqlAuth${pascalCase}Guard`
}

function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

export function generateResolverContent(model: ModelType, npmScope: string): string {
  const usedGuards = new Set<string>()
  if (model.auth) {
    Object.values(model.auth).forEach((level) => {
      if (level === 'public') return
      const guard = getGuardForAuthLevel(level)
      if (guard) usedGuards.add(guard)
    })
  } else {
    usedGuards.add('GqlAuthAdminGuard')
  }

  const guardImports =
    usedGuards.size > 0 ? `import { ${Array.from(usedGuards).sort().join(', ')} } from '@${npmScope}/api/utils'` : ''

  const readManyGuardDecorator = model.auth?.readMany ? getGuardForAuthLevel(model.auth.readMany) : 'GqlAuthAdminGuard'
  const countGuardDecorator = model.auth?.count ? getGuardForAuthLevel(model.auth.count) : 'GqlAuthAdminGuard'
  const readOneGuardDecorator = model.auth?.readOne ? getGuardForAuthLevel(model.auth.readOne) : 'GqlAuthAdminGuard'
  const createGuardDecorator = model.auth?.create ? getGuardForAuthLevel(model.auth.create) : 'GqlAuthAdminGuard'
  const updateGuardDecorator = model.auth?.update ? getGuardForAuthLevel(model.auth.update) : 'GqlAuthAdminGuard'
  const deleteGuardDecorator = model.auth?.delete ? getGuardForAuthLevel(model.auth.delete) : 'GqlAuthAdminGuard'

  const readManyMethodName = model.pluralModelPropertyName
  const countMethodName = `${model.pluralModelPropertyName}Count`
  const readOneMethodName = model.modelPropertyName

  return `import { Args, Mutation, Query, Resolver, Info } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import type { GraphQLResolveInfo } from 'graphql'
import { CorePaging } from '@${npmScope}/api/core/data-access'
import { ApiCrudDataAccessService } from '@${npmScope}/api/generated-crud/data-access'
import { ${model.modelName} } from '@${npmScope}/api/core/models'
import { Create${model.modelName}Input, List${model.modelName}Input, Update${
    model.modelName
  }Input } from '@${npmScope}/api/generated-crud/data-access'
${guardImports}

@Resolver(() => ${model.modelName})
export class Generated${model.modelName}Resolver {
  constructor(private readonly generatedService: ApiCrudDataAccessService) {}

  @Query(() => [${model.modelName}], { nullable: true })
  ${readManyGuardDecorator ? `@UseGuards(${readManyGuardDecorator})` : ''}
  ${readManyMethodName}(
    @Info() info: GraphQLResolveInfo,
    @Args({ name: 'input', type: () => List${model.modelName}Input, nullable: true }) input?: List${
    model.modelName
  }Input,
  ) {
    return this.generatedService.${readManyMethodName}(info, input)
  }

  @Query(() => CorePaging, { nullable: true })
  ${countGuardDecorator ? `@UseGuards(${countGuardDecorator})` : ''}
  ${countMethodName}(
    @Args({ name: 'input', type: () => List${model.modelName}Input, nullable: true }) input?: List${
    model.modelName
  }Input,
  ) {
    return this.generatedService.${countMethodName}(input)
  }

  @Query(() => ${model.modelName}, { nullable: true })
  ${readOneGuardDecorator ? `@UseGuards(${readOneGuardDecorator})` : ''}
  ${readOneMethodName}(
    @Info() info: GraphQLResolveInfo,
    @Args('${model.modelPropertyName}Id') ${model.modelPropertyName}Id: string
  ) {
    return this.generatedService.${readOneMethodName}(info, ${model.modelPropertyName}Id)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  ${createGuardDecorator ? `@UseGuards(${createGuardDecorator})` : ''}
  create${model.modelName}(
    @Info() info: GraphQLResolveInfo,
    @Args('input') input: Create${model.modelName}Input,
  ) {
    return this.generatedService.create${model.modelName}(info, input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  ${updateGuardDecorator ? `@UseGuards(${updateGuardDecorator})` : ''}
  update${model.modelName}(
    @Info() info: GraphQLResolveInfo,
    @Args('${model.modelPropertyName}Id') ${model.modelPropertyName}Id: string,
    @Args('input') input: Update${model.modelName}Input,
  ) {
    return this.generatedService.update${model.modelName}(info, ${model.modelPropertyName}Id, input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  ${deleteGuardDecorator ? `@UseGuards(${deleteGuardDecorator})` : ''}
  delete${model.modelName}(
    @Args('${model.modelPropertyName}Id') ${model.modelPropertyName}Id: string,
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
      return dmmf.datamodel.models.map((model) => {
        const singularPropertyName = model.name.charAt(0).toLowerCase() + model.name.slice(1)
        const pluralPropertyName = getPluralName(singularPropertyName)
        const authConfig = getCrudAuthForModel(prismaSchema, model.name)
        return {
          name: model.name,
          pluralName: getPluralName(model.name),
          fields: model.fields.map((field) => ({
            name: field.name,
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
    await dependencies.apiLibraryGenerator(tree, { name, models }, templatePath, 'data-access')
    await dependencies.apiLibraryGenerator(tree, { name, models }, templatePath, 'feature')
    return { dataAccessLibraryRoot, featureLibraryRoot }
  }

  async function generateModelFiles(
    tree: Tree,
    dataAccessLibraryRoot: string,
    featureLibraryRoot: string,
    models: ModelType[],
    name: string,
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
  await generateModelFiles(tree, dataAccessLibraryRoot, featureLibraryRoot, models, name)
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

import { formatFiles, generateFiles, installPackagesTask, joinPathFragments, names, Tree } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'
import { apiLibraryGenerator, getPrismaSchemaPath, readPrismaSchema } from '@nestled/utils'
import { GenerateCrudGeneratorSchema } from './schema'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import pluralize from 'pluralize'

interface CrudAuthConfig {
  readOne?: string
  readMany?: string
  count?: string
  create?: string
  update?: string
  delete?: string
}

function parseCrudAuth(comment: string): CrudAuthConfig | null {
  try {
    // Match @crudAuth: { ... } in a single line
    const match = comment.match(/@crudAuth:\s*(\{.*\})/)
    if (!match) return null

    // The captured group should be valid JSON
    return JSON.parse(match[1])
  } catch (e) {
    console.error('Error parsing @crudAuth:', e)
    return null
  }
}

function getCrudAuthForModel(schema: string, modelName: string): CrudAuthConfig {
  const defaultConfig: CrudAuthConfig = {
    readOne: 'admin',
    readMany: 'admin',
    count: 'admin',
    create: 'admin',
    update: 'admin',
    delete: 'admin',
  }

  // Split the schema into lines for precise model matching
  const lines = schema.split('\n')
  let modelDoc: string[] = []
  let foundModel = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Check if this is the start of our target model
    if (
      line.startsWith(`model ${modelName}`) ||
      line.startsWith(`model ${modelName} `) ||
      line.startsWith(`model ${modelName}{`)
    ) {
      // We found our model, use the collected documentation
      foundModel = true
      break
    } else if (line.startsWith('model ')) {
      // Reset documentation when we hit a different model
      modelDoc = []
    } else if (line.startsWith('///') && !foundModel) {
      // Only collect documentation if it's before our model
      modelDoc.push(line)
    }
  }

  if (!foundModel) return defaultConfig

  // Find the @crudAuth line in the model's documentation
  const authLine = modelDoc.find((line) => line.includes('@crudAuth:'))

  if (!authLine) return defaultConfig

  const config = parseCrudAuth(authLine)
  if (config) {
    return { ...defaultConfig, ...config }
  }

  return defaultConfig
}

function getGuardForAuthLevel(level: string): string | null {
  if (!level) return 'GqlAuthAdminGuard' // Default to admin if not specified
  level = level.toLowerCase()

  if (level === 'public') return null
  if (level === 'user') return 'GqlAuthGuard'
  if (level === 'admin') return 'GqlAuthAdminGuard'

  // For custom roles, convert to PascalCase and prepend 'GqlAuth' and append 'Guard'
  // Example: 'custom' -> 'GqlAuthCustomGuard'
  const pascalCase = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase()
  return `GqlAuth${pascalCase}Guard`
}

async function getAllPrismaModels(tree: Tree): Promise<ModelType[]> {
  const prismaPath = getPrismaSchemaPath(tree)
  const prismaSchema = readPrismaSchema(tree, prismaPath)
  if (!prismaSchema) {
    console.error(`No Prisma schema found at ${prismaPath}`)
    return []
  }

  try {
    const dmmf = await getDMMF({ datamodel: prismaSchema })
    return dmmf.datamodel.models.map((model) => {
      const singularPropertyName = model.name.charAt(0).toLowerCase() + model.name.slice(1)
      const pluralPropertyName = pluralize(singularPropertyName)

      // Create a properly typed fields array
      const fields = model.fields.map((field) => ({
        name: field.name,
        type: field.type,
        isId: field.isId,
        isRequired: field.isRequired,
        isList: field.isList,
        isUnique: field.isUnique,
        isReadOnly: field.isReadOnly,
        isGenerated: field.isGenerated,
        isUpdatedAt: field.isUpdatedAt,
        documentation: field.documentation,
        // Include any other properties that might be needed
        ...field,
      }))

      // Get auth config for this model
      const authConfig = getCrudAuthForModel(prismaSchema, model.name)

      // Create and return the model with auth configuration
      const modelWithAuth: ModelType = {
        name: model.name,
        pluralName: pluralize(model.name),
        fields,
        primaryField: model.fields.find((f) => !f.isId && f.type === 'String')?.name || 'name',
        modelName: model.name,
        modelPropertyName: singularPropertyName,
        pluralModelName: pluralize(model.name),
        pluralModelPropertyName: pluralPropertyName,
        auth: authConfig,
      }

      return modelWithAuth
    })
  } catch (error) {
    console.error('Error parsing Prisma schema:', error)
    return []
  }
}

async function createLibraries(tree: Tree) {
  // Create required libraries for CRUD

  // Define library names and roots
  const dataAccessLibraryRoot = `libs/api/generated-crud/data-access`
  const featureLibraryRoot = `libs/api/generated-crud/feature`
  const name = 'generated-crud'
  const dataAccessTemplatePath = joinPathFragments(__dirname, './files/data-access')
  const featureTemplatePath = joinPathFragments(__dirname, './files/feature')

  try {
    // Use the shared apiLibraryGenerator to create the data-access library with templates
    await apiLibraryGenerator(tree, { name }, dataAccessTemplatePath, 'data-access')

    // Use the shared apiLibraryGenerator to create the feature library with an empty template directory
    await apiLibraryGenerator(tree, { name }, featureTemplatePath, 'feature')
  } catch (error) {
    console.error('Error creating libraries:', error)
    throw error
  }

  return { dataAccessLibraryRoot, featureLibraryRoot }
}

// Helper function to convert camelCase to kebab-case
function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

interface ModelType {
  name: string
  pluralName: string
  fields: ReadonlyArray<Record<string, unknown> & { name: string; type: string }>
  primaryField: string
  modelName: string
  modelPropertyName: string
  pluralModelName: string
  pluralModelPropertyName: string
  auth?: CrudAuthConfig
}

async function generateModelFiles(
  tree: Tree,
  dataAccessLibraryRoot: string,
  featureLibraryRoot: string,
  models: ModelType[],
  name = 'generated-crud',
) {
  // Generate files for models

  // Ensure a name is not undefined or empty
  if (!name) {
    name = 'generated-crud'
  }

  // Generate service files in the data-access library
  // Ensure we have valid values for template substitutions
  const nameObj = names(name || 'generated-crud')
  const substitutions = {
    name: name || 'generated-crud',
    models,
    npmScope: `@${getNpmScope(tree)}`,
    apiClassName: 'PrismaCrud',
    ...nameObj,
    tmpl: '',
    type: 'data-access',
  }

  // Generate the service file with the new name
  generateFiles(
    tree,
    joinPathFragments(__dirname, './files/data-access/src/lib'),
    joinPathFragments(dataAccessLibraryRoot, 'src/lib'),
    {
      ...substitutions,
    },
  )

  // Generate the index.ts file for the data-access library
  generateFiles(
    tree,
    joinPathFragments(__dirname, './files/data-access/src'),
    joinPathFragments(dataAccessLibraryRoot, 'src'),
    {
      ...substitutions,
    },
  )

  // Create feature module file for generated-crud
  const featureModuleContent = `import { Module } from '@nestjs/common'
import { ApiCrudDataAccessModule } from '@${getNpmScope(tree)}/api/generated-crud/data-access'
${models
  .map((model) => `import { Generated${model.modelName}Resolver } from './${toKebabCase(model.modelName)}.resolver'`)
  .join('\n')}

@Module({
  imports: [ApiCrudDataAccessModule],
  providers: [${models.map((model) => `Generated${model.modelName}Resolver`).join(', ')}],
})
export class ApiGeneratedCrudFeatureModule {}
`

  // Always write a feature module file
  tree.write(joinPathFragments(featureLibraryRoot, 'src/lib/api-admin-crud-feature.module.ts'), featureModuleContent)

  // Create an index.ts file for the feature library
  const featureIndexContent = `export * from './lib/api-admin-crud-feature.module'
${models.map((model) => `export * from './lib/${toKebabCase(model.modelName)}.resolver'`).join('\n')}
`

  // Always write a feature index file
  tree.write(joinPathFragments(featureLibraryRoot, 'src/index.ts'), featureIndexContent)

  // Generate individual resolver files for each model in the feature library
  for (const model of models) {
    const resolverFilePath = joinPathFragments(
      featureLibraryRoot,
      `src/lib/${toKebabCase(model.modelName)}.resolver.ts`,
    )

    // Always create the resolver file

    const resolverContent = `import { Args, Mutation, Query, Resolver, Info } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import type { GraphQLResolveInfo } from 'graphql'
import {
  CorePaging
} from '@${getNpmScope(tree)}/api/core/data-access'
import { ApiCrudDataAccessService } from '@${getNpmScope(tree)}/api/generated-crud/data-access'
import {
  ${model.modelName},
} from '@${getNpmScope(tree)}/api/core/models'
import {
  Create${model.modelName}Input,
  List${model.modelName}Input,
  Update${model.modelName}Input,
} from '@${getNpmScope(tree)}/api/generated-crud/data-access'
${(() => {
  const usedGuards = new Set<string>()

  // Check which guards are actually used in the resolver
  if (model.auth) {
    Object.values(model.auth).forEach((level) => {
      if (level === 'public') return
      const guard = getGuardForAuthLevel(level)
      if (guard) {
        usedGuards.add(guard)
      }
    })
  } else {
    // If no auth config, we use admin guard by default
    usedGuards.add('GqlAuthAdminGuard')
  }

  // Only include the import if we have guards to import
  if (usedGuards.size === 0) return ''

  // CHANGED: Import guards from '@namespace/api/custom' instead of auth util
  return `import { ${Array.from(usedGuards).sort().join(', ')} } from '@namespace/api/custom'`
})()}

@Resolver(() => ${model.modelName})
export class Generated${model.modelName}Resolver {
  constructor(
    private readonly service: ApiCrudDataAccessService,
  ) {}

  @Query(() => [${model.modelName}], { nullable: true })
  ${(() => {
    const guard = model.auth?.readMany ? getGuardForAuthLevel(model.auth.readMany) : 'GqlAuthAdminGuard'
    return guard ? `@UseGuards(${guard})` : ''
  })()}
  ${
    (model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName)
      .charAt(0)
      .toLowerCase() +
    (model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName).slice(1)
  }(
    @Info() info: GraphQLResolveInfo,
    @Args({ name: 'input', type: () => List${model.modelName}Input, nullable: true }) input?: List${
      model.modelName
    }Input,
  ) {
    return this.service.${
      (model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName)
        .charAt(0)
        .toLowerCase() +
      (model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName).slice(1)
    }(info, input)
  }

  @Query(() => CorePaging, { nullable: true })
  ${(() => {
    const guard = model.auth?.count ? getGuardForAuthLevel(model.auth.count) : 'GqlAuthAdminGuard'
    return guard ? `@UseGuards(${guard})` : ''
  })()}
  ${
    (model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName)
      .charAt(0)
      .toLowerCase() +
    (model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName).slice(1)
  }Count(
    @Args({ name: 'input', type: () => List${model.modelName}Input, nullable: true }) input?: List${
      model.modelName
    }Input,
  ) {
    return this.service.${
      (model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName)
        .charAt(0)
        .toLowerCase() +
      (model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName).slice(1)
    }Count(input)
  }

  @Query(() => ${model.modelName}, { nullable: true })
  ${(() => {
    const guard = model.auth?.readOne ? getGuardForAuthLevel(model.auth.readOne) : 'GqlAuthAdminGuard'
    return guard ? `@UseGuards(${guard})` : ''
  })()}
  ${model.modelName.charAt(0).toLowerCase() + model.modelName.slice(1)}(
    @Info() info: GraphQLResolveInfo,
    @Args('${model.modelPropertyName}Id') ${model.modelPropertyName}Id: string
  ) {
    return this.service.${model.modelName.charAt(0).toLowerCase() + model.modelName.slice(1)}(info, ${
      model.modelPropertyName
    }Id)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  ${(() => {
    const guard = model.auth?.create ? getGuardForAuthLevel(model.auth.create) : 'GqlAuthAdminGuard'
    return guard ? `@UseGuards(${guard})` : ''
  })()}
  create${model.modelName.charAt(0).toUpperCase() + model.modelName.slice(1)}(
    @Info() info: GraphQLResolveInfo,
    @Args('input') input: Create${model.modelName}Input,
  ) {
    return this.service.create${model.modelName.charAt(0).toUpperCase() + model.modelName.slice(1)}(info, input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  ${(() => {
    const guard = model.auth?.update ? getGuardForAuthLevel(model.auth.update) : 'GqlAuthAdminGuard'
    return guard ? `@UseGuards(${guard})` : ''
  })()}
  update${model.modelName.charAt(0).toUpperCase() + model.modelName.slice(1)}(
    @Info() info: GraphQLResolveInfo,
    @Args('${model.modelPropertyName}Id') ${model.modelPropertyName}Id: string,
    @Args('input') input: Update${model.modelName}Input,
  ) {
    return this.service.update${model.modelName.charAt(0).toUpperCase() + model.modelName.slice(1)}(info, ${
      model.modelPropertyName
    }Id, input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  ${(() => {
    const guard = model.auth?.delete ? getGuardForAuthLevel(model.auth.delete) : 'GqlAuthAdminGuard'
    return guard ? `@UseGuards(${guard})` : ''
  })()}
  delete${model.modelName.charAt(0).toUpperCase() + model.modelName.slice(1)}(
    @Args('${model.modelPropertyName}Id') ${model.modelPropertyName}Id: string,
  ) {
    return this.service.delete${model.modelName.charAt(0).toUpperCase() + model.modelName.slice(1)}(${
      model.modelPropertyName
    }Id)
  }
}
`

    tree.write(resolverFilePath, resolverContent)
  }
}

export default async function (tree: Tree, schema: GenerateCrudGeneratorSchema) {
  try {
    // If a name is not provided, set a default value
    if (!schema.name) {
      schema.name = 'generated-crud'
    }

    // Get all Prisma models
    const models = await getAllPrismaModels(tree)
    if (models.length === 0) {
      console.error('No Prisma models found')
      return
    }

    // Create libraries if they don't exist
    const { dataAccessLibraryRoot, featureLibraryRoot } = await createLibraries(tree)

    // Generate model files with the provided name or default to 'generated-crud'
    await generateModelFiles(tree, dataAccessLibraryRoot, featureLibraryRoot, models, schema.name || 'generated-crud')

    // Format files
    await formatFiles(tree)

    return () => {
      installPackagesTask(tree)
    }
  } catch (error) {
    console.error('Error in CRUD generator:', error)
    throw error
  }
}

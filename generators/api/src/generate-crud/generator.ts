import { formatFiles, generateFiles, installPackagesTask, joinPathFragments, names, Tree } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'
import { apiLibraryGenerator, getPrismaSchemaPath, readPrismaSchema, deleteFiles, getPluralName } from '@nestled/utils'
import { GenerateCrudGeneratorSchema } from './schema'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'

// Group all dependencies into a single object
const defaultDependencies = {
  formatFiles,
  generateFiles,
  installPackagesTask,
  joinPathFragments,
  names,
  getDMMF,
  apiLibraryGenerator,
  getPrismaSchemaPath,
  readPrismaSchema,
  deleteFiles,
  getPluralName,
  getNpmScope,
}
export type GenerateCrudGeneratorDependencies = typeof defaultDependencies

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

async function getAllPrismaModels(tree: Tree, dependencies: GenerateCrudGeneratorDependencies): Promise<ModelType[]> {
  const prismaPath = dependencies.getPrismaSchemaPath(tree)
  if (!prismaPath || !tree.exists(prismaPath)) {
    console.error(`Prisma schema not found. Looked for ${prismaPath}`)
    return []
  }
  const prismaSchema = dependencies.readPrismaSchema(tree, prismaPath)
  if (!prismaSchema) {
    console.error(`No Prisma schema found at ${prismaPath}`)
    return []
  }

  try {
    const dmmf = await dependencies.getDMMF({ datamodel: prismaSchema })
    return dmmf.datamodel.models
      .filter((model) => {
        if (!model.name || typeof model.name !== 'string' || !model.name.trim()) {
          console.error('Skipping model with invalid or missing name:', model)
          return false
        }
        return true
      })
      .map((model) => {
        const singularPropertyName = model.name.charAt(0).toLowerCase() + model.name.slice(1)
        const pluralName = dependencies.getPluralName(model.name)
        const pluralModelPropertyName = dependencies.getPluralName(singularPropertyName)
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
          pluralName: pluralName,
          fields,
          primaryField: model.fields.find((f) => !f.isId && f.type === 'String')?.name || 'name',
          modelName: model.name,
          modelPropertyName: singularPropertyName,
          pluralModelName: pluralName,
          pluralModelPropertyName: pluralModelPropertyName,
          auth: authConfig,
        }

        return modelWithAuth
      })
  } catch (error) {
    console.error('Error parsing Prisma schema:', error)
    return []
  }
}

async function createLibraries(tree: Tree, name: string, models: ModelType[], dependencies: GenerateCrudGeneratorDependencies) {
  // Create required libraries for CRUD

  // Define library names and roots
  const dataAccessLibraryRoot = `libs/api/generated-crud/data-access`
  const featureLibraryRoot = `libs/api/generated-crud/feature`
  const templatePath = dependencies.joinPathFragments(__dirname, './files')

  try {
    // Use the shared apiLibraryGenerator to create the data-access library with templates and models
    await dependencies.apiLibraryGenerator(tree, { name, models }, templatePath, 'data-access')

    // Use the shared apiLibraryGenerator to create the feature library with an empty template directory
    await dependencies.apiLibraryGenerator(tree, { name }, templatePath, 'feature')
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

function generateDataAccessFiles(
  tree: Tree,
  libraryRoot: string,
  models: ModelType[],
  schema: GenerateCrudGeneratorSchema,
  dependencies: GenerateCrudGeneratorDependencies,
) {
  const npmScope = `@${dependencies.getNpmScope(tree)}`
  const templateOptions = {
    ...dependencies.names(schema.name || 'crud'),
    models,
    npmScope,
    tmpl: '',
  }

  // Generate the shared data-access files
  dependencies.generateFiles(
    tree,
    dependencies.joinPathFragments(__dirname, './files/data-access/src/lib'),
    dependencies.joinPathFragments(libraryRoot, 'src/lib'),
    templateOptions,
  )

  // Create the index file for the data-access library
  const indexPath = dependencies.joinPathFragments(libraryRoot, 'src/index.ts')
  const indexContent = `export * from './lib/api-crud-data-access.module';
export * from './lib/api-crud-data-access.service';
export * from './lib/dto';
`
  tree.write(indexPath, indexContent)
}

function generateFeatureFiles(
  tree: Tree,
  libraryRoot: string,
  model: ModelType,
  schema: GenerateCrudGeneratorSchema,
  dependencies: GenerateCrudGeneratorDependencies,
) {
  const npmScope = `@${dependencies.getNpmScope(tree)}`
  const kebabCaseModelName = toKebabCase(model.name)
  const resolverPath = dependencies.joinPathFragments(libraryRoot, 'src/lib', `${kebabCaseModelName}.resolver.ts`)

  // The content for the resolver is generated dynamically.
  const resolverContent = `import { UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { ApiCrudDataAccessService, PagingResponse } from '${npmScope}/api/generated-crud/data-access'
import { ${model.modelName} } from '${npmScope}/api/core/data-access'
import { GqlAuthAdminGuard, GqlAuthGuard } from '${npmScope}/api/auth/data-access'
import { Create${model.modelName}Input, Update${model.modelName}Input, List${
    model.modelName
  }Input } from './dto'

@Resolver()
export class ${model.modelName}Resolver {
  constructor(private readonly service: ApiCrudDataAccessService) {}

  @Query(() => [${model.modelName}], { nullable: true })
  @UseGuards(${model.auth?.readMany ? getGuardForAuthLevel(model.auth.readMany) : 'GqlAuthAdminGuard'})
  async ${model.pluralModelPropertyName}(@Args('input') input: List${model.modelName}Input) {
    return this.service.${model.pluralModelPropertyName}(input)
  }

  @Query(() => PagingResponse, { nullable: true })
  @UseGuards(${model.auth?.count ? getGuardForAuthLevel(model.auth.count) : 'GqlAuthAdminGuard'})
  async ${model.pluralModelPropertyName}Paging(@Args('input') input: List${model.modelName}Input) {
    return this.service.${model.pluralModelPropertyName}Paging(input)
  }

  @Query(() => ${model.modelName}, { nullable: true })
  @UseGuards(${model.auth?.readOne ? getGuardForAuthLevel(model.auth.readOne) : 'GqlAuthAdminGuard'})
  async ${model.modelPropertyName}(@Args('id') id: string) {
    return this.service.${model.modelPropertyName}(id)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  @UseGuards(${model.auth?.create ? getGuardForAuthLevel(model.auth.create) : 'GqlAuthAdminGuard'})
  async create${model.modelName}(@Args('input') input: Create${model.modelName}Input) {
    return this.service.create${model.modelName}(input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  @UseGuards(${model.auth?.update ? getGuardForAuthLevel(model.auth.update) : 'GqlAuthAdminGuard'})
  async update${model.modelName}(@Args('id') id: string, @Args('input') input: Update${model.modelName}Input) {
    return this.service.update${model.modelName}(id, input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  @UseGuards(${model.auth?.delete ? getGuardForAuthLevel(model.auth.delete) : 'GqlAuthAdminGuard'})
  async delete${model.modelName}(@Args('id') id: string) {
    return this.service.delete${model.modelName}(id)
  }
}
`
  // Write the dynamically generated resolver file.
  tree.write(resolverPath, resolverContent)

  // Update the index file for the feature library
  updateFeatureIndexFile(tree, libraryRoot, model.name, dependencies)
}

function updateFeatureIndexFile(tree: Tree, libraryRoot: string, modelName: string, dependencies: GenerateCrudGeneratorDependencies) {
  const kebabCaseModelName = toKebabCase(modelName)
  const indexPath = dependencies.joinPathFragments(libraryRoot, 'src/index.ts')

  let indexContent = ''
  if (tree.exists(indexPath)) {
    indexContent = tree.read(indexPath, 'utf-8') || ''
  }

  const resolverExport = `export * from './lib/${kebabCaseModelName}.resolver';\n`

  if (!indexContent.includes(resolverExport)) {
    indexContent += resolverExport
  }
  tree.write(indexPath, indexContent)
}

export async function generateCrudLogic(
  tree: Tree,
  schema: GenerateCrudGeneratorSchema,
  dependencies: GenerateCrudGeneratorDependencies = defaultDependencies,
) {
  try {
    const name = schema.name || 'generated-crud'

    // Get all Prisma models
    const models = await getAllPrismaModels(tree, dependencies)
    if (!models || models.length === 0) {
      console.error('No Prisma models found. Make sure your schema.prisma is correctly defined.')
      return
    }

    // Create required libraries for CRUD
    const { dataAccessLibraryRoot, featureLibraryRoot } = await createLibraries(tree, name, models, dependencies)

    // Overwrite logic for specific models
    if (schema.overwrite && schema.model) {
      const modelToDelete = schema.model
      const modelObject = models.find((m) => m.name === modelToDelete)
      if (modelObject) {
        const kebabCaseModelName = toKebabCase(modelObject.name)
        const dataAccessPath = dependencies.joinPathFragments(
          dataAccessLibraryRoot,
          'src/lib',
          `${kebabCaseModelName}.service.ts`,
        )
        const featurePath = dependencies.joinPathFragments(
          featureLibraryRoot,
          'src/lib',
          `${kebabCaseModelName}.resolver.ts`,
        )
        dependencies.deleteFiles(tree, [dataAccessPath, featurePath])
      }
    }

    // Generate shared data-access files
    generateDataAccessFiles(tree, dataAccessLibraryRoot, models, schema, dependencies)

    // Generate feature files for each model
    for (const model of models) {
      if (schema.model && model.name !== schema.model) {
        continue
      }
      generateFeatureFiles(tree, featureLibraryRoot, model, schema, dependencies)
    }

    // Format files
    await dependencies.formatFiles(tree)

    return () => {
      dependencies.installPackagesTask(tree)
    }
  } catch (error) {
    console.error('Error in CRUD generator:', error)
    throw error
  }
}

export default async function (tree: Tree, schema: GenerateCrudGeneratorSchema) {
  return generateCrudLogic(tree, schema, defaultDependencies)
}

import { formatFiles, installPackagesTask, Tree } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'
import { addToModules, apiLibraryGenerator, getPrismaSchemaPath, readPrismaSchema } from '@nestledjs/utils'
import { GenerateCustomGeneratorSchema } from './schema'
import { execSync } from 'child_process'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import pluralize from 'pluralize'
import { join } from 'path'

// Group all dependencies into a single object
const defaultDependencies = {
  formatFiles,
  installPackagesTask,
  getDMMF,
  addToModules,
  apiLibraryGenerator,
  getPrismaSchemaPath,
  readPrismaSchema,
  execSync,
  getNpmScope,
  pluralize,
  join,
}
export type CustomGeneratorDependencies = typeof defaultDependencies

interface ModelType {
  name: string
  pluralName: string
  fields: ReadonlyArray<Record<string, unknown> & { name: string; type: string }>
  primaryField: string
  modelName: string
  modelPropertyName: string
  pluralModelName: string
  pluralModelPropertyName: string
}

async function getAllPrismaModels(tree: Tree, dependencies: CustomGeneratorDependencies): Promise<ModelType[]> {
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
      const pluralPropertyName = dependencies.pluralize(singularPropertyName)

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

      // Create and return the model
      const modelData: ModelType = {
        name: model.name,
        pluralName: dependencies.pluralize(model.name),
        fields,
        primaryField: model.fields.find((f) => !f.isId && f.type === 'String')?.name || 'name',
        modelName: model.name,
        modelPropertyName: singularPropertyName,
        pluralModelName: dependencies.pluralize(model.name),
        pluralModelPropertyName: pluralPropertyName,
      }

      return modelData
    })
  } catch (error) {
    console.error('Error parsing Prisma schema:', error)
    return []
  }
}

async function ensureDirExists(tree: Tree, path: string) {
  if (!tree.exists(path)) {
    // Only create the directory, do not write .gitkeep
    // Directory will be created when a file is written into it
  }
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

async function generateCustomFiles(
  tree: Tree,
  customLibraryRoot: string,
  models: ModelType[],
  npmScope: string,
  dependencies: CustomGeneratorDependencies,
) {
  const defaultDir = dependencies.join(customLibraryRoot, 'src/lib/default')
  const pluginsDir = dependencies.join(customLibraryRoot, 'src/lib/plugins')
  await ensureDirExists(tree, defaultDir)
  await ensureDirExists(tree, pluginsDir)
  // Create empty index.ts in pluginsDir for custom plugins
  tree.write(dependencies.join(pluginsDir, 'index.ts'), '')

  for (const model of models) {
    const kebabModel = toKebabCase(model.modelName)
    const modelFolder = dependencies.join(defaultDir, kebabModel)
    if (tree.exists(modelFolder)) {
      // Skip if model folder already exists
      continue
    }
    await ensureDirExists(tree, modelFolder)

    // Generate service.ts
    const serviceContent = `import { Injectable } from '@nestjs/common'

@Injectable()
export class ${model.modelName}Service {
  // Empty for now; will override or extend later if needed
}
`
    tree.write(dependencies.join(modelFolder, `${kebabModel}.service.ts`), serviceContent)

    // Generate resolver.ts
    const resolverContent = `
import { ApiCrudDataAccessService } from '${npmScope}/api/generated-crud/data-access'
import { Generated${model.modelName}Resolver } from '${npmScope}/api/generated-crud/feature'
import { Injectable } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { ${model.modelName} } from '${npmScope}/api/core/models'

@Resolver(() => ${model.modelName})
@Injectable()
export class ${model.modelName}Resolver extends Generated${model.modelName}Resolver {
  constructor(
    // private readonly customService: ${model.modelName}Service,
    generatedService: ApiCrudDataAccessService,
  ) {
    super(generatedService)
  }
}
`
    tree.write(dependencies.join(modelFolder, `${kebabModel}.resolver.ts`), resolverContent)

    // Generate module.ts
    const moduleContent = `import { Module } from '@nestjs/common'
import { ${model.modelName}Service } from './${kebabModel}.service'
import { ${model.modelName}Resolver } from './${kebabModel}.resolver'
import { ApiCrudDataAccessModule } from '${npmScope}/api/generated-crud/data-access'

@Module({
  imports: [ApiCrudDataAccessModule],
  providers: [${model.modelName}Service, ${model.modelName}Resolver],
  exports: [${model.modelName}Service, ${model.modelName}Resolver],
})
export class ${model.modelName}Module {}
`
    tree.write(dependencies.join(modelFolder, `${kebabModel}.module.ts`), moduleContent)

    // Add to defaultModules in app.module.ts__tmpl__
    dependencies.addToModules({
      tree,
      modulePath: 'apps/api/src/app.module.ts',
      moduleArrayName: 'defaultModules',
      moduleToAdd: `${model.modelName}Module`,
      importPath: `${npmScope}/api/custom`,
    })
  }

  // Update default/index.ts to export all model modules
  const modelFolders = models.map((m) => toKebabCase(m.modelName))
  const defaultIndexContent = modelFolders.map((m) => `export * from './${m}/${m}.module'`).join('\n')
  tree.write(dependencies.join(defaultDir, 'index.ts'), defaultIndexContent)
}

export async function customGeneratorLogic(
  tree: Tree,
  schema: GenerateCustomGeneratorSchema,
  dependencies: CustomGeneratorDependencies = defaultDependencies,
) {
  try {
    const name = schema.name || 'custom'
    const customLibraryRoot = schema.directory ? `libs/api/${schema.directory}/${name}` : `libs/api/${name}`
    const projectName = schema.directory ? `api-${schema.directory.replace(/\//g, '-')}-${name}` : `api-${name}`

    // Overwrite logic
    if (schema.overwrite && tree.exists(customLibraryRoot)) {
      try {
        dependencies.execSync(`nx g @nx/workspace:remove ${projectName} --forceRemove`, {
          stdio: 'inherit',
          cwd: tree.root,
        })
      } catch (error) {
        console.warn(`Failed to remove existing library ${projectName}:`, error)
      }
    }

    // Use the shared apiLibraryGenerator but pass empty template to avoid conflicts
    await dependencies.apiLibraryGenerator(tree, { name }, '', undefined, false)

    await ensureDirExists(tree, dependencies.join(customLibraryRoot, 'src/lib/default'))
    await ensureDirExists(tree, dependencies.join(customLibraryRoot, 'src/lib/plugins'))

    // Override the main index.ts created by apiLibraryGenerator with our stable version
    const mainIndexContent = `export * from './lib/plugins'
export * from './lib/default'
`
    tree.write(dependencies.join(customLibraryRoot, 'src/index.ts'), mainIndexContent)

    // Get all Prisma models
    const models = await getAllPrismaModels(tree, dependencies)
    if (models.length === 0) {
      console.error('No Prisma models found')
      return
    }

    // Generate custom files per model
    const npmScope = `@${dependencies.getNpmScope(tree)}`
    await generateCustomFiles(tree, customLibraryRoot, models, npmScope, dependencies)

    // Format files
    await dependencies.formatFiles(tree)

    return () => {
      dependencies.installPackagesTask(tree)
    }
  } catch (error) {
    console.error('Error in Custom generator:', error)
    throw error
  }
}

export default async function (tree: Tree, schema: GenerateCustomGeneratorSchema) {
  return customGeneratorLogic(tree, schema)
}

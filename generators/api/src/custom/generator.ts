import { formatFiles, installPackagesTask, Tree } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'
import { getPrismaSchemaPath, readPrismaSchema } from '@nestled/utils'
import { GenerateCustomGeneratorSchema } from './schema'
import { execSync } from 'child_process'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import pluralize from 'pluralize'

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

// Helper function to convert camelCase to kebab-case
function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
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

      // Create and return the model
      const modelData: ModelType = {
        name: model.name,
        pluralName: pluralize(model.name),
        fields,
        primaryField: model.fields.find((f) => !f.isId && f.type === 'String')?.name || 'name',
        modelName: model.name,
        modelPropertyName: singularPropertyName,
        pluralModelName: pluralize(model.name),
        pluralModelPropertyName: pluralPropertyName,
      }

      return modelData
    })
  } catch (error) {
    console.error('Error parsing Prisma schema:', error)
    return []
  }
}

async function createLibraries(tree: Tree, name: string) {
  // Create required libraries for custom extensions
  const dataAccessLibraryRoot = `libs/api/${name}/data-access`
  const dataAccessProjectName = `api-${name}-data-access`

  // Add feature library paths
  const featureLibraryRoot = `libs/api/${name}/feature`
  const featureProjectName = `api-${name}-feature`

  try {
    // First, try to remove the data-access library if it exists
    try {
      execSync(`nx g rm ${dataAccessProjectName} --forceRemove`, {
        stdio: 'inherit',
        cwd: tree.root,
      })
    } catch {
      // No existing library found
    }

    // Create the data-access library
    execSync(
      `nx g @nx/nest:library --name=${dataAccessProjectName} --directory=libs/api/${name}/data-access --tags=scope:api,type:data-access --linter=eslint --strict --no-interactive --unitTestRunner=jest --importPath=@${getNpmScope(
        tree,
      )}/api/${name}/data-access`,
      {
        stdio: 'inherit',
        cwd: tree.root,
      },
    )

    // Try to remove the feature library if it exists
    try {
      execSync(`nx g rm ${featureProjectName} --forceRemove`, {
        stdio: 'inherit',
        cwd: tree.root,
      })
    } catch {
      // No existing library found
    }

    // Create the feature library
    execSync(
      `nx g @nx/nest:library --name=${featureProjectName} --directory=libs/api/${name}/feature --tags=scope:api,type:feature --linter=eslint --strict --no-interactive --unitTestRunner=jest --importPath=@${getNpmScope(
        tree,
      )}/api/${name}/feature`,
      {
        stdio: 'inherit',
        cwd: tree.root,
      },
    )

    return { dataAccessLibraryRoot, featureLibraryRoot }
  } catch (error) {
    console.error('Error creating libraries:', error)
    throw error
  }
}

async function generateCustomFiles(
  tree: Tree,
  dataAccessLibraryRoot: string,
  featureLibraryRoot: string,
  models: ModelType[],
  npmScope: string,
  name: string,
) {
  // Generate custom service files for each model in data-access library
  for (const model of models) {
    const kebabModelName = toKebabCase(model.modelName)

    // Generate custom service file in data-access library
    const serviceContent = `import { Injectable } from '@nestjs/common'

@Injectable()
export class ${model.modelName}Service {
  // Empty for now; will override or extend later if needed
}
`
    const servicePath = `${dataAccessLibraryRoot}/src/lib/${kebabModelName}.service.ts`
    tree.write(servicePath, serviceContent)

    // Generate custom resolver file in feature library
    const resolverContent = `import { Generated${model.modelName}Resolver } from '${npmScope}/api/generated-crud/feature'
import { ${model.modelName}Service } from '${npmScope}/api/${name}/data-access'
import { Resolver } from '@nestjs/graphql'
import { Injectable } from '@nestjs/common'
import { ApiCrudDataAccessService } from '${npmScope}/api/generated-crud/data-access'

@Resolver()
@Injectable()
export class ${model.modelName}Resolver extends Generated${model.modelName}Resolver {
  constructor(
    private readonly customService: ${model.modelName}Service,
    private readonly generatedService: ApiCrudDataAccessService,
  ) {
    super(generatedService);
  }
  // Empty for now; will override or extend later if needed
}
`
    const resolverPath = `${featureLibraryRoot}/src/lib/${kebabModelName}.resolver.ts`
    tree.write(resolverPath, resolverContent)
  }

  // Generate data-access module file
  const dataAccessModuleContent = `import { Module } from '@nestjs/common'
import { ApiCoreDataAccessModule } from '${npmScope}/api/core/data-access'
${models
  .map((model) => `import { ${model.modelName}Service } from './${toKebabCase(model.modelName)}.service'`)
  .join('\n')}

@Module({
  imports: [ApiCoreDataAccessModule],
  providers: [
    ${models.map((model) => `${model.modelName}Service,`).join('\n    ')}
  ],
  exports: [
    ${models.map((model) => `${model.modelName}Service,`).join('\n    ')}
  ],
})
export class Api${name.charAt(0).toUpperCase() + name.slice(1)}DataAccessModule {}
`
  const dataAccessModulePath = `${dataAccessLibraryRoot}/src/lib/api-${name}-data-access.module.ts`
  tree.write(dataAccessModulePath, dataAccessModuleContent)

  // Generate feature module file
  const featureModuleContent = `import { Module } from '@nestjs/common'
import { Api${name.charAt(0).toUpperCase() + name.slice(1)}DataAccessModule } from '${npmScope}/api/${name}/data-access'
${models
  .map((model) => `import { ${model.modelName}Resolver } from './${toKebabCase(model.modelName)}.resolver'`)
  .join('\n')}

@Module({
  imports: [Api${name.charAt(0).toUpperCase() + name.slice(1)}DataAccessModule],
  providers: [
    ${models.map((model) => `${model.modelName}Resolver,`).join('\n    ')}
  ],
  exports: [
    ${models.map((model) => `${model.modelName}Resolver,`).join('\n    ')}
  ],
})
export class Api${name.charAt(0).toUpperCase() + name.slice(1)}FeatureModule {}
`
  const featureModulePath = `${featureLibraryRoot}/src/lib/api-${name}-feature.module.ts`
  tree.write(featureModulePath, featureModuleContent)

  // Generate data-access index.ts file
  const dataAccessIndexContent = `export * from './lib/api-${name}-data-access.module'
${models.map((model) => `export * from './lib/${toKebabCase(model.modelName)}.service'`).join('\n')}
`
  const dataAccessIndexPath = `${dataAccessLibraryRoot}/src/index.ts`
  tree.write(dataAccessIndexPath, dataAccessIndexContent)

  // Generate feature index.ts file
  const featureIndexContent = `export * from './lib/api-${name}-feature.module'
${models.map((model) => `export * from './lib/${toKebabCase(model.modelName)}.resolver'`).join('\n')}
`
  const featureIndexPath = `${featureLibraryRoot}/src/index.ts`
  tree.write(featureIndexPath, featureIndexContent)
}

export default async function (tree: Tree, schema: GenerateCustomGeneratorSchema) {
  try {
    // If a name is not provided, use the default value from schema.json
    const name = schema.name || 'custom'

    // Get all Prisma models
    const models = await getAllPrismaModels(tree)
    if (models.length === 0) {
      console.error('No Prisma models found')
      return
    }

    // Create libraries if they don't exist
    const { dataAccessLibraryRoot, featureLibraryRoot } = await createLibraries(tree, name)

    // Generate custom files
    const npmScope = `@${getNpmScope(tree)}`
    await generateCustomFiles(tree, dataAccessLibraryRoot, featureLibraryRoot, models, npmScope, name)

    // Format files
    await formatFiles(tree)

    return () => {
      installPackagesTask(tree)
    }
  } catch (error) {
    console.error('Error in Custom generator:', error)
    throw error
  }
}

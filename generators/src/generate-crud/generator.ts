import { formatFiles, generateFiles, installPackagesTask, joinPathFragments, names, Tree } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'
import { getPrismaSchemaPath, readPrismaSchema, updateTypeScriptConfigs } from '../shared/utils'
import { GenerateCrudGeneratorSchema } from './schema'
import { execSync } from 'child_process'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import pluralize from 'pluralize'

async function getAllPrismaModels(tree: Tree) {
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

      const modelObj = {
        name: model.name,
        pluralName: pluralize(model.name),
        fields,
        primaryField: model.fields.find((f) => !f.isId && f.type === 'String')?.name || 'name',
        // Add these properties that might be needed by the templates
        modelName: model.name,
        modelPropertyName: singularPropertyName,
        pluralModelName: pluralize(model.name),
        pluralModelPropertyName: pluralPropertyName,
      }
      console.log('Model object:', JSON.stringify(modelObj, null, 2))
      return modelObj
    })
  } catch (error) {
    console.error('Error parsing Prisma schema:', error)
    return []
  }
}

async function createLibraries(tree: Tree) {
  console.log(`Creating Generated CRUD libraries`)

  // Create a data-access library for generated-crud
  const dataAccessLibraryRoot = `libs/api/generated-crud/data-access`
  const dataAccessProjectName = 'api-crud-data-access'

  // Create a feature library for generated-crud
  const featureLibraryRoot = `libs/api/generated-crud/feature`
  const featureProjectName = 'api-crud-feature'

  try {
    // First, try to remove the data-access library if it exists
    try {
      execSync(`nx g rm ${dataAccessProjectName} --forceRemove`, {
        stdio: 'inherit',
        cwd: tree.root,
      })
      console.log(`Successfully removed existing ${dataAccessProjectName}`)
    } catch {
      console.log(`No existing ${dataAccessProjectName} found, continuing...`)
    }

    // Create the data-access library
    execSync(
      `nx g @nx/nest:library --name=${dataAccessProjectName} --directory=libs/api/generated-crud/data-access --tags=scope:api,type:data-access --linter=eslint --strict --no-interactive --unitTestRunner=jest --importPath=@${getNpmScope(
        tree,
      )}/api/generated-crud/data-access`,
      {
        stdio: 'inherit',
        cwd: tree.root,
      },
    )
    console.log(`Successfully created ${dataAccessProjectName}`)

    // Update TypeScript configurations for data-access library
    updateTypeScriptConfigs(tree, dataAccessLibraryRoot)

    // First, try to remove the feature library if it exists
    try {
      execSync(`nx g rm ${featureProjectName} --forceRemove`, {
        stdio: 'inherit',
        cwd: tree.root,
      })
      console.log(`Successfully removed existing ${featureProjectName}`)
    } catch {
      console.log(`No existing ${featureProjectName} found, continuing...`)
    }

    // Create the feature library
    execSync(
      `nx g @nx/nest:library --name=${featureProjectName} --directory=libs/api/generated-crud/feature --tags=scope:api,type:feature --linter=eslint --strict --no-interactive --unitTestRunner=jest --importPath=@${getNpmScope(
        tree,
      )}/api/generated-crud/feature`,
      {
        stdio: 'inherit',
        cwd: tree.root,
      },
    )
    console.log(`Successfully created ${featureProjectName}`)

    // Update TypeScript configurations for the feature library
    updateTypeScriptConfigs(tree, featureLibraryRoot)
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

async function generateModelFiles(
  tree: Tree,
  dataAccessLibraryRoot: string,
  featureLibraryRoot: string,
  models: Array<{
    name: string
    pluralName: string
    fields: ReadonlyArray<Record<string, unknown> & { name: string; type: string }>
    primaryField: string
    modelName: string
    modelPropertyName: string
    pluralModelName: string
    pluralModelPropertyName: string
  }>,
  name = 'generated-crud',
) {
  console.log(`Generating files for ${models.length} models`)
  console.log('Name parameter in generateModelFiles:', name)

  // Ensure a name is not undefined or empty
  if (!name) {
    console.log('Name parameter is empty, using default "generated-crud"')
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

  console.log('Final data access template substitutions:', {
    ...substitutions,
    models: substitutions.models.length,
  })

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

  // No longer creating public data-access files

  // Create feature module file for generated-crud
  const featureModuleContent = `import { Module } from '@nestjs/common'
import { ApiCrudDataAccessModule } from '@${getNpmScope(tree)}/api/generated-crud/data-access'
${models
  .map((model) => `import { Admin${model.modelName}Resolver } from './${toKebabCase(model.modelName)}.resolver'`)
  .join('\n')}

@Module({
  imports: [ApiCrudDataAccessModule],
  providers: [${models.map((model) => `Admin${model.modelName}Resolver`).join(', ')}],
})
export class ApiCrudFeatureModule {}
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
    console.log(`Creating resolver file for ${model.modelName} at ${resolverFilePath}`)

    const resolverContent = `import { Args, Mutation, Query, Resolver, Info } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import { GraphQLResolveInfo } from 'graphql'
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
import {
  GqlAuthAdminGuard,
} from '@${getNpmScope(tree)}/api/auth/util'

@Resolver(() => ${model.modelName})
export class Admin${model.modelName}Resolver {
  constructor(
    private readonly service: ApiCrudDataAccessService,
  ) {}

  @Query(() => [${model.modelName}], { nullable: true })
  @UseGuards(GqlAuthAdminGuard)
  ${(model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName).charAt(0).toLowerCase() + (model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName).slice(1)}(
    @Info() info: GraphQLResolveInfo,
    @Args({ name: 'input', type: () => List${model.modelName}Input, nullable: true }) input?: List${
      model.modelName
    }Input,
  ) {
    return this.service.${(model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName).charAt(0).toLowerCase() + (model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName).slice(1)}(info, input)
  }

  @Query(() => CorePaging, { nullable: true })
  @UseGuards(GqlAuthAdminGuard)
  ${(model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName).charAt(0).toLowerCase() + (model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName).slice(1)}Count(
    @Args({ name: 'input', type: () => List${model.modelName}Input, nullable: true }) input?: List${
      model.modelName
    }Input,
  ) {
    return this.service.${(model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName).charAt(0).toLowerCase() + (model.pluralModelName === model.modelName ? model.pluralModelName + 'List' : model.pluralModelName).slice(1)}Count(input)
  }

  @Query(() => ${model.modelName}, { nullable: true })
  @UseGuards(GqlAuthAdminGuard)
  ${model.modelName.charAt(0).toLowerCase() + model.modelName.slice(1)}(
    @Info() info: GraphQLResolveInfo,
    @Args('${model.modelPropertyName}Id') ${model.modelPropertyName}Id: string
  ) {
    return this.service.${model.modelName.charAt(0).toLowerCase() + model.modelName.slice(1)}(info, ${model.modelPropertyName}Id)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  @UseGuards(GqlAuthAdminGuard)
  create${model.modelName.charAt(0).toUpperCase() + model.modelName.slice(1)}(
    @Info() info: GraphQLResolveInfo,
    @Args('input') input: Create${model.modelName}Input,
  ) {
    return this.service.create${model.modelName.charAt(0).toUpperCase() + model.modelName.slice(1)}(info, input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  @UseGuards(GqlAuthAdminGuard)
  update${model.modelName.charAt(0).toUpperCase() + model.modelName.slice(1)}(
    @Info() info: GraphQLResolveInfo,
    @Args('${model.modelPropertyName}Id') ${model.modelPropertyName}Id: string,
    @Args('input') input: Update${model.modelName}Input,
  ) {
    return this.service.update${model.modelName.charAt(0).toUpperCase() + model.modelName.slice(1)}(info, ${model.modelPropertyName}Id, input)
  }

  @Mutation(() => Boolean, { nullable: true })
  @UseGuards(GqlAuthAdminGuard)
  delete${model.modelName.charAt(0).toUpperCase() + model.modelName.slice(1)}(
    @Args('${model.modelPropertyName}Id') ${model.modelPropertyName}Id: string,
  ) {
    return this.service.delete${model.modelName.charAt(0).toUpperCase() + model.modelName.slice(1)}(${model.modelPropertyName}Id)
  }
}
`

    tree.write(resolverFilePath, resolverContent)
  }
}

export default async function (tree: Tree, schema: GenerateCrudGeneratorSchema) {
  try {
    console.log('Starting CRUD generator')

    // If a name is not provided, set a default value
    if (!schema.name) {
      console.log('Name property is missing, setting default value "generated-crud"')
      schema.name = 'generated-crud'
    } else {
      console.log(`Using provided name: "${schema.name}"`)
    }

    // Get all Prisma models
    const models = await getAllPrismaModels(tree)
    if (models.length === 0) {
      console.error('No Prisma models found')
      return
    }

    console.log(`Found ${models.length} models`)

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

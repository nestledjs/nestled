import { formatFiles, installPackagesTask, Tree } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'
import { apiLibraryGenerator, getPrismaSchemaPath, readPrismaSchema } from '@nestled/utils'
import { GenerateExtendedGeneratorSchema } from './schema'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import pluralize from 'pluralize'
import { join } from 'path'

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

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
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
        ...field,
      }))
      return {
        name: model.name,
        pluralName: pluralize(model.name),
        fields,
        primaryField: model.fields.find((f) => !f.isId && f.type === 'String')?.name || 'name',
        modelName: model.name,
        modelPropertyName: singularPropertyName,
        pluralModelName: pluralize(model.name),
        pluralModelPropertyName: pluralPropertyName,
      }
    })
  } catch (error) {
    console.error('Error parsing Prisma schema:', error)
    return []
  }
}

async function generateModelLibrary(tree: Tree, model: ModelType, npmScope: string, overwrite: boolean) {
  const kebabModel = toKebabCase(model.modelName)
  const libName = kebabModel
  const libRoot = `libs/api/extended/${libName}`

  // Create the Nx library for this model
  await apiLibraryGenerator(tree, { name: `extended-${libName}`, overwrite }, '', undefined, false)

  // Generate service.ts
  const serviceContent = `import { Injectable } from '@nestjs/common'

@Injectable()
export class ${model.modelName}Service {
  // Empty for now; will override or extend later if needed
}
`
  tree.write(join(libRoot, 'src/lib', `${kebabModel}.service.ts`), serviceContent)

  // Generate resolver.ts
  const resolverContent = `import { ${model.modelName}Service } from './${kebabModel}.service'
import { ApiCrudDataAccessService } from '${npmScope}/api/generated-crud/data-access'
import { Generated${model.modelName}Resolver } from '${npmScope}/api/generated-crud/feature'
import { Injectable } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { ${model.modelName} } from '${npmScope}/api/core/models'

@Resolver(() => ${model.modelName})
@Injectable()
export class ${model.modelName}Resolver extends Generated${model.modelName}Resolver {
  constructor(
    private readonly customService: ${model.modelName}Service,
    private readonly generatedService: ApiCrudDataAccessService,
  ) {
    super(generatedService)
  }
}
`
  tree.write(join(libRoot, 'src/lib', `${kebabModel}.resolver.ts`), resolverContent)

  // Generate module.ts
  const moduleContent = `import { Module } from '@nestjs/common'
import { ${model.modelName}Service } from './${kebabModel}.service'
import { ${model.modelName}Resolver } from './${kebabModel}.resolver'

@Module({
  providers: [${model.modelName}Service, ${model.modelName}Resolver],
  exports: [${model.modelName}Service, ${model.modelName}Resolver],
})
export class ${model.modelName}Module {}
`
  tree.write(join(libRoot, 'src/lib', `${kebabModel}.module.ts`), moduleContent)

  // Update index.ts to export the module
  const indexContent = `export * from './lib/${kebabModel}.module'`
  tree.write(join(libRoot, 'src/index.ts'), indexContent)

  // Optionally, add to app.module.ts or other registration logic here
  // addToModules({ ... })
}

export default async function (tree: Tree, schema: GenerateExtendedGeneratorSchema) {
  try {
    // Ensure the extended folder exists (not an Nx project)
    const extendedRoot = 'libs/api/extended'
    if (!tree.exists(extendedRoot)) {
      tree.write(join(extendedRoot, '.gitkeep'), '')
    }

    // Get all Prisma models
    const models = await getAllPrismaModels(tree)
    if (models.length === 0) {
      console.error('No Prisma models found')
      return
    }

    const npmScope = `@${getNpmScope(tree)}`
    const overwrite = !!schema.overwrite

    // For each model, generate a library and custom files
    for (const model of models) {
      await generateModelLibrary(tree, model, npmScope, overwrite)
    }

    await formatFiles(tree)
    return () => {
      installPackagesTask(tree)
    }
  } catch (error) {
    console.error('Error in Extended generator:', error)
    throw error
  }
} 
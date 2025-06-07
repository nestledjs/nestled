import { formatFiles, Tree, installPackagesTask } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'
import { getPrismaSchemaPath, readPrismaSchema } from '../shared/utils'
import { PrismaCrudGeneratorSchema } from './schema'
import apiCrudGenerator from '../api-crud/generator'

// Add scope filter to ensure we only process libs/api
const API_LIBS_SCOPE = 'libs/api'

async function getAllPrismaModels(tree: Tree) {
  const prismaPath = getPrismaSchemaPath(tree)
  const prismaSchema = readPrismaSchema(tree, prismaPath)
  if (!prismaSchema) {
    console.error(`No Prisma schema found at ${prismaPath}`)
    return []
  }

  try {
    const dmmf = await getDMMF({ datamodel: prismaSchema })
    return dmmf.datamodel.models.map(model => ({
      name: model.name,
      fields: model.fields,
      primaryField: model.fields.find(f => !f.isId && f.type === 'String')?.name || 'name'
    }))
  } catch (error) {
    console.error('Error parsing Prisma schema:', error)
    return []
  }
}

async function generateModelCrud(tree: Tree, model: any) {
  console.log(`Generating CRUD libraries for model: ${model.name}`)

  // Create libs/api directory if it doesn't exist
  if (!tree.exists(API_LIBS_SCOPE)) {
    tree.write(`${API_LIBS_SCOPE}/.gitkeep`, '')
  }

  try {
    // Generate both data-access and feature libraries
    await apiCrudGenerator(tree, {
      name: model.name.toLowerCase(),
      model: model.name,
      primaryField: model.primaryField,
      directory: 'api',
      searchFields: model.fields
        .filter(f => f.type === 'String' && !f.isId)
        .map(f => f.name)
        .join(',')
    })

    // Wait for files to be properly created
    await new Promise((resolve) => setTimeout(resolve, 2000))

  } catch (error) {
    console.error(`Error generating CRUD libraries for model ${model.name}:`, error)
    // Try to recover by waiting a bit longer and retrying once
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000))
      await apiCrudGenerator(tree, {
        name: model.name.toLowerCase(),
        model: model.name,
        primaryField: model.primaryField,
        directory: 'api',
        searchFields: model.fields
          .filter(f => f.type === 'String' && !f.isId)
          .map(f => f.name)
          .join(',')
      })
    } catch (retryError) {
      console.error(`Failed retry for model ${model.name}:`, retryError)
      throw retryError
    }
  }
}

export default async function (tree: Tree, schema: PrismaCrudGeneratorSchema) {
  const models = await getAllPrismaModels(tree)
  
  if (models.length === 0) {
    console.error('No models found in Prisma schema')
    return
  }

  console.log(`Found ${models.length} models in Prisma schema`)
  
  // Generate CRUD libraries for each model sequentially
  for (const model of models) {
    await generateModelCrud(tree, model)
  }

  await formatFiles(tree)

  return () => {
    installPackagesTask(tree)
    console.log('🎉 Successfully generated CRUD libraries for all Prisma models!')
    console.warn('Run "pnpm prisma:apply" and restart the API to see changes')
  }
} 
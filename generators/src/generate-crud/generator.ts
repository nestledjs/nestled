import { formatFiles, Tree, installPackagesTask, generateFiles, joinPathFragments, names, readProjectConfiguration } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'
import { getPrismaSchemaPath, readPrismaSchema } from '../shared/utils'
import { GenerateCrudGeneratorSchema } from './schema'
import { execSync } from 'child_process'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'

// Library names for the generated CRUD libraries
const FEATURE_LIBRARY = 'api-crud-feature'
const DATA_ACCESS_LIBRARY = 'api-crud-data-access'

async function getAllPrismaModels(tree: Tree) {
  const prismaPath = getPrismaSchemaPath(tree)
  const prismaSchema = readPrismaSchema(tree, prismaPath)
  if (!prismaSchema) {
    console.error(`No Prisma schema found at ${prismaPath}`)
    return []
  }

  try {
    const dmmf = await getDMMF({ datamodel: prismaSchema })
    const models = dmmf.datamodel.models.map(model => {
      const modelObj = {
        name: model.name,
        fields: model.fields,
        primaryField: model.fields.find(f => !f.isId && f.type === 'String')?.name || 'name',
        // Add these properties that might be needed by the templates
        modelName: model.name,
        modelPropertyName: model.name.charAt(0).toLowerCase() + model.name.slice(1)
      };
      console.log('Model object:', JSON.stringify(modelObj, null, 2));
      return modelObj;
    });
    return models;
  } catch (error) {
    console.error('Error parsing Prisma schema:', error)
    return []
  }
}

async function createLibraries(tree: Tree) {
  console.log(`Creating Generated CRUD libraries`)

  // Create feature library
  const featureLibraryRoot = `libs/api/generated-crud/feature`
  const featureProjectName = 'api-crud-feature'
  
  try {
    // First try to remove the library if it exists
    try {
      execSync(
        `nx g rm ${featureProjectName} --forceRemove`,
        {
          stdio: 'inherit',
          cwd: tree.root,
        }
      )
      console.log(`Successfully removed existing ${featureProjectName}`)
    } catch (removeError) {
      console.log(`No existing ${featureProjectName} found, continuing...`)
    }

    // Create the feature library
    execSync(
      `nx g @nx/nest:library --name=${featureProjectName} --directory=libs/api/generated-crud/feature --tags=scope:api,type:feature --linter=eslint --strict --no-interactive --unitTestRunner=jest --importPath=@${getNpmScope(tree)}/api/generated-crud/feature`,
      {
        stdio: 'inherit',
        cwd: tree.root,
      }
    )
    console.log(`Successfully created ${featureProjectName}`)
  } catch (error) {
    console.error('Error creating feature library:', error)
    throw error
  }

  // Create data-access library
  const dataAccessLibraryRoot = `libs/api/generated-crud/data-access`
  const dataAccessProjectName = 'api-crud-data-access'
  
  try {
    // First try to remove the library if it exists
    try {
      execSync(
        `nx g rm ${dataAccessProjectName} --forceRemove`,
        {
          stdio: 'inherit',
          cwd: tree.root,
        }
      )
      console.log(`Successfully removed existing ${dataAccessProjectName}`)
    } catch (removeError) {
      console.log(`No existing ${dataAccessProjectName} found, continuing...`)
    }

    // Create the data-access library
    execSync(
      `nx g @nx/nest:library --name=${dataAccessProjectName} --directory=libs/api/generated-crud/data-access --tags=scope:api,type:data-access --linter=eslint --strict --no-interactive --unitTestRunner=jest --importPath=@${getNpmScope(tree)}/api/generated-crud/data-access`,
      {
        stdio: 'inherit',
        cwd: tree.root,
      }
    )
    console.log(`Successfully created ${dataAccessProjectName}`)
  } catch (error) {
    console.error('Error creating data-access library:', error)
    throw error
  }

  return { featureLibraryRoot, dataAccessLibraryRoot }
}

async function generateModelFiles(tree: Tree, featureLibraryRoot: string, dataAccessLibraryRoot: string, models: { name: string; fields: readonly { name: string; type: string }[]; primaryField: string; modelName: string; modelPropertyName: string }[], name = 'generated-crud') {
  console.log(`Generating files for ${models.length} models`)
  console.log('Name parameter in generateModelFiles:', name)

  // Ensure name is not undefined or empty
  if (!name) {
    console.log('Name parameter is empty, using default "generated-crud"')
    name = 'generated-crud'
  }

  // Generate service files in data-access library
  // Ensure we have valid values for template substitutions
  const nameObj = names(name || 'generated-crud');
  const substitutions = {
    name: name || 'generated-crud',
    models,
    npmScope: `@${getNpmScope(tree)}`,
    apiClassName: 'PrismaCrud',
    ...nameObj,
    tmpl: '',
    type: 'data-access',
  };

  console.log('Final data access template substitutions:', {
    ...substitutions,
    models: substitutions.models.length,
  });

  // Generate the service file with the new name
  generateFiles(
    tree,
    joinPathFragments(__dirname, './files/data-access/src/lib'),
    joinPathFragments(dataAccessLibraryRoot, 'src/lib'),
    {
      ...substitutions,
    }
  )

  // Generate resolver files in feature library
  // Reuse the same nameObj to ensure consistency
  const featureSubstitutions = {
    name: name || 'generated-crud',
    models,
    npmScope: `@${getNpmScope(tree)}`,
    apiClassName: 'PrismaCrud',
    ...nameObj,
    tmpl: '',
    type: 'feature',
  };

  console.log('Final feature template substitutions:', {
    ...featureSubstitutions,
    models: featureSubstitutions.models.length,
  });

  // Generate the resolver file with the new name
  generateFiles(
    tree,
    joinPathFragments(__dirname, './files/feature/src/lib'),
    joinPathFragments(featureLibraryRoot, 'src/lib'),
    {
      ...featureSubstitutions,
    }
  )
}

export default async function(tree: Tree, schema: GenerateCrudGeneratorSchema) {
  try {
    console.log('Starting CRUD generator')

    // If name is not provided, set a default value
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
    const { featureLibraryRoot, dataAccessLibraryRoot } = await createLibraries(tree)

    // Generate model files with the provided name or default to 'generated-crud'
    await generateModelFiles(tree, featureLibraryRoot, dataAccessLibraryRoot, models, schema.name || 'generated-crud')

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

import {
  formatFiles,
  generateFiles,
  installPackagesTask,
  joinPathFragments,
  names,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit'
import * as workspace from '@nx/workspace'
import { projectRootDir } from '@nx/workspace'
import { getPrismaSchemaPath, parsePrismaSchema, readPrismaSchema } from '../shared/utils'
import { execSync } from 'child_process'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'

function normalizeOptions(tree, options, projectType, type: string) {
  const directoryName = options.directory ? names(options.directory).fileName : ''
  const name = names(options.name).fileName
  const projectDirectory = directoryName ? `${directoryName}/${name}/${type}` : `${name}/${type}`
  const projectName = `${directoryName}-${name}-${type}`.replace(/\//g, '-')
  const projectRoot = `${projectRootDir(projectType)}/${projectDirectory}`

  return {
    ...options,
    npmScope: `@${getNpmScope(tree)}`,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags: options.tags?.split(',').map((tag) => tag.trim()) ?? [],
    apiAppName: options.apiAppName,
    webAppName: options.webAppName,
    name: names(options.name).fileName,
  }
}

interface ApiCrud {
  name?: string
  model?: string
  plural?: string
  primaryField?: string
  webAppName?: string
  tags?: string
  directory?: string
  searchFields?: string
}

async function apiCrudGenerator(tree: Tree, schema: ApiCrud, type: string) {
  const normalizedOptions = normalizeOptions(tree, schema, workspace.ProjectType.Library, type)
  const filePath = `libs/${normalizedOptions.projectDirectory}`
  const projectName = normalizedOptions.projectName

  try {
    // Check if project already exists
    try {
      const existingConfig = readProjectConfiguration(tree, projectName)
      if (existingConfig) {
        console.log(`Project ${projectName} already exists, skipping library generation`)
        return
      }
    } catch (e) {
      // Project doesn't exist, continue with creation
    }

    // Run the Nx generator command directly
    execSync(
      `nx g @nx/nest:library --name=${projectName} --directory=${filePath} --tags=scope:${schema.directory},type:${type} --linter=eslint --strict --no-interactive --unitTestRunner=vitest`,
      {
        stdio: 'inherit',
        cwd: tree.root,
      },
    )

    // Wait a bit for files to be created and project.json to be updated
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const libraryRoot = readProjectConfiguration(tree, projectName).root
    const modelName = schema.model || schema.name
    const pluralName = schema.plural || `${modelName}s`
    const formattedSearchFields = schema?.searchFields ? "'" + schema?.searchFields?.split(',').join("','") + "'" : ''
    let modelFields = null
    if (type === 'data-access') {
      modelFields = await createModelFromPrisma(tree, names(modelName).className)
      console.log({ modelFields })

      if (!modelFields) {
        console.error(`Model fields not created correctly`)
        return
      }
    }
    const variables = {
      ...schema,
      ...names(schema.name),
      npmScope: normalizedOptions.npmScope,
      apiClassName: names(schema.directory).className,
      modelName,
      modelClassName: names(modelName).className,
      modelPropertyName: names(modelName).propertyName,
      pluralName,
      pluralClassName: names(pluralName).className,
      pluralPropertyName: names(pluralName).propertyName,
      projectName,
      projectClassName: names(projectName).className,
      projectPropertyName: names(projectName).propertyName,
      tmpl: '',
      filePath,
      type,
      typeClassName: names(type).className,
      searchFields: formattedSearchFields,
      modelFields,
    }

    generateFiles(tree, joinPathFragments(__dirname, `./files/${type}`), libraryRoot, variables)
    await formatFiles(tree)
    return () => {
      installPackagesTask(tree)
    }
  } catch (error) {
    console.error(`Error generating CRUD libraries for model ${schema.name}:`, error)
    throw error
  }
}

async function createModelFromPrisma(tree, modelName: string) {
  const prismaPath = getPrismaSchemaPath(tree)
  const prismaSchema = readPrismaSchema(tree, prismaPath)
  if (!prismaSchema) {
    console.error(`No Prisma schema found at ${prismaPath}`)
    return
  }
  return await parsePrismaSchema(prismaSchema, modelName)
}

function updatePrisma(tree, options) {
  const prismaPath = getPrismaSchemaPath(tree)
  const schema = readPrismaSchema(tree, prismaPath)
  if (!schema) {
    console.error(`No Prisma schema found at ${prismaPath}`)
    return
  }
  const modelName = options.model || options.name
  const primaryField = options.primaryField || 'name'
  const modelIdentifier = `model ${names(modelName).className}`

  if (schema && !schema.includes(modelIdentifier + ' {')) {
    const modelDefinition = [
      `${modelIdentifier} {`,
      `  id        String   @id @default(cuid())`,
      `  createdAt DateTime @default(now())`,
      `  updatedAt DateTime @updatedAt`,
      `  ${primaryField} String`,
      '}',
    ].join('\n')

    tree.overwrite(prismaPath, [schema, modelDefinition, ''].join('\n\n'))
    console.info(`Add ${modelIdentifier} to ${prismaPath}`)
  }
}

function addImport(tree, options) {
  const normalizedOptions = normalizeOptions(
    tree,
    { ...options, directory: options.directory || 'api', name: options.name },
    workspace.ProjectType.Library,
    'data-access',
  )
  const coreFeaturePath = `apps/${normalizedOptions.directory}/src/app/app.module.ts`

  if (!tree.exists(coreFeaturePath)) {
    console.error(`Can't find ${coreFeaturePath}`)
    return
  }

  console.info(`Found ${coreFeaturePath}`)

  const coreFeatureContents = tree.read(coreFeaturePath)?.toString()

  if (coreFeatureContents) {
    const appClassName = names(normalizedOptions.directory).className
    const nameClassName = names(normalizedOptions.name).className
    const searchImport = `// Add Imports Here`
    const featureImport = `import { ${appClassName}${nameClassName}FeatureModule } from '${normalizedOptions.npmScope}/${normalizedOptions.directory}/${normalizedOptions.name}/feature'`
    const searchModule = `// Add Modules Here`
    const featureModule = `    ${appClassName}${nameClassName}FeatureModule,`

    const updatedContents = coreFeatureContents
      .replace(searchImport, [featureImport, searchImport].join('\n'))
      .replace(searchModule, [featureModule, searchModule].join('\n'))

    tree.overwrite(coreFeaturePath, updatedContents)
  }
}

export default async function (tree: Tree, schema: ApiCrud) {
  await apiCrudGenerator(tree, schema, 'data-access')
  await apiCrudGenerator(tree, schema, 'feature')
  updatePrisma(tree, schema)
  addImport(tree, schema)
  console.warn(`Run 'pnpm prisma:apply' and restart the API`)
}

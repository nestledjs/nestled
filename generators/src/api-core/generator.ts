import { formatFiles, installPackagesTask, joinPathFragments, readJson, Tree } from '@nx/devkit'
import { execSync } from 'child_process'
import { generateTemplateFiles, getNpmScope, installPlugins } from '../shared/utils'
import { ApiCoreGeneratorSchema } from './schema'

// Add scope filter to ensure we only process libs/api
const API_LIBS_SCOPE = 'libs/api'

function addImport(tree: Tree, name: string, type: string) {
  const coreFeaturePath = `apps/api/src/app.module.ts`

  if (!tree.exists(coreFeaturePath)) {
    console.error(`Can't find ${coreFeaturePath}`)
    return
  }

  const npmScope = getNpmScope(tree)
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1)
  const moduleToAdd = `Api${capitalizedName}${type.charAt(0).toUpperCase() + type.slice(1)}Module`
  const importPath = `@${npmScope}/api/${name}/${type}`

  let fileContent = tree.read(coreFeaturePath)?.toString() || ''

  // Add import statement if it doesn't exist
  if (!fileContent.includes(`import { ${moduleToAdd} }`)) {
    const importStatement = `import { ${moduleToAdd} } from '${importPath}';\n`
    fileContent = importStatement + fileContent
  }

  // Find the exact position of the appModules array
  const arrayStart = fileContent.indexOf('export const appModules = [')

  if (arrayStart !== -1) {
    // Find the closing bracket of the array
    const arrayEnd = fileContent.indexOf('];', arrayStart)

    if (arrayEnd !== -1) {
      // Get just the array content
      const arrayContent = fileContent.slice(arrayStart + 'export const appModules = ['.length, arrayEnd)

      // Check if module exists only in the array content
      if (!arrayContent.includes(moduleToAdd)) {
        // If array is empty, don't add a leading comma
        const isEmpty = arrayContent.trim() === ''
        const moduleEntry = isEmpty ? `\n  ${moduleToAdd}` : `,\n  ${moduleToAdd}`

        // Insert the new module just before the closing bracket
        const before = fileContent.slice(0, arrayEnd)
        const after = fileContent.slice(arrayEnd)
        fileContent = before + moduleEntry + after
      }
    }
  }

  // Clean up the array formatting if needed
  const arrayRegex = /export const appModules = \[([\s\S]*?)\];/
  const match = fileContent.match(arrayRegex)
  if (match) {
    const modules = match[1]
      .split(',')
      .map((m) => m.trim())
      .filter((m) => m.length > 0)
    const formattedArray = `export const appModules = [\n  ${modules.join(',\n  ')}\n];`
    fileContent = fileContent.replace(arrayRegex, formattedArray)
  }

  tree.write(coreFeaturePath, fileContent)
}

async function generateCore(tree: Tree, schema: ApiCoreGeneratorSchema, type: string) {
  const npmScope = getNpmScope(tree)
  const libraryRoot = joinPathFragments(API_LIBS_SCOPE, schema.name, type)
  const libraryName = `api-${schema.name}-${type}`
  const importPath = `@${npmScope}/api/${schema.name}/${type}`

  // Create libs/api directory if it doesn't exist
  if (!tree.exists(API_LIBS_SCOPE)) {
    tree.write(joinPathFragments(API_LIBS_SCOPE, '.gitkeep'), '')
  }

  // Run the Nx generator command directly
  execSync(
    `nx g @nx/nest:library --name=${libraryName} --directory=${libraryRoot} --importPath=${importPath} --tags=scope:api,type:${type} --strict --no-interactive --linter=eslint --unitTestRunner=jest`,
    {
      stdio: 'inherit',
      cwd: tree.root,
    },
  )

  // Wait a bit for files to be created
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Generate the template files on top of the Nx-generated structure
  generateTemplateFiles({
    tree,
    schema,
    libraryRoot,
    type,
    templatePath: joinPathFragments(__dirname, '../api-files'),
    npmScope,
  })

  if (type === 'data-access') {
    // Add specific dependencies for core data-access
    const dependencies = {
      'graphql-type-json': '^0.3.2',
      'graphql-subscriptions': '^2.0.0',
      '@nestjs/graphql': '^12.0.0',
      '@nestjs/common': '^10.0.0',
      '@nestjs/apollo': '^12.0.0',
      '@prisma/client': '^5.0.0',
    }

    const devDependencies = {}

    // Update package.json
    const packageJson = readJson(tree, 'package.json')

    // Add prisma schema path
    packageJson.prisma = {
      schema: 'libs/api/core/data-access/src/prisma/schema.prisma',
      seed: 'ts-node libs/api/core/data-access/src/prisma/seed.ts',
    }

    tree.write('package.json', JSON.stringify(packageJson, null, 2))

    // Use the shared installPlugins utility to install the necessary packages
    await installPlugins(tree, dependencies, devDependencies)
  }

  // Add the module import for feature
  if (type === 'feature') {
    addImport(tree, schema.name, type)
  }
}

export default async function (tree: Tree, schema: ApiCoreGeneratorSchema) {
  // Generate both data-access and feature libraries for core
  await generateCore(tree, schema, 'data-access')
  await generateCore(tree, schema, 'feature')

  await formatFiles(tree)

  return () => {
    installPackagesTask(tree)
  }
}

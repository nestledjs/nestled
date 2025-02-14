import { addDependenciesToPackageJson, joinPathFragments, readJson, Tree } from '@nx/devkit'
import { parseSchema, DMMF } from 'prisma-datamodel'

export function deleteFiles(tree: Tree, filesToDelete: string[]) {
  filesToDelete.forEach((file) => {
    if (tree.exists(file)) {
      tree.delete(file)
    }
  })
}

// List of files to delete
// const filesToDelete = [
//   // Add any other files you want to delete
// ]

// Delete unwanted files
// deleteFiles(tree, filesToDelete)

export function deleteDirectory(tree: Tree, dirPath: string) {
  if (tree.exists(dirPath)) {
    tree.children(dirPath).forEach((child) => {
      const childPath = joinPathFragments(dirPath, child)
      if (tree.isFile(childPath)) {
        tree.delete(childPath)
      } else {
        deleteDirectory(tree, childPath)
      }
    })
    tree.delete(dirPath)
  }
}

// List of directories to delete
// const directoriesToDelete = [
//   // Add any other directories you want to delete
// ]
// Delete unwanted directories
// directoriesToDelete.forEach((dir) => deleteDirectory(tree, dir))

// Optionally, update package.json or other configuration files
// updateJson(tree, 'apps/your-app/package.json', (json) => {
//   // Remove unwanted scripts, dependencies, etc.
//   delete json.scripts.someUnwantedScript;
//   delete json.dependencies.someUnwantedDependency;
//   return json;
// });

export function endsWithQuestionMark(str) {
  return /\?$/.test(str)
}

export function removeQuestionMarkAtEnd(str) {
  return str.replace(/\?$/, '')
}

export function getPrismaSchemaPath(tree) {
  const packageJsonContent = tree.read('package.json')
  if (!packageJsonContent) {
    console.error("Can't find package.json")
    return null
  }

  const packageJson = JSON.parse(packageJsonContent.toString())
  return packageJson.prisma?.schema
}

export function readPrismaSchema(tree, prismaPath) {
  if (!prismaPath) {
    console.error('Prisma schema path is not provided')
    return null
  }

  const prismaSchemaContent = tree.read(prismaPath)
  if (!prismaSchemaContent) {
    console.error(`Can't read the schema at ${prismaPath}`)
    return null
  }

  return prismaSchemaContent.toString()
}

export function mapPrismaTypeToNestJsType(prismaType: string) {
  const typeMap: Record<string, string> = {
    String: 'string',
    Boolean: 'boolean',
    Int: 'number',
    BigInt: 'bigint',
    Float: 'number',
    Decimal: 'number',
    DateTime: 'Date',
    Json: 'Record<string, any>',
    Bytes: 'Buffer',
  }

  return typeMap[prismaType] || prismaType
}

export function parsePrismaSchema(schemaContent: string, modelName: string) {
  try {
    const schema = parseSchema(schemaContent)
    const model = schema.models.find(m => m.name === modelName)
    
    if (!model) {
      return null
    }

    return model.fields.map(field => ({
      name: field.name,
      type: mapPrismaTypeToNestJsType(field.type),
      optional: !field.isRequired
    }))
  } catch (error) {
    console.error('Error parsing Prisma schema:', error)
    return null
  }
}

/**
 * Checks if a dependency is already present in package.json.
 *
 * @param tree - The Nx virtual file system.
 * @param packageName - The name of the package to check.
 * @returns true if the package is already installed, false otherwise.
 */
function isPackageInstalled(tree: Tree, packageName: string): boolean {
  const packageJson = readJson(tree, 'package.json')
  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  }
  return !!allDependencies[packageName]
}

/**
 * Installs dependencies and devDependencies in the package.json file,
 * and configures Nx project graph plugins when appropriate.
 *
 * @param tree - The Nx Tree object (virtual filesystem).
 * @param dependencies - An object containing the dependencies to be added.
 * @param devDependencies - An object containing the devDependencies to be added.
 * @param options - Additional options for plugin configuration
 */
export async function installPlugins(
  tree: Tree,
  dependencies: Record<string, string> = {},
  devDependencies: Record<string, string> = {},
  options: {
    configureProjectGraph?: boolean;
    pluginNames?: string[];
  } = {}
) {
  const depsToInstall: Record<string, string> = {}
  const devDepsToInstall: Record<string, string> = {}

  // Filter dependencies that are not yet installed
  for (const [pkg, version] of Object.entries(dependencies)) {
    if (!isPackageInstalled(tree, pkg)) {
      depsToInstall[pkg] = version
    }
  }

  // Filter devDependencies that are not yet installed
  for (const [pkg, version] of Object.entries(devDependencies)) {
    if (!isPackageInstalled(tree, pkg)) {
      devDepsToInstall[pkg] = version
    }
  }

  // If there are new dependencies to install, add them to package.json
  if (Object.keys(depsToInstall).length || Object.keys(devDepsToInstall).length) {
    return addDependenciesToPackageJson(tree, depsToInstall, devDepsToInstall)
  }

  return () => undefined // Return a no-op function instead of empty arrow function
}

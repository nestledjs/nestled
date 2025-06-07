import { addDependenciesToPackageJson, generateFiles, joinPathFragments, names, readJson, Tree, updateJson } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'

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

  // Check if the path exists
  if (!tree.exists(prismaPath)) {
    console.error(`Path does not exist: ${prismaPath}`)
    return null
  }

  // Check if the path is a directory
  const isDirectory = !tree.isFile(prismaPath)

  if (isDirectory) {
    // If it's a directory, read all .prisma files and concatenate them
    console.log(`Reading Prisma schema from directory: ${prismaPath}`)
    const schemaFiles = tree.children(prismaPath).filter(file => file.endsWith('.prisma'))

    if (schemaFiles.length === 0) {
      console.error(`No .prisma files found in directory: ${prismaPath}`)
      return null
    }

    // Concatenate all schema files
    let combinedSchema = ''
    for (const file of schemaFiles) {
      const filePath = `${prismaPath}/${file}`
      const fileContent = tree.read(filePath)
      if (fileContent) {
        combinedSchema += fileContent.toString() + '\n'
      } else {
        console.warn(`Could not read file: ${filePath}`)
      }
    }

    if (!combinedSchema) {
      console.error(`Could not read any schema files from directory: ${prismaPath}`)
      return null
    }

    return combinedSchema
  } else {
    // If it's a file, read it directly
    const prismaSchemaContent = tree.read(prismaPath)
    if (!prismaSchemaContent) {
      console.error(`Can't read the schema at ${prismaPath}`)
      return null
    }

    return prismaSchemaContent.toString()
  }
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

export async function parsePrismaSchema(schemaContent: string, modelName: string) {
  try {
    const dmmf = await getDMMF({ datamodel: schemaContent })
    const model = dmmf.datamodel.models.find((m) => m.name === modelName)

    if (!model) {
      return null
    }

    return model.fields.map((field) => ({
      name: field.name,
      type: mapPrismaTypeToNestJsType(field.type),
      optional: !field.isRequired,
    }))
  } catch (error) {
    console.error('Error parsing Prisma schema:', error)
    return null
  }
}

interface GenerateTemplateOptions {
  tree: Tree
  schema: any
  libraryRoot: string
  templatePath: string
  npmScope: string
}

export function getNpmScope(tree: Tree): string {
  const packageJson = readJson(tree, 'package.json')
  const { name } = packageJson

  const match = name.match(/@([^/]+)/)
  if (!match) {
    throw new Error('No npm scope found in package.json name')
  }

  return match[1] // Returns just "nestled" from "@nestled/source"
}

export function generateTemplateFiles({
  tree,
  schema,
  libraryRoot,
  templatePath,
  npmScope,
}: GenerateTemplateOptions): void {
  const variables = {
    ...schema,
    ...names(`${schema.name}`),
    npmScope,
    tmpl: '',
  }

  generateFiles(tree, templatePath, libraryRoot, variables)
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
    configureProjectGraph?: boolean
    pluginNames?: string[]
  } = {},
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

/**
 * Updates tsconfig.base.json to include a new library path
 * @param tree The file system tree
 * @param importPath The import path for the library (e.g. @myorg/my-lib)
 * @param libraryRoot The root path of the library (e.g. libs/my-lib)
 */
export function updateTsConfigPaths(tree: Tree, importPath: string, libraryRoot: string): void {
  updateJson(tree, 'tsconfig.base.json', (json) => {
    if (!json.compilerOptions) {
      json.compilerOptions = {};
    }
    if (!json.compilerOptions.paths) {
      json.compilerOptions.paths = {};
    }
    json.compilerOptions.paths[importPath] = [`${libraryRoot}/src/index.ts`];
    return json;
  });
}

export function updateTypeScriptConfigs(tree: Tree, libraryRoot: string): void {
  // Update library's tsconfig.json
  const libTsConfigPath = joinPathFragments(libraryRoot, 'tsconfig.json')
  if (tree.exists(libTsConfigPath)) {
    updateJson(tree, libTsConfigPath, (json) => {
      json.compilerOptions = {
        ...json.compilerOptions,
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
        strictFunctionTypes: true,
        strictBindCallApply: true,
        strictPropertyInitialization: true,
        noImplicitThis: true,
        alwaysStrict: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      }
      return json
    })
  }

  // Update library's tsconfig.lib.json
  const libTsConfigLibPath = joinPathFragments(libraryRoot, 'tsconfig.lib.json')
  if (tree.exists(libTsConfigLibPath)) {
    updateJson(tree, libTsConfigLibPath, (json) => {
      json.compilerOptions = {
        ...json.compilerOptions,
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        outDir: '../../../dist/out-tsc',
        declaration: true,
        types: ['node'],
        target: 'es2021',
      }
      json.include = ['src/**/*.ts']
      json.exclude = ['jest.config.ts', '**/*.spec.ts', '**/*.test.ts']
      return json
    })
  }

  // Update library's tsconfig.spec.json
  const libTsConfigSpecPath = joinPathFragments(libraryRoot, 'tsconfig.spec.json')
  if (tree.exists(libTsConfigSpecPath)) {
    updateJson(tree, libTsConfigSpecPath, (json) => {
      json.compilerOptions = {
        ...json.compilerOptions,
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        outDir: '../../../dist/out-tsc',
        types: ['jest', 'node']
      }
      json.include = ['jest.config.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/*.d.ts']
      return json
    })
  }
}

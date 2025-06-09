import {
  addDependenciesToPackageJson,
  generateFiles,
  GeneratorCallback,
  installPackagesTask,
  joinPathFragments,
  names,
  readJson,
  Tree,
  updateJson,
} from '@nx/devkit'
import { execSync } from 'child_process'
import { getDMMF } from '@prisma/internals'
import * as yaml from 'yaml'
import {
  AddToModulesOptions,
  ApiLibraryGeneratorSchema,
  CrudAuthConfig,
  GenerateTemplateOptions,
  ModelType,
} from './generator-types'
import { libraryGenerator } from '@nx/nest/src/generators/library/library'

export function removeWorkspacesFromPackageJson(tree: Tree): void {
  const packageJsonPath = 'package.json'
  if (tree.exists(packageJsonPath)) {
    updateJson(tree, packageJsonPath, (json) => {
      if (json.workspaces) {
        delete json.workspaces
      }
      return json
    })
  }
}

export function addScriptToPackageJson(tree: Tree, scriptName: string, scriptCommand: string): void {
  const packageJsonPath = 'package.json'
  if (tree.exists(packageJsonPath)) {
    updateJson(tree, packageJsonPath, (json) => {
      json.scripts = json.scripts ?? {}
      json.scripts[scriptName] = scriptCommand
      return json
    })
  }
}

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
  return packageJson.prisma?.schema || null
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
    const schemaFiles = tree.children(prismaPath).filter((file) => file.endsWith('.prisma'))

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
 * @param importPath The import path for the library (e.g., @org/my-lib)
 * @param libraryRoot The root path of the library (e.g., libs/my-lib)
 */
export function updateTsConfigPaths(tree: Tree, importPath: string, libraryRoot: string): void {
  const tsConfigPath = 'tsconfig.base.json'
  if (tree.exists(tsConfigPath)) {
    updateJson(tree, tsConfigPath, (json) => {
      if (!json.compilerOptions) {
        json.compilerOptions = {}
      }
      if (!json.compilerOptions.paths) {
        json.compilerOptions.paths = {}
      }
      json.compilerOptions.paths[importPath] = [libraryRoot]
      return json
    })
  }
}

export function updateTypeScriptConfigs(tree: Tree, libraryRoot: string): void {
  const updateTsConfigForProject = (projectRoot: string) => {
    const tsconfigPath = joinPathFragments(projectRoot, 'tsconfig.json')
    if (tree.exists(tsconfigPath)) {
      updateJson(tree, tsconfigPath, (json) => {
        if (!json.references) {
          json.references = []
        }
        const newReference = { path: `./${libraryRoot}` }
        // Avoid adding duplicate references
        if (!json.references.some((ref) => ref.path === newReference.path)) {
          json.references.push(newReference)
        }
        return json
      })
    }
  }

  // This assumes a standard Nx workspace layout (apps, libs)
  const projectDirs = ['apps', 'libs']
  for (const dir of projectDirs) {
    if (tree.exists(dir)) {
      for (const project of tree.children(dir)) {
        const projectPath = joinPathFragments(dir, project)
        if (projectPath === libraryRoot) {
          continue
        }
        updateTsConfigForProject(projectPath)
      }
    }
  }
}

export async function getAllPrismaModels(tree: Tree): Promise<ModelType[]> {
  const { getDMMF } = await import('@prisma/internals')
  const { getPrismaSchemaPath, readPrismaSchema } = await import('./generator-utils.js')
  const pluralize = (await import('pluralize')).default

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
        isUpdatedAt: field.isUpdatedAt,
        kind: field.kind,
        relationName: field.relationName,
        relationToFields: field.relationToFields || [],
        relationOnDelete: field.relationOnDelete,
        default: field.default,
      }))

      // Extract auth configuration from model documentation
      const authConfig = model.documentation ? parseCrudAuth(model.documentation) : null

      return {
        name: model.name,
        pluralName: pluralize(model.name),
        fields,
        primaryField: model.fields.find((f) => !f.isId && f.type === 'String')?.name || 'name',
        modelName: model.name,
        modelPropertyName: singularPropertyName,
        pluralModelName: pluralize(model.name),
        pluralModelPropertyName: pluralPropertyName,
        auth: authConfig || undefined,
      }
    })
  } catch (error) {
    console.error('Error parsing Prisma schema:', error)
    return []
  }
}

function parseCrudAuth(comment: string): CrudAuthConfig | null {
  try {
    // Match @crudAuth: { ... } in a single line
    const match = comment.match(/@crudAuth:\s*(\{.*\})/)
    if (!match) return null

    // The captured group should be valid JSON
    return JSON.parse(match[1])
  } catch (e) {
    console.error('Error parsing @crudAuth:', e)
    return null
  }
}

export function updatePnpmWorkspaceConfig(
  tree: Tree,
  options: { packages?: string[]; onlyBuiltDependencies?: string[] },
): void {
  const workspaceFilePath = 'pnpm-workspace.yaml'
  let doc: yaml.Document

  if (tree.exists(workspaceFilePath)) {
    const content = tree.read(workspaceFilePath, 'utf-8')
    doc = content ? yaml.parseDocument(content) : new yaml.Document({})
  } else {
    doc = new yaml.Document({})
  }

  if (options.packages?.length) {
    let packagesSeq = doc.get('packages') as yaml.YAMLSeq<string> | undefined
    if (!packagesSeq) {
      packagesSeq = new yaml.YAMLSeq()
      doc.set('packages', packagesSeq)
    }
    const existingPackages = packagesSeq.toJSON() || []
    for (const pkg of options.packages) {
      if (!existingPackages.includes(pkg)) {
        packagesSeq.add(pkg)
      }
    }
  }

  if (options.onlyBuiltDependencies?.length) {
    let onlyBuiltSeq = doc.get('onlyBuiltDependencies') as yaml.YAMLSeq<string> | undefined
    if (!onlyBuiltSeq) {
      onlyBuiltSeq = new yaml.YAMLSeq()
      doc.set('onlyBuiltDependencies', onlyBuiltSeq)
    }
    const existingOnlyBuilt = onlyBuiltSeq.toJSON() || []
    for (const pkg of options.onlyBuiltDependencies) {
      if (!existingOnlyBuilt.includes(pkg)) {
        onlyBuiltSeq.add(pkg)
      }
    }
    onlyBuiltSeq.items.sort((a, b) => a.localeCompare(b))
  }

  tree.write(workspaceFilePath, doc.toString())
}

export function pnpmInstallCallback(): GeneratorCallback {
  return () => {
    try {
      execSync('pnpm install', { stdio: 'inherit' })
    } catch (error) {
      console.error('Failed to run pnpm install:', error)
    }
  }
}

export function addToModules({ tree, modulePath, moduleArrayName, moduleToAdd, importPath }: AddToModulesOptions) {
  if (!tree.exists(modulePath)) {
    console.error(`Can't find ${modulePath}`)
    return
  }

  let fileContent = tree.read(modulePath)?.toString() || ''

  // Add an import statement if it doesn't exist
  if (!fileContent.includes(`import { ${moduleToAdd} }`)) {
    const importStatement = `import { ${moduleToAdd} } from '${importPath}';\n`
    fileContent = importStatement + fileContent
  }

  const arrayRegex = new RegExp(`export const ${moduleArrayName} = \\[([\\s\\S]*?)\\];`, 'm')
  const match = fileContent.match(arrayRegex)

  if (match) {
    const arrayContent = match[1]
    if (!arrayContent.includes(moduleToAdd)) {
      const modules = arrayContent
        .split(',')
        .map((m) => m.trim())
        .filter((m) => m.length > 0)
      modules.push(moduleToAdd)
      const formattedArray = `export const ${moduleArrayName} = [\n  ${modules.join(',\n  ')},\n];`
      fileContent = fileContent.replace(arrayRegex, formattedArray)
    }
  } else {
    // Fallback for different array formatting
    const arrayStart = fileContent.indexOf(`export const ${moduleArrayName} = [`)
    if (arrayStart !== -1) {
      const arrayEnd = fileContent.indexOf('];', arrayStart)
      if (arrayEnd !== -1) {
        const arrayContent = fileContent.slice(arrayStart + `export const ${moduleArrayName} = [`.length, arrayEnd)

        if (!arrayContent.includes(moduleToAdd)) {
          const isEmpty = arrayContent.trim() === ''
          const moduleEntry = isEmpty ? `\n  ${moduleToAdd}` : `,\n  ${moduleToAdd}`
          const before = fileContent.slice(0, arrayEnd)
          const after = fileContent.slice(arrayEnd)
          fileContent = before + moduleEntry + after
        }
      }
    }
  }

  tree.write(modulePath, fileContent)
}

export async function apiLibraryGenerator(
  tree: Tree,
  schema: ApiLibraryGeneratorSchema,
  templateRootPath: string,
  type?: string,
  addModuleImport?: boolean,
): Promise<() => void> {
  const npmScope = getNpmScope(tree)
  const API_LIBS_SCOPE = 'libs/api'
  const libraryRoot = type
    ? joinPathFragments(API_LIBS_SCOPE, schema.name, type)
    : joinPathFragments(API_LIBS_SCOPE, schema.name)
  const libraryName = type ? `api-${schema.name}-${type}` : `api-${schema.name}`
  const importPath = type ? `@${npmScope}/api/${schema.name}/${type}` : `@${npmScope}/api/${schema.name}`
  const tags = type ? `scope:api,type:${type}` : 'scope:api'

  // Overwrite logic: remove existing library if requested
  if (schema.overwrite && tree.exists(libraryRoot)) {
    try {
      execSync(`nx g rm ${libraryName} --forceRemove`, {
        stdio: 'inherit',
        cwd: tree.root,
      })
    } catch (error) {
      console.warn(`Failed to remove existing library ${libraryName}:`, error)
    }
  }

  // Check if the directory already exists, if not, create it
  if (!tree.exists(API_LIBS_SCOPE)) {
    tree.write(joinPathFragments(API_LIBS_SCOPE, '.gitkeep'), '')
  }

  // Only call libraryGenerator if the library does not already exist
  if (!tree.exists(libraryRoot)) {
    // Use explicit naming to avoid conflicts
    await libraryGenerator(tree, {
      name: libraryName,
      directory: libraryRoot,
      importPath: importPath,
      skipFormat: true,
      tags: tags,
      strict: true,
    })
  }

  // Determine the correct template path for generateTemplateFiles
  let finalTemplatePath: string
  if (type) {
    // For libraries with a type, templates are in '.../api-files/<name>/<type>/'
    finalTemplatePath = joinPathFragments(templateRootPath, schema.name, type)
  } else {
    // For libraries without a type, templates are directly under '.../api-files/<name>/'
    finalTemplatePath = joinPathFragments(templateRootPath, schema.name)
  }

  // Only generate template files if the path exists and is not empty
  if (templateRootPath && tree.exists(finalTemplatePath)) {
    generateTemplateFiles({
      tree,
      schema,
      libraryRoot,
      templatePath: finalTemplatePath, // Pass the exact path
      npmScope,
    })
  }

  // Update TypeScript configurations for the library itself
  updateTypeScriptConfigs(tree, libraryRoot)
  // Explicitly update the tsconfig.base.json paths after libraryGenerator has run
  updateTsConfigPaths(tree, importPath, libraryRoot)
  // Add the module import after generating the library
  if (addModuleImport) {
    const nameClassName = names(schema.name).className
    const typeClassName = type ? names(type).className : ''
    const moduleToAdd = `Api${nameClassName}${typeClassName}Module`
    addToModules({
      tree,
      modulePath: `apps/api/src/app.module.ts`,
      moduleArrayName: 'appModules',
      moduleToAdd,
      importPath,
    })
  }

  return () => {
    installPackagesTask(tree)
  }
}

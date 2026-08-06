import { formatFiles, generateFiles, joinPathFragments, names, Tree } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import {
  addToModules,
  getPrismaSchemaPath,
  getSkippedModelNames,
  readPrismaSchema,
} from '../lib/engine'
import { ModelExtensionGeneratorSchema } from './schema'

const defaultDependencies = {
  addToModules,
  formatFiles,
  generateFiles,
  getDMMF,
  getNpmScope,
  getPrismaSchemaPath,
  joinPathFragments,
  names,
  readPrismaSchema,
}

export type ModelExtensionGeneratorDependencies = typeof defaultDependencies

interface PrismaModel {
  name: string
  documentation?: string
}

function resolveModel(models: readonly PrismaModel[], requestedName: string): PrismaModel {
  const exactMatch = models.find(model => model.name === requestedName)
  if (exactMatch) return exactMatch

  const normalizedName = requestedName.toLowerCase()
  const caseInsensitiveMatch = models.find(model => model.name.toLowerCase() === normalizedName)
  if (caseInsensitiveMatch) return caseInsensitiveMatch

  const availableModels = models.map(model => model.name).sort((left, right) => left.localeCompare(right))
  throw new Error(
    `Prisma model "${requestedName}" was not found. Available models: ${availableModels.join(', ') || '(none)'}`,
  )
}

function addBarrelExport(tree: Tree, indexPath: string, exportLine: string): void {
  const existingLines = tree.exists(indexPath)
    ? (tree.read(indexPath, 'utf-8') ?? '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
    : []
  const lines = [...new Set([...existingLines, exportLine])].sort((left, right) => left.localeCompare(right))
  tree.write(indexPath, `${lines.join('\n')}\n`)
}

export async function modelExtensionGeneratorLogic(
  tree: Tree,
  options: ModelExtensionGeneratorSchema,
  dependencies: ModelExtensionGeneratorDependencies = defaultDependencies,
): Promise<void> {
  const prismaPath = dependencies.getPrismaSchemaPath(tree)
  const prismaSchema = dependencies.readPrismaSchema(tree, prismaPath)
  if (!prismaSchema) throw new Error(`No Prisma schema found at ${prismaPath}`)

  const dmmf = await dependencies.getDMMF({ datamodel: prismaSchema })
  const model = resolveModel(dmmf.datamodel.models, options.model)
  const skippedModelNames = getSkippedModelNames(dmmf.datamodel.models)
  if (skippedModelNames.has(model.name)) {
    throw new Error(
      `Prisma model "${model.name}" uses @skipCrud and has no generated GraphQL model to target. ` +
        'Create an explicit plugin maintenance path instead.',
    )
  }

  const extensionNames = dependencies.names(options.name ?? model.name)
  const customLibraryRoot = 'libs/api/custom'
  const defaultRoot = dependencies.joinPathFragments(customLibraryRoot, 'src/lib/default')
  const extensionRoot = dependencies.joinPathFragments(defaultRoot, extensionNames.fileName)
  const defaultIndexPath = dependencies.joinPathFragments(defaultRoot, 'index.ts')
  const appModulePath = 'apps/api/src/app.module.ts'

  if (!tree.exists(defaultIndexPath) || !tree.exists(appModulePath)) {
    throw new Error(
      'The custom API library is not initialized. Run @nestledjs/generators:custom before scaffolding an extension.',
    )
  }
  if (tree.exists(extensionRoot) && tree.children(extensionRoot).length > 0) {
    throw new Error(`Model extension folder already exists: ${extensionRoot}`)
  }

  dependencies.generateFiles(tree, dependencies.joinPathFragments(__dirname, 'files'), defaultRoot, {
    extensionClassName: extensionNames.className,
    extensionFileName: extensionNames.fileName,
    modelName: model.name,
    npmScope: dependencies.getNpmScope(tree),
    template: '',
  })

  addBarrelExport(
    tree,
    defaultIndexPath,
    `export * from './${extensionNames.fileName}/${extensionNames.fileName}.module'`,
  )
  dependencies.addToModules({
    tree,
    modulePath: appModulePath,
    moduleArrayName: 'defaultModules',
    moduleToAdd: `${extensionNames.className}Module`,
    importPath: `@${dependencies.getNpmScope(tree)}/api/custom`,
  })

  await dependencies.formatFiles(tree)
}

export async function modelExtensionGenerator(tree: Tree, options: ModelExtensionGeneratorSchema) {
  await modelExtensionGeneratorLogic(tree, options)
}

export default modelExtensionGenerator

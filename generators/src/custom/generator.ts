import { formatFiles, installPackagesTask, Tree } from '@nx/devkit'
import { apiLibraryGenerator } from '../lib/engine'
import { GenerateCustomGeneratorSchema } from './schema'
import { execSync } from 'child_process'
import { join } from 'path'

// Group all dependencies into a single object
const defaultDependencies = {
  formatFiles,
  installPackagesTask,
  apiLibraryGenerator,
  execSync,
  join,
}
export type CustomGeneratorDependencies = typeof defaultDependencies
function ensureCustomLibraryIndexes(
  tree: Tree,
  customLibraryRoot: string,
  dependencies: CustomGeneratorDependencies,
): void {
  const defaultDir = dependencies.join(customLibraryRoot, 'src/lib/default')
  const pluginsDir = dependencies.join(customLibraryRoot, 'src/lib/plugins')
  const defaultIndexPath = dependencies.join(defaultDir, 'index.ts')
  const pluginsIndexPath = dependencies.join(pluginsDir, 'index.ts')

  if (!tree.exists(defaultIndexPath)) tree.write(defaultIndexPath, '')

  if (!tree.exists(pluginsIndexPath)) {
    tree.write(pluginsIndexPath, 'export const customPlugins = []\n')
  } else {
    const existingPluginsIndex = tree.read(pluginsIndexPath)?.toString() ?? ''
    if (existingPluginsIndex.trim() === '') {
      tree.write(pluginsIndexPath, 'export const customPlugins = []\n')
    }
  }
}

export async function customGeneratorLogic(
  tree: Tree,
  schema: GenerateCustomGeneratorSchema,
  dependencies: CustomGeneratorDependencies = defaultDependencies,
) {
  try {
    const name = schema.name || 'custom'
    const customLibraryRoot = schema.directory ? `libs/api/${schema.directory}/${name}` : `libs/api/${name}`
    const projectName = schema.directory ? `api-${schema.directory.replace(/\//g, '-')}-${name}` : `api-${name}`

    // Overwrite logic
    if (schema.overwrite && tree.exists(customLibraryRoot)) {
      try {
        dependencies.execSync(`nx g @nx/workspace:remove ${projectName} --forceRemove`, {
          stdio: 'inherit',
          cwd: tree.root,
        })
      } catch (error) {
        console.warn(`Failed to remove existing library ${projectName}:`, error)
      }
    }

    // Use the shared apiLibraryGenerator but pass empty template to avoid conflicts
    await dependencies.apiLibraryGenerator(tree, { name }, '', undefined, false)

    ensureCustomLibraryIndexes(tree, customLibraryRoot, dependencies)

    // Override the main index.ts created by apiLibraryGenerator with our stable version
    const mainIndexContent = `export * from './lib/plugins'
export * from './lib/default'
`
    tree.write(dependencies.join(customLibraryRoot, 'src/index.ts'), mainIndexContent)

    // Format files
    await dependencies.formatFiles(tree)

    return () => {
      dependencies.installPackagesTask(tree)
    }
  } catch (error) {
    console.error('Error in Custom generator:', error)
    throw error
  }
}

export default async function (tree: Tree, schema: GenerateCustomGeneratorSchema) {
  return customGeneratorLogic(tree, schema)
}

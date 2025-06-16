import { addDependenciesToPackageJson, GeneratorCallback, Tree } from '@nx/devkit'
import { pnpmInstallCallback, removeWorkspacesFromPackageJson, updatePnpmWorkspaceConfig } from '@nestled/utils'
import * as fs from 'fs'
import * as path from 'path'

function updateTypeScriptConfig(tree: Tree): void {
  const tsConfigPath = 'tsconfig.base.json'
  if (tree.exists(tsConfigPath)) {
    const tsConfigContent = tree.read(tsConfigPath, 'utf-8')
    if (tsConfigContent) {
      const tsConfig = JSON.parse(tsConfigContent)

      if (!tsConfig.compilerOptions) {
        tsConfig.compilerOptions = {}
      }
      // Set baseUrl for path aliases
      tsConfig.compilerOptions.baseUrl = '.'
      // Set rootDir
      tsConfig.compilerOptions.rootDir = '.'
      // Enable decorator metadata
      tsConfig.compilerOptions.experimentalDecorators = true
      tsConfig.compilerOptions.emitDecoratorMetadata = true
      // Set moduleResolution to node
      tsConfig.compilerOptions.moduleResolution = 'node'
      // Set module to esnext
      tsConfig.compilerOptions.module = 'esnext'
      // Set esModuleInterop
      tsConfig.compilerOptions.esModuleInterop = true

      // Remove emitDeclarationOnly if it exists
      if (tsConfig.compilerOptions.emitDeclarationOnly !== undefined) {
        delete tsConfig.compilerOptions.emitDeclarationOnly
      }

      // Remove composite and declarationMap if they exist
      if (tsConfig.compilerOptions.composite !== undefined) {
        delete tsConfig.compilerOptions.composite
      }
      if (tsConfig.compilerOptions.declarationMap !== undefined) {
        delete tsConfig.compilerOptions.declarationMap
      }

      // Check for customConditions in compilerOptions
      if (tsConfig.compilerOptions && tsConfig.compilerOptions.customConditions !== undefined) {
        delete tsConfig.compilerOptions.customConditions
      }

      // Write back the updated configuration
      tree.write(tsConfigPath, JSON.stringify(tsConfig, null, 2))
    }
  }
}

export async function configSetupGenerator(tree: Tree): Promise<GeneratorCallback> {
  // Remove the 'packages' directory from the root if it exists
  const packagesDir = path.join(tree.root, 'packages')
  if (fs.existsSync(packagesDir)) {
    fs.rmSync(packagesDir, { recursive: true, force: true })
  }
  addDependenciesToPackageJson(
    tree,
    {},
    {
      '@prisma/internals': '^6.9.0',
      yaml: '^2.8.0',
      'eslint-plugin-jsx-a11y': '6.10.2',
      prettier: '^3.5.3',
      typescript: '~5.8.3',
    },
  )
  // Update all TypeScript config settings
  updateTypeScriptConfig(tree)
  removeWorkspacesFromPackageJson(tree)
  updatePnpmWorkspaceConfig(tree, { onlyBuiltDependencies: ['@prisma/engines'] })
  return pnpmInstallCallback()
}

export default configSetupGenerator

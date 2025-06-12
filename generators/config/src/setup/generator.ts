import { addDependenciesToPackageJson, GeneratorCallback, Tree, updateJson } from '@nx/devkit'
import { pnpmInstallCallback, removeWorkspacesFromPackageJson, updatePnpmWorkspaceConfig } from '@nestled/utils'
import * as fs from 'fs'
import * as path from 'path'

export async function configSetupGenerator(tree: Tree): Promise<GeneratorCallback> {
  // Remove 'packages' directory from root if it exists
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
    },
  )
  // Remove 'composite' and 'declarationMap' from tsconfig.base.json
  const tsConfigPath = 'tsconfig.base.json'
  if (tree.exists(tsConfigPath)) {
    updateJson(tree, tsConfigPath, (json) => {
      if (json.compilerOptions) {
        delete json.compilerOptions.composite
        delete json.compilerOptions.declarationMap
      }
      return json
    })
  }
  removeWorkspacesFromPackageJson(tree)
  updatePnpmWorkspaceConfig(tree, { onlyBuiltDependencies: ['@prisma/engines'] })
  return pnpmInstallCallback()
}

export default configSetupGenerator

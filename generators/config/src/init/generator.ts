import { addDependenciesToPackageJson, GeneratorCallback, Tree } from '@nx/devkit'
import {
  addScriptToPackageJson,
  pnpmInstallCallback,
  removeWorkspacesFromPackageJson,
  updatePnpmWorkspaceConfig,
} from '@nestled/utils'

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

      // Remove emitDeclarationOnly if it exists
      if (tsConfig.compilerOptions.emitDeclarationOnly !== undefined) {
        delete tsConfig.compilerOptions.emitDeclarationOnly
      }

      // Write back the updated configuration
      tree.write(tsConfigPath, JSON.stringify(tsConfig, null, 2))
    }
  }
}

export async function initConfigGenerator(tree: Tree): Promise<GeneratorCallback> {
  addDependenciesToPackageJson(tree, {}, { yaml: '^2.4.2' })
  // Update TypeScript configuration
  updateTypeScriptConfig(tree)

  // Remove the workspaces section from package.json if it exists
  removeWorkspacesFromPackageJson(tree)

  // Add the clean script to package.json
  addScriptToPackageJson(
    tree,
    'clean',
    'git reset --hard HEAD && git clean -fd && rm -rf node_modules && rm -rf tmp && rm -rf dist && pnpm install',
  )

  // Create or update pnpm-workspace.yaml
  updatePnpmWorkspaceConfig(tree, { packages: ['apps/**', 'libs/**', 'tools/*'] })

  // Return a callback that will run after the generator completes
  return pnpmInstallCallback()
}

export default initConfigGenerator

import { GeneratorCallback, Tree, updateJson } from '@nx/devkit'
import { execSync } from 'child_process'

function updateTypeScriptConfig(tree: Tree): void {
  const tsConfigPath = 'tsconfig.base.json'
  if (tree.exists(tsConfigPath)) {
    const tsConfigContent = tree.read(tsConfigPath, 'utf-8')
    if (tsConfigContent) {
      const tsConfig = JSON.parse(tsConfigContent)

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

function removeWorkspacesFromPackageJson(tree: Tree): void {
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

export async function initConfigGenerator(
  tree: Tree,
): Promise<GeneratorCallback> {
  // Update TypeScript configuration
  updateTypeScriptConfig(tree)

  // Remove workspaces section from package.json if it exists
  removeWorkspacesFromPackageJson(tree)

  // Return a callback that will run after the generator completes
  return () => {
    try {
      execSync('pnpm install', { stdio: 'inherit' })
    } catch (error) {
      console.error('Failed to run pnpm install:', error)
    }
  }
}

export default initConfigGenerator

import { GeneratorCallback, Tree, updateJson } from '@nx/devkit'
import { execSync } from 'child_process'
import { removeWorkspacesFromPackageJson, updateTypeScriptConfig } from '../../../utils/generator-utils'

interface InitGeneratorOptions {
  hideDeprecationWarnings: boolean
}

function addCleanScript(tree: Tree): void {
  const packageJsonPath = 'package.json'
  if (tree.exists(packageJsonPath)) {
    updateJson(tree, packageJsonPath, (json) => {
      json.scripts = json.scripts ?? {}
      json.scripts.clean =
        'git reset --hard HEAD && git clean -fd && rm -rf node_modules && rm -rf tmp && rm -rf dist && pnpm install'
      return json
    })
  }
}

export async function initConfigGenerator(
  tree: Tree,
  options: InitGeneratorOptions
): Promise<GeneratorCallback> {
  // Hide deprecation warnings if requested
  if (options.hideDeprecationWarnings) {
    process.env.NODE_NO_DEPRECATION = '1'
  }

  // Update TypeScript configuration
  updateTypeScriptConfig(tree)

  // Remove the workspaces section from package.json if it exists
  removeWorkspacesFromPackageJson(tree)

  // Add the clean script to package.json
  addCleanScript(tree)

  // Return a callback that will run after the generator completes
  return () => {
    try {
      execSync('pnpm install', { stdio: 'inherit' })
    } catch (error) {
      console.error('Failed to run pnpm install:', error)
    } finally {
      // Restore default behavior
      if (options.hideDeprecationWarnings) {
        delete process.env.NODE_NO_DEPRECATION
      }
    }
  }
}

export default initConfigGenerator

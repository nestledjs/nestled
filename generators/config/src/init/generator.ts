import { GeneratorCallback, Tree, updateJson } from '@nx/devkit'
import { execSync } from 'child_process'
import { removeWorkspacesFromPackageJson, updateTypeScriptConfig } from '@nestled/utils'
import * as yaml from 'yaml'



function createOrUpdatePnpmWorkspace(tree: Tree): void {
  const workspaceFilePath = 'pnpm-workspace.yaml'
  const newPackages = ['apps/**', 'libs/**', 'tools/*']

  if (tree.exists(workspaceFilePath)) {
    const content = tree.read(workspaceFilePath, 'utf-8')
    if (content) {
      const doc = yaml.parseDocument(content)
      let packages = doc.get('packages') as yaml.YAMLSeq<string> | undefined

      if (!packages) {
        doc.add({ key: 'packages', value: newPackages })
      } else {
        const existingPackages = packages.toJSON() || []
        for (const pkg of newPackages) {
          if (!existingPackages.includes(pkg)) {
            packages.add(pkg)
          }
        }
      }
      tree.write(workspaceFilePath, doc.toString())
    } else {
      // Handle empty file
      const doc = new yaml.Document({ packages: newPackages })
      tree.write(workspaceFilePath, doc.toString())
    }
  } else {
    const doc = new yaml.Document({ packages: newPackages })
    tree.write(workspaceFilePath, doc.toString())
  }
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

export async function initConfigGenerator(tree: Tree): Promise<GeneratorCallback> {
  // Update TypeScript configuration
  updateTypeScriptConfig(tree)

  // Remove the workspaces section from package.json if it exists
  removeWorkspacesFromPackageJson(tree)

  // Add the clean script to package.json
  addCleanScript(tree)

  // Create or update pnpm-workspace.yaml
  createOrUpdatePnpmWorkspace(tree)

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

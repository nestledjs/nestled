import { Tree, updateJson } from '@nx/devkit'

export function updateTypeScriptConfig(tree: Tree): void {
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
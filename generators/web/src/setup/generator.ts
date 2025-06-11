import { addDependenciesToPackageJson, GeneratorCallback, Tree } from '@nx/devkit'
import { pnpmInstallCallback, updatePnpmWorkspaceConfig } from '@nestled/utils'

export async function webSetupGenerator(tree: Tree): Promise<GeneratorCallback> {
  // Add dependencies
  addDependenciesToPackageJson(
    tree,
    {
      '@react-router/dev': '^7.6.2',
      'react-router-dom': '^7.6.2',
      '@react-router/html': '^7.6.2',
      'vite-tsconfig-paths': '^5.1.4',
      isbot: '5.1.28',
    },
    {
      '@nx/react': '21.1.3',
      '@tailwindcss/vite': '^4.1.8',
      tailwindcss: '^4.1.8',
      '@tailwindcss/postcss': '^4.1.8',
    },
  )

  // Update pnpm-workspace.yaml with build dependencies
  const packagesToBuild = ['@tailwindcss/oxide']
  updatePnpmWorkspaceConfig(tree, { onlyBuiltDependencies: packagesToBuild })

  // Return a callback that will run after the generator completes
  return pnpmInstallCallback()
}

export default webSetupGenerator

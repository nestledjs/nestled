import { addDependenciesToPackageJson, GeneratorCallback, Tree } from '@nx/devkit'
import { pnpmInstallCallback, updatePnpmWorkspaceConfig } from '@nestledjs/utils'

export async function webSetupGenerator(tree: Tree): Promise<GeneratorCallback> {
  // Add dependencies
  addDependenciesToPackageJson(
    tree,
    {
      'react-router-dom': '^7.6.2',
      '@react-router/dev': '^7.6.2',
      isbot: '5.1.28',
      '@apollo/client': '^3.13.8',
      '@apollo/client-integration-react-router': '0.12.0-alpha.4',
    },
    {
      '@nx/react': '21.2.0',
      'vite-tsconfig-paths': '^5.1.4',
      '@tailwindcss/vite': '^4.1.8',
      tailwindcss: '^4.1.8',
    },
  )

  // Update pnpm-workspace.yaml with build dependencies
  const packagesToBuild = ['@tailwindcss/oxide']
  updatePnpmWorkspaceConfig(tree, { onlyBuiltDependencies: packagesToBuild })

  // Return a callback that will run after the generator completes
  return async () => {
    await pnpmInstallCallback()()
    // Do not return anything (void)
  }
}

export default webSetupGenerator

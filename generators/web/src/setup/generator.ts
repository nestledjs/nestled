import { addDependenciesToPackageJson, GeneratorCallback, Tree } from '@nx/devkit'
import { updatePnpmWorkspaceConfig } from '@nestledjs/utils'

export async function webSetupGenerator(tree: Tree): Promise<GeneratorCallback> {
  // Add dependencies
  const installDeps = addDependenciesToPackageJson(
    tree,
    {
      '@react-router/node': '7.6.2',
      '@react-router/serve': '7.6.2',
      react: '19.1.0',
      'react-dom': '19.1.0',
      'react-router': '7.6.2',
      'react-router-dom': '^7.6.2',
      '@react-router/dev': '^7.6.2',
      isbot: '5.1.28',
      '@apollo/client': '^3.13.8',
      '@apollo/client-integration-react-router': '0.12.0-alpha.4',
      'graphql-tag': '^2.12.6',
    },
    {
      '@nx/react': '21.2.3',
      'vite-tsconfig-paths': '^5.1.4',
      '@tailwindcss/vite': '^4.1.8',
      tailwindcss: '^4.1.8',
      '@testing-library/dom': '10.4.0',
      '@testing-library/react': '16.1.0',
      '@types/react': '19.1.0',
      '@types/react-dom': '19.1.0',
      '@vitejs/plugin-react': '4.5.2',
      'eslint-plugin-import': '2.31.0',
      'eslint-plugin-react': '7.35.0',
      'eslint-plugin-react-hooks': '5.0.0',
      'jsonc-eslint-parser': '2.4.0',
    },
  )

  // Update pnpm-workspace.yaml with build dependencies
  const packagesToBuild = ['@tailwindcss/oxide']
  updatePnpmWorkspaceConfig(tree, { onlyBuiltDependencies: packagesToBuild })

  // Return a callback that will run after the generator completes
  return async () => {
    await installDeps()
    // Do not return anything (void)
  }
}

export default webSetupGenerator

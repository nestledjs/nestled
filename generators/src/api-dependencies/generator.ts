import { addDependenciesToPackageJson, Tree } from '@nx/devkit'

export async function apiDependenciesGenerator(tree: Tree) {
  // Add dependencies
  await addDependenciesToPackageJson(
    tree,
    {},
    {
      nx: '20.6.1',
      '@nx/js': '20.6.1',
      '@nx/nest': '20.6.1',
      '@nx/node': '20.6.1',
      '@nx/webpack': '20.6.1',
      pg: '8.14.1',
    },
  )

  // Update TypeScript configuration
  const tsConfigPath = 'tsconfig.base.json'
  if (tree.exists(tsConfigPath)) {
    const tsConfigContent = tree.read(tsConfigPath, 'utf-8')
    const tsConfig = JSON.parse(tsConfigContent)

    // Update module and moduleResolution
    tsConfig.compilerOptions.module = 'NodeNext'
    tsConfig.compilerOptions.moduleResolution = 'NodeNext'
    
    // Remove emitDeclarationOnly if it exists
    if (tsConfig.compilerOptions.emitDeclarationOnly !== undefined) {
      delete tsConfig.compilerOptions.emitDeclarationOnly
    }

    // Write back the updated configuration
    tree.write(tsConfigPath, JSON.stringify(tsConfig, null, 2))
  }

  return () => {}
}

export default apiDependenciesGenerator

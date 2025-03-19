import { addDependenciesToPackageJson, Tree } from '@nx/devkit'

export async function apiDependenciesGenerator(tree: Tree) {
  return addDependenciesToPackageJson(
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
}

export default apiDependenciesGenerator

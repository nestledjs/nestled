import { addDependenciesToPackageJson, Tree } from '@nx/devkit'

export async function apiDependenciesGenerator(tree: Tree) {
  return addDependenciesToPackageJson(
    tree,
    {},
    {
      '@nx/nest': 'latest',
      '@nx/node': 'latest',
      '@nx/webpack': 'latest',
      pg: 'latest',
    },
  )
}

export default apiDependenciesGenerator

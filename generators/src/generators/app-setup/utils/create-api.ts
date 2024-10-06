import { Tree } from '@nx/devkit'
import { applicationGenerator } from '@nx/nest'

export async function createApi(tree: Tree) {
  await applicationGenerator(tree, {
    name: 'api',
    directory: 'apps/api',
    projectNameAndRootFormat: 'as-provided',
  })
}

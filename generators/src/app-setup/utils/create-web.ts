import { Tree } from '@nx/devkit'
import { applicationGenerator } from '@nx/remix/generators'

export async function createWeb(tree: Tree) {
  await applicationGenerator(tree, {
    name: 'web',
    directory: 'apps/web',
  })
}

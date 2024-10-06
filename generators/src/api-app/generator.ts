import { generateFiles, joinPathFragments, Tree } from '@nx/devkit'
import { applicationGenerator as nestApplicationGenerator } from '@nx/nest'
import { installPlugins } from '../app-setup/utils/install-plugins'

export default async function (tree: Tree, schema: any) {
  const installTask = await installPlugins(tree, schema)

  await nestApplicationGenerator(tree, {
    name: 'api',
    directory: 'apps/api',
    projectNameAndRootFormat: 'as-provided',
  })

  generateFiles(tree, joinPathFragments(__dirname, './files'), 'apps/api/src', schema)

  return installTask
}

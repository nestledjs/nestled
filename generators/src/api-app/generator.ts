import { generateFiles, joinPathFragments, Tree } from '@nx/devkit'
import { applicationGenerator as nestApplicationGenerator } from '@nx/nest'
import { installPlugins } from './utils/install-plugins'
import { deleteDirectory } from '../shared/utils'

export default async function (tree: Tree, schema: any) {
  const installTask = await installPlugins(tree, schema)

  await nestApplicationGenerator(tree, {
    name: 'api',
    directory: 'apps/api',
    projectNameAndRootFormat: 'as-provided',
  })

  const variables = {
    ...schema,
    tmpl: '',
  }

  generateFiles(tree, joinPathFragments(__dirname, './files'), 'apps/api/src', variables)

  const directoriesToDelete = ['apps/api/src/assets', 'apps/api/src/app']

  directoriesToDelete.forEach((dir) => deleteDirectory(tree, dir))

  return installTask
}

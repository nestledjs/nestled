import { formatFiles, joinPathFragments, Tree } from '@nx/devkit'
import { apiLibraryGenerator, deleteFiles } from '@nestled/utils'

export default async function generator(tree: Tree) {
  const templateRootPath = joinPathFragments(__dirname, './files')
  const overwrite = false

  await apiLibraryGenerator(tree, { name: 'utils', overwrite }, templateRootPath, '', false)

  // Remove the default module file if it exists
  deleteFiles(tree, ['libs/api/utils/src/lib/api-utils.module.ts'])

  await formatFiles(tree)
}

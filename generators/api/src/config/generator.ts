import { formatFiles, installPackagesTask, joinPathFragments, Tree } from '@nx/devkit'
import { apiLibraryGenerator } from '@nestledjs/utils'
import { ApiConfigGeneratorSchema } from './schema'

export default async function generateLibraries(tree: Tree, options: ApiConfigGeneratorSchema = {}) {
  const templateRootPath = joinPathFragments(__dirname, './files')
  const overwrite = options.overwrite === true

  await apiLibraryGenerator(tree, { name: 'config', overwrite, customName: true }, templateRootPath)

  await formatFiles(tree)

  return () => {
    installPackagesTask(tree)
  }
}

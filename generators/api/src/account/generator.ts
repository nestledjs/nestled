import { formatFiles, GeneratorCallback, installPackagesTask, joinPathFragments, Tree } from '@nx/devkit'
import { apiLibraryGenerator } from '@nestledjs/utils'
import { ApiAccountGeneratorSchema } from './schema'

export default async function generateLibraries(
  tree: Tree,
  options: ApiAccountGeneratorSchema = {},
): Promise<GeneratorCallback> {
  const templateRootPath = joinPathFragments(__dirname, './files')
  const overwrite = options.overwrite === true

  await apiLibraryGenerator(tree, { name: 'account', overwrite }, templateRootPath, 'data-access')
  await apiLibraryGenerator(tree, { name: 'account', overwrite }, templateRootPath, 'feature', true)

  await formatFiles(tree)

  return () => {
    installPackagesTask(tree)
  }
}

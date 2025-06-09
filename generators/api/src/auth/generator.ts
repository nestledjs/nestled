import { formatFiles, GeneratorCallback, installPackagesTask, joinPathFragments, Tree } from '@nx/devkit'
import { apiLibraryGenerator } from '@nestled/utils'
import { ApiAuthGeneratorSchema } from './schema'

export default async function generateLibraries(tree: Tree, options: ApiAuthGeneratorSchema = {}): Promise<GeneratorCallback> {
  const templateRootPath = joinPathFragments(__dirname, './files')
  const overwrite = options.overwrite === true

  await apiLibraryGenerator(tree, { name: 'auth', overwrite }, templateRootPath, 'data-access')
  await apiLibraryGenerator(tree, { name: 'auth', overwrite }, templateRootPath, 'feature', true)
  await apiLibraryGenerator(tree, { name: 'auth', overwrite }, templateRootPath, 'util')

  await formatFiles(tree)

  return () => {
    installPackagesTask(tree)
  }
}

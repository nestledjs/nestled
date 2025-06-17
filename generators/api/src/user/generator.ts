import { formatFiles, GeneratorCallback, installPackagesTask, joinPathFragments, Tree } from '@nx/devkit'
import { apiLibraryGenerator } from '@nestledjs/utils'

export default async function generateLibraries(tree: Tree): Promise<GeneratorCallback> {
  const templateRootPath = joinPathFragments(__dirname, './files')

  await apiLibraryGenerator(tree, { name: 'user' }, templateRootPath, 'data-access')
  await apiLibraryGenerator(tree, { name: 'user' }, templateRootPath, 'feature', true)

  await formatFiles(tree)

  return () => {
    installPackagesTask(tree)
  }
}

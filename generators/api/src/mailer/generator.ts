import { formatFiles, GeneratorCallback, installPackagesTask, joinPathFragments, Tree } from '@nx/devkit'
import { apiLibraryGenerator } from '@nestled/utils'

export default async function generateLibraries(tree: Tree): Promise<GeneratorCallback> {
  const templateRootPath = joinPathFragments(__dirname, './files')

  await apiLibraryGenerator(tree, { name: 'mailer' }, templateRootPath, 'data-access')

  await formatFiles(tree)

  return () => {
    installPackagesTask(tree)
  }
}

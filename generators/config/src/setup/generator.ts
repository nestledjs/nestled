import { addDependenciesToPackageJson, GeneratorCallback, Tree } from '@nx/devkit'
import { pnpmInstallCallback, removeWorkspacesFromPackageJson } from '@nestled/utils'

export async function configSetupGenerator(tree: Tree): Promise<GeneratorCallback> {
  addDependenciesToPackageJson(
    tree,
    {},
    {
      '@prisma/internals': '^6.9.0',
      'yaml': '^2.8.0'
    },
  )
  removeWorkspacesFromPackageJson(tree)
  return pnpmInstallCallback()
}

export default configSetupGenerator 
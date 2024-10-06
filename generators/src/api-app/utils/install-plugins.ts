import { addDependenciesToPackageJson, logger, Tree } from '@nx/devkit'
import { AppSetupGeneratorSchema } from '../schema'

export async function installPlugins(tree: Tree, options: AppSetupGeneratorSchema) {
  const dependencies = {}
  const devDependencies = {}

  devDependencies['@nx/nest'] = 'latest'
  dependencies['@nestjs/common'] = 'latest'
  dependencies['@nestjs/core'] = 'latest'
  dependencies['@nestjs/config'] = 'latest'
  dependencies['cookie-parser'] = 'latest'
  devDependencies['@types/cookie-parser'] = 'latest'
  devDependencies['@types/express'] = 'latest'
  dependencies['express'] = 'latest'
  dependencies['joi'] = 'latest'

  try {
    const installTask = addDependenciesToPackageJson(tree, dependencies, devDependencies)
    logger.info('API dependencies added successfully!')
    return installTask
  } catch (error) {
    logger.error('Failed to add API dependencies to package.json.')
    throw error
  }
}

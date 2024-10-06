import { formatFiles, GeneratorCallback, logger, Tree } from '@nx/devkit'
import { AppSetupGeneratorSchema } from './schema'
import { createApi } from './utils/create-api'
import { installPlugins } from './utils/install-plugins'
import { createWeb } from './utils/create-web'

export async function appSetupGenerator(tree: Tree, options: AppSetupGeneratorSchema): Promise<GeneratorCallback> {
  logger.info('Starting generator execution')

  // Step 1: Install Plugins
  logger.info('Installing plugins')
  const installTask = await installPlugins(tree, options)
  logger.info('Plugins installation task created')

  // Step 2: Create Applications
  if (options.setupType === 'api' || options.setupType === 'both') {
    logger.info('Creating API application')
    await createApi(tree)
    logger.info('API application created successfully!')
  }

  if (options.setupType === 'web' || options.setupType === 'both') {
    logger.info('Creating Web application')
    await createWeb(tree)
    logger.info('Web application created successfully!')
  }

  // Step 3: Format files
  logger.info('Formatting files')
  await formatFiles(tree)
  logger.info('Files formatted successfully')

  logger.info('Generator execution completed')

  // Step 4: Return the install task to be run after the generator
  return installTask
}

export default appSetupGenerator

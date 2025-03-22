import { addDependenciesToPackageJson, logger, Tree } from '@nx/devkit'

export async function installPlugins(tree: Tree) {
  logger.info('Starting to install API dependencies...')

  const dependencies = {
    '@nestjs/common': 'latest',
    '@nestjs/core': 'latest',
    '@nestjs/config': 'latest',
    'cookie-parser': 'latest',
    '@prisma/client': 'latest',
    '@prisma/internals': 'latest',
    express: 'latest',
    joi: 'latest',
  }

  const devDependencies = {
    '@nx/nest': 'latest',
    '@types/cookie-parser': 'latest',
    '@types/express': 'latest',
    prisma: 'latest',
    tsx: 'latest',
  }

  try {
    logger.info('Adding dependencies to package.json...')
    Object.entries(dependencies).forEach(([pkg, version]) => {
      logger.info(`Adding dependency: ${pkg}@${version}`)
    })
    Object.entries(devDependencies).forEach(([pkg, version]) => {
      logger.info(`Adding devDependency: ${pkg}@${version}`)
    })

    const installTask = addDependenciesToPackageJson(tree, dependencies, devDependencies)
    logger.info('API dependencies added successfully! Dependencies will be installed after generator completes.')
    return installTask
  } catch (error) {
    logger.error(`Failed to add API dependencies to package.json: ${error}`)
    throw error
  }
}

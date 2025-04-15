import { addDependenciesToPackageJson, logger, Tree } from '@nx/devkit'

export async function installPlugins(tree: Tree) {
  logger.info('Starting to install API dependencies...')

  const dependencies = {
    '@nestjs/common': '^10.0.0',
    '@nestjs/core': '^10.0.0',
    '@nestjs/config': '^3.0.0',
    'cookie-parser': '^1.4.6',
    '@prisma/client': '^5.0.0',
    '@prisma/internals': '^5.0.0',
    express: '^4.18.0',
    joi: '^17.9.0',
  }

  const devDependencies = {
    '@nx/nest': '20.8.0',
    '@types/cookie-parser': '^1.4.3',
    '@types/express': '^4.17.17',
    prisma: '^5.0.0',
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

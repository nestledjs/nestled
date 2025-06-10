import { formatFiles, GeneratorCallback, installPackagesTask, joinPathFragments, Tree } from '@nx/devkit'
import { apiLibraryGenerator, installPlugins } from '@nestled/utils'
import { ApiCoreGeneratorSchema } from './schema'

export default async function generateLibraries(tree: Tree, options: ApiCoreGeneratorSchema = {}): Promise<GeneratorCallback> {
  const templateRootPath = joinPathFragments(__dirname, './files')
  const overwrite = options.overwrite === true

  const dependencies = {
    'graphql-type-json': '^0.3.2',
    '@nestjs/graphql': '^12.0.0',
    '@nestjs/common': '^10.0.0',
    '@nestjs/passport': '^10.0.0',
    '@nestjs/axios': '^3.0.0',
    '@prisma/client': '^6.9.0',
    '@apollo/server': '^4.9.0',
  }

  const devDependencies = {}

  await installPlugins(tree, dependencies, devDependencies)

  await apiLibraryGenerator(tree, { name: 'core', overwrite }, templateRootPath, 'data-access')
  await apiLibraryGenerator(tree, { name: 'core', overwrite }, templateRootPath, 'feature', true)
  await apiLibraryGenerator(tree, { name: 'core', overwrite }, templateRootPath, 'models')

  await formatFiles(tree)

  return () => {
    installPackagesTask(tree)
  }
}

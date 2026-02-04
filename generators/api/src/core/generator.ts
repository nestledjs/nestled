import { formatFiles, GeneratorCallback, installPackagesTask, joinPathFragments, Tree } from '@nx/devkit'
import { apiLibraryGenerator, installPlugins } from '@nestledjs/utils'
import { ApiCoreGeneratorSchema } from './schema'

export default async function generateLibraries(
  tree: Tree,
  options: ApiCoreGeneratorSchema = {},
): Promise<GeneratorCallback> {
  const templateRootPath = joinPathFragments(__dirname, './files')
  const overwrite = options.overwrite === true

  const dependencies = {
    'graphql-type-json': '^0.3.2',
    '@nestjs/graphql': '^13.2.0',
    '@nestjs/common': '^10.0.0',
    '@nestjs/passport': '^10.0.0',
    '@nestjs/axios': '^3.0.0',
    '@prisma/client': '^7.3.0',
    '@apollo/server': '^5.1.0',
    'graphql-fields': '^2.0.3',
    'decimal.js': '^10.4.3',
    'prisma-graphql-type-decimal': '^3.0.0',
  }

  const devDependencies = {
    '@types/graphql-fields': '^1.3.9',
  }

  await installPlugins(tree, dependencies, devDependencies)

  await apiLibraryGenerator(tree, { name: 'core', overwrite }, templateRootPath, 'data-access')
  await apiLibraryGenerator(tree, { name: 'core', overwrite }, templateRootPath, 'feature', true)
  await apiLibraryGenerator(tree, { name: 'core', overwrite }, templateRootPath, 'models')
  await apiLibraryGenerator(tree, { name: 'core', overwrite }, templateRootPath, 'helpers')

  await formatFiles(tree)

  return () => {
    installPackagesTask(tree)
  }
}

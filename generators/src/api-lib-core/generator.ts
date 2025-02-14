import { formatFiles, generateFiles, joinPathFragments, readJson, readProjectConfiguration, Tree } from '@nx/devkit'
import { libraryGenerator } from '@nx/nest/src/generators/library/library'
import { installPlugins } from '../shared/utils'

async function apiCoreGenerator(tree: Tree, type: string) {
  // Generate the library for the specific type (data-access, feature, etc.)
  await libraryGenerator(tree, {
    name: type,
    directory: 'libs/api/core', // Hardcoded path to "libs/api/core"
    tags: `scope:api,type:${type}`, // Hardcoded scope to "api"
  })

  // Get the library root and npm scope from the config
  const libraryRoot = readProjectConfiguration(tree, `api-core-${type}`).root // Hardcoded "api-core" prefix
  const npmScope = readJson(tree, 'nx.json').npmScope

  // Prepare variables for file generation
  const variables = {
    npmScope,
    tmpl: '',
  }

  // Generate the template files into the correct location
  generateFiles(
    tree, // virtual file system
    joinPathFragments(__dirname, `./files/${type}`), // path to templates
    libraryRoot, // destination path
    variables, // variables to replace in templates
  )

  // Format the files
  await formatFiles(tree)

  // Add specific dependencies for this generator
  const dependencies = {
    'graphql-type-json': 'latest', // Add graphql-type-json
    '@nestjs/graphql': 'latest', // Add @nestjs/graphql
    '@nestjs/common': 'latest', // Add @nestjs/common
    '@prisma/client': 'latest', // Add @prisma/client
  }

  const devDependencies = {}

  // Use the shared installPlugins utility to install the necessary packages
  return installPlugins(tree, dependencies, devDependencies)
}

// Main generator function
export default async function (tree: Tree) {
  // Call the generator twice for 'data-access' and 'feature'
  await apiCoreGenerator(tree, 'data-access')
  await apiCoreGenerator(tree, 'feature')
}

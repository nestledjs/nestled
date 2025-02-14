import { generateFiles, joinPathFragments, Tree, updateJson } from '@nx/devkit'
import { applicationGenerator as nestApplicationGenerator } from '@nx/nest'
import { installPlugins } from './utils/install-plugins'
import { deleteDirectory } from '../shared/utils'

interface Schema {
  [key: string]: unknown;
}

const devDependencies = {
  'prisma-datamodel': '^1.0.2'  // Use the latest version available
}

export default async function (tree: Tree, schema: Schema) {
  // Install prisma-datamodel
  const installTask = await installPlugins(tree, {}, devDependencies)

  // Install the necessary plugins
  const installTask = await installPlugins(tree, schema)

  // Generate the nest application
  await nestApplicationGenerator(tree, {
    name: 'api',
    directory: 'apps/api',
    projectNameAndRootFormat: 'as-provided',
  })

  // Update the project.json to remove the assets from the build options
  updateJson(tree, 'apps/api/project.json', (json) => {
    if (json.targets && json.targets.build && json.targets.build.options) {
      delete json.targets.build.options.assets
    }
    return json
  })

  // Add the dev:api script to the main package.json
  updateJson(tree, 'package.json', (json) => {
    if (!json.scripts) {
      json.scripts = {}
    }
    json.scripts['dev:api'] = 'nx serve api'
    return json
  })

  const variables = {
    ...schema,
    tmpl: '',
  }

  // Generate custom files
  generateFiles(tree, joinPathFragments(__dirname, './files'), 'apps/api/src', variables)

  // Delete the unused default app files
  const directoriesToDelete = ['apps/api/src/assets', 'apps/api/src/app']

  directoriesToDelete.forEach((dir) => {
    if (tree.exists(dir)) {
      deleteDirectory(tree, dir)
    }
  })

  return installTask
}

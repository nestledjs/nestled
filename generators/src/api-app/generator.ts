import { generateFiles, joinPathFragments, Tree, updateJson } from '@nx/devkit'
import { applicationGenerator as nestApplicationGenerator } from '@nx/nest'
import { installPlugins } from './utils/install-plugins'

interface Schema {
  [key: string]: unknown
}

export default async function (tree: Tree, schema: Schema) {
  await nestApplicationGenerator(tree, {
    name: 'api',
    directory: 'apps/api',
    strict: true,
  })

  // Install required plugins
  const installTask = await installPlugins(tree)

  // Update the project configuration to remove assets and use webpack
  const projectJsonPath = 'apps/api/project.json'
  if (tree.exists(projectJsonPath)) {
    updateJson(tree, projectJsonPath, (json) => {
      if (json.targets?.build?.options?.assets) {
        delete json.targets.build.options.assets;
      }
      return json;
    })
  }

  // Add dev:api script to package.json
  updateJson(tree, 'package.json', (json) => {
    if (!json.scripts) {
      json.scripts = {}
    }
    json.scripts['dev:api'] = 'nx serve api'
    return json
  })

  // Generate custom files
  generateFiles(tree, joinPathFragments(__dirname, './files'), 'apps/api/src', { ...schema, tmpl: '' })

  // Delete the unused default app files
  const filesToDelete = ['apps/api/src/assets', 'apps/api/src/app']

  filesToDelete.forEach((path) => {
    if (tree.exists(path)) {
      tree.delete(path)
    }
  })

  return installTask
}

import { generateFiles, joinPathFragments, Tree, updateJson } from '@nx/devkit'
import { applicationGenerator as nestApplicationGenerator } from '@nx/nest'
import { installPlugins } from './utils/install-plugins'
import { deleteDirectory } from '../shared/utils'

interface Schema {
  [key: string]: unknown
}

export default async function (tree: Tree, schema: Schema) {
  // First generate the nest application
  await nestApplicationGenerator(tree, {
    name: 'api', // Full path as the name
    directory: 'apps', // Directory where the app will be generated
    strict: true,
  })

  // Then install our custom plugins
  const installTask = await installPlugins(tree)

  // Update the project configuration to use tsc
  const projectJsonPath = 'apps/api/project.json'
  if (tree.exists(projectJsonPath)) {
    updateJson(tree, projectJsonPath, (json) => {
      // Remove assets from build options
      if (json.targets?.build?.options) {
        delete json.targets.build.options.assets
      }

      // Update serve target to use @nx/js:node
      json.targets.serve = {
        executor: '@nx/js:node',
        options: {
          buildTarget: 'api:build',
          watch: true,
          port: 9230,
          inspect: 'inspect',
        },
        configurations: {
          development: {
            buildTarget: 'api:build:development',
          },
        },
      }

      // Update build target to use tsc
      json.targets.build = {
        executor: '@nx/js:tsc',
        outputs: ['{options.outputPath}'],
        options: {
          outputPath: 'dist/apps/api',
          main: 'apps/api/src/main.ts',
          tsConfig: 'apps/api/tsconfig.app.json',
          assets: ['apps/api/src/assets'],
        },
      }

      return json
    })

    // Clean up webpack config if it exists
    const webpackConfigPath = 'apps/api/webpack.config.js'
    if (tree.exists(webpackConfigPath)) {
      tree.delete(webpackConfigPath)
    }
  } else {
    console.warn(`Could not find ${projectJsonPath}`)
  }

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

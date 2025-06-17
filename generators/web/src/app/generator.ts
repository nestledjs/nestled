import { generateFiles, joinPathFragments, Tree, updateJson } from '@nx/devkit'
import { applicationGenerator } from '@nx/react/src/generators/application/application'
import * as path from 'path'
import { WebAppGeneratorSchema } from './schema'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'

export default async function (tree: Tree, schema: WebAppGeneratorSchema) {
  try {
    if (!tree.exists('apps')) {
      tree.write('apps/.gitkeep', '')
    }

    // Run the Nx generator command directly from the workspace root with a proper workspace layout
    await applicationGenerator(tree, {
      name: 'web',
      directory: 'apps/web',
      bundler: 'vite',
      style: 'none',
      routing: true,
      useReactRouter: true,
      unitTestRunner: 'vitest',
      e2eTestRunner: 'none',
      linter: 'eslint',
    })

    // Add dev:web script to package.json
    updateJson(tree, 'package.json', (json) => {
      if (!json.scripts) {
        json.scripts = {}
      }
      json.scripts['dev:web'] = 'nx serve web'
      return json
    })

    // Generate custom files
    const targetPath = path.join('apps', 'web')
    if (tree.exists(targetPath)) {
      generateFiles(tree, joinPathFragments(__dirname, './files'), targetPath, {
        ...schema,
        tmpl: '',
        npmScope: getNpmScope(tree),
      })
    } else {
      console.error(`Target path ${targetPath} does not exist after generation`)
    }
  } catch (error) {
    console.error('Error generating Web app:', error)
    throw error
  }
}

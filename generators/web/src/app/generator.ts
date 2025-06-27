import { generateFiles, joinPathFragments, Tree } from '@nx/devkit'
import { applicationGenerator } from '@nx/react/src/generators/application/application'
import * as path from 'path'
import { WebAppGeneratorSchema } from './schema'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import { addToGitignore, addScriptToPackageJson } from '@nestledjs/utils'

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
    addScriptToPackageJson(tree, 'dev:web', 'nx serve web')
    addScriptToPackageJson(tree, 'typecheck', 'cd apps/web && react-router typegen && tsc && cd ../../')
    addScriptToPackageJson(tree, 'typecheck:watch', 'cd apps/web && react-router typegen --watch')

    // Generate custom files
    const targetPath = path.join('apps', 'web')
    if (tree.exists(targetPath)) {
      generateFiles(tree, joinPathFragments(__dirname, './files'), targetPath, {
        ...schema,
        tmpl: '',
        npmScope: getNpmScope(tree),
      })

      // Ensure !/apps/web/.react-router/ is in .gitignore
      addToGitignore(tree, '!/apps/web/.react-router/')
    } else {
      console.error(`Target path ${targetPath} does not exist after generation`)
    }
  } catch (error) {
    console.error('Error generating Web app:', error)
    throw error
  }
}

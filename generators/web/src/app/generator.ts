import { generateFiles, joinPathFragments, Tree, updateJson } from '@nx/devkit'
import { applicationGenerator } from '@nx/react/src/generators/application/application'
import * as path from 'path'
import { WebAppGeneratorSchema } from './schema'

export default async function (tree: Tree, schema: WebAppGeneratorSchema) {
  try {
    const workspaceRoot = tree.root

    // Create the apps directory if it doesn't exist
    if (!tree.exists('apps')) {
      tree.write('apps/.gitkeep', '')
    }

    // Run the Nx generator command directly from the workspace root with a proper workspace layout
    await applicationGenerator(tree, {
      name: 'web',
      directory: 'apps/web',
      bundler: 'vite',
      style: 'tailwind',
      routing: true,
      useReactRouter: true,
      unitTestRunner: 'vitest',
      e2eTestRunner: 'none',
      linter: 'eslint',
    })

    // Wait a bit for files to be created
    // await new Promise((resolve) => setTimeout(resolve, 2000))

    // Delete the postcss.config.js file from the apps/web directory if it exists
    const postcssConfigPath = path.join('apps', 'web', 'postcss.config.js')
    if (tree.exists(postcssConfigPath)) {
      tree.delete(postcssConfigPath)
    }

    // Delete the tailwind config file from the apps/web directory if it exists
    const tailwindConfigJsPath = path.join('apps', 'web', 'tailwind.config.js')
    const tailwindConfigTsPath = path.join('apps', 'web', 'tailwind.config.ts')
    if (tree.exists(tailwindConfigJsPath)) {
      tree.delete(tailwindConfigJsPath)
    }
    if (tree.exists(tailwindConfigTsPath)) {
      tree.delete(tailwindConfigTsPath)
    }

    // Add dev:web script to package.json
    updateJson(tree, 'package.json', (json) => {
      if (!json.scripts) {
        json.scripts = {}
      }
      json.scripts['dev:web'] = 'nx serve web'
      return json
    })

    // Generate custom files
    const targetPath = path.join('apps', 'web', 'src')
    if (tree.exists(targetPath)) {
      generateFiles(tree, joinPathFragments(__dirname, './files'), targetPath, { ...schema, tmpl: '' })

      // Delete the unused default app files
      // const filesToDelete = [path.join(targetPath, 'assets'), path.join(targetPath, 'app')]

      // filesToDelete.forEach((filePath) => {
      //   if (tree.exists(filePath)) {
      //     tree.delete(filePath)
      //   }
      // })

      // Overwrite vite.config.ts in the apps/web directory with the custom template
      const viteConfigPath = path.join('apps', 'web', 'vite.config.ts')
      generateFiles(tree, joinPathFragments(__dirname, './files'), 'apps/web', { ...schema, tmpl: '' })
    } else {
      console.error(`Target path ${targetPath} does not exist after generation`)
    }
  } catch (error) {
    console.error('Error generating Web app:', error)
    throw error
  }
}

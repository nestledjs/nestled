import { generateFiles, joinPathFragments, Tree, updateJson } from '@nx/devkit'
import { execSync } from 'child_process'
import * as path from 'path'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'

/**
 * Removes specific compiler options from tsconfig.app.json to use the settings from tsconfig.base.json
 * @param tree The file system tree
 */
function updateAppTsConfig(tree: Tree): void {
  const tsConfigPath = 'apps/api/tsconfig.app.json'
  if (tree.exists(tsConfigPath)) {
    updateJson(tree, tsConfigPath, (json) => {
      if (json.compilerOptions) {
        // Remove specific options to use the ones from tsconfig.base.json
        delete json.compilerOptions.module
        delete json.compilerOptions.moduleResolution
        delete json.compilerOptions.emitDecoratorMetadata
        delete json.compilerOptions.experimentalDecorators
      }
      return json
    })
  } else {
    console.warn(`tsconfig.app.json not found at: ${tsConfigPath}`)
  }
}

interface Schema {
  [key: string]: unknown
}

export default async function (tree: Tree, schema: Schema) {
  try {
    // Get the workspace root directory
    const workspaceRoot = tree.root

    // Create apps directory if it doesn't exist
    if (!tree.exists('apps')) {
      tree.write('apps/.gitkeep', '')
    }

    // Run the Nx generator command directly from the workspace root with proper workspace layout
    execSync('nx g @nx/nest:application --name api --directory apps/api --no-interactive', {
      stdio: 'inherit',
      cwd: workspaceRoot,
    })

    // Wait a bit for files to be created
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Update tsconfig.app.json to remove specific compiler options
    updateAppTsConfig(tree)

    // Generate all files according to the template folder structure
    generateFiles(
      tree,
      joinPathFragments(__dirname, './files'),
      path.join('apps', 'api'),
      { ...schema, tmpl: '', npmScope: getNpmScope(tree) }
    );

    // Add dev:api script to package.json
    updateJson(tree, 'package.json', (json) => {
      if (!json.scripts) {
        json.scripts = {}
      }
      json.scripts['dev:api'] = 'nx serve api --skip-nx-cache'
      return json
    })

    // Update the build target in apps/api/project.json to use custom webpack command
    const projectJsonPath = path.join('apps', 'api', 'project.json')
    if (tree.exists(projectJsonPath)) {
      updateJson(tree, projectJsonPath, (json) => {
        json.targets = json.targets || {}
        json.targets.build = {
          executor: 'nx:run-commands',
          options: {
            command: 'NODE_ENV=production webpack-cli --config apps/api/webpack.config.js',
          },
          configurations: {
            development: {
              command: 'NODE_ENV=development webpack-cli --config apps/api/webpack.config.js',
            },
          },
        }
        return json
      })
    } else {
      console.warn(`project.json not found at: ${projectJsonPath}`)
    }

    // Optionally, delete the unused default app files if they exist
    const targetPath = path.join('apps', 'api', 'src')
    const filesToDelete = [path.join(targetPath, 'assets'), path.join(targetPath, 'app')]
    filesToDelete.forEach((filePath) => {
      if (tree.exists(filePath)) {
        tree.delete(filePath)
      }
    })
  } catch (error) {
    console.error('Error generating API app:', error)
    throw error
  }
}

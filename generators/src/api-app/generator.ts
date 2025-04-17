import { generateFiles, joinPathFragments, Tree, updateJson } from '@nx/devkit'
import { execSync } from 'child_process'
import { installPlugins } from './utils/install-plugins'
import * as path from 'path'

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

    // Install required plugins
    const installTask = await installPlugins(tree)

    // Update webpack.config.js to remove assets and add sourceMap: false
    const webpackConfigPath = 'apps/api/webpack.config.js'
    if (tree.exists(webpackConfigPath)) {
      try {
        const webpackConfig = tree.read(webpackConfigPath, 'utf-8')
        if (!webpackConfig) {
          console.error('Failed to read webpack.config.js')
          return installTask
        }
        // Remove assets line - improved regex
        let updatedConfig = webpackConfig.replace(/assets: \[".\/src\/assets"\],?\s*\n?/, '');
        console.log('Successfully removed assets line from webpack.config.js (if present)');

        // Add sourceMap: false after generatePackageJson: true,
        const generatePkgJsonRegex = /^(\s*)generatePackageJson: true,/m;
        const match = updatedConfig.match(generatePkgJsonRegex);

        if (match) {
            const indentation = match[1]; // Capture the indentation
            updatedConfig = updatedConfig.replace(
                generatePkgJsonRegex,
                `${match[0]}\n${indentation}sourceMap: false,` // Use captured indentation for the new line
            );
            console.log('Successfully added sourceMap: false to webpack.config.js');
        } else {
            // Log a warning if the anchor point isn't found, as the Nx generator output might change
            console.warn('Could not find "generatePackageJson: true," line in webpack.config.js to insert sourceMap config.');
        }

        tree.write(webpackConfigPath, updatedConfig)
      } catch (error) {
        console.error('Error modifying webpack.config.js:', error)
      }
    } else {
      console.error('webpack.config.js not found at:', webpackConfigPath)
    }

    // Add dev:api script to package.json
    updateJson(tree, 'package.json', (json) => {
      if (!json.scripts) {
        json.scripts = {}
      }
      json.scripts['dev:api'] = 'nx serve api --skip-nx-cache'
      return json
    })

    // Generate custom files
    const targetPath = path.join('apps', 'api', 'src')
    if (tree.exists(targetPath)) {
      generateFiles(tree, joinPathFragments(__dirname, './files'), targetPath, { ...schema, tmpl: '' })

      // Delete the unused default app files
      const filesToDelete = [path.join(targetPath, 'assets'), path.join(targetPath, 'app')]

      filesToDelete.forEach((filePath) => {
        if (tree.exists(filePath)) {
          tree.delete(filePath)
        }
      })
    } else {
      console.error(`Target path ${targetPath} does not exist after generation`)
    }

    return installTask
  } catch (error) {
    console.error('Error generating API app:', error)
    throw error
  }
}

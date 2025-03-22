import { generateFiles, joinPathFragments, Tree, updateJson } from '@nx/devkit'
import { applicationGenerator as nestApplicationGenerator } from '@nx/nest'
import { installPlugins } from './utils/install-plugins'

interface Schema {
  [key: string]: unknown
}

export default async function (tree: Tree, schema: Schema) {
  // Generate the nest application using the built-in generator
  await nestApplicationGenerator(tree, {
    name: 'api',
    directory: 'apps/api',
    strict: true,
  })

  // Install required plugins
  const installTask = await installPlugins(tree)

  // Update the project configuration to use tsc instead of webpack
  const projectJsonPath = 'apps/api/project.json'
  if (tree.exists(projectJsonPath)) {
    updateJson(tree, projectJsonPath, (json) => {
      // Update build target to use tsc
      json.targets.build = {
        executor: '@nx/js:tsc',
        outputs: ['{options.outputPath}'],
        options: {
          outputPath: 'dist/out-tsc',
          main: 'apps/api/src/main.ts',
          tsConfig: 'apps/api/tsconfig.app.json',
        },
      }

      // Update serve target for consistency
      json.targets.serve = {
        executor: '@nx/js:node',
        options: {
          buildTarget: 'api:build',
          watch: true,
        },
      }

      return json
    })
  }

  // Update tsconfig.base.json
  updateJson(tree, 'tsconfig.base.json', (json) => {
    json.compilerOptions = {
      ...json.compilerOptions,
      strict: true,
      noImplicitAny: true,
      strictNullChecks: true,
      strictFunctionTypes: true,
      strictBindCallApply: true,
      strictPropertyInitialization: true,
      noImplicitThis: true,
      alwaysStrict: true,
      esModuleInterop: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      skipLibCheck: true,
      skipDefaultLibCheck: true,
      baseUrl: '.',
      module: 'commonjs',
      moduleResolution: 'node',
      declaration: true,
      resolveJsonModule: true,
    }
    return json
  })

  // Update app's tsconfig.app.json
  updateJson(tree, 'apps/api/tsconfig.app.json', (json) => {
    json.compilerOptions = {
      ...json.compilerOptions,
      outDir: '../../dist/out-tsc',
      module: 'commonjs',
      types: ['node'],
      emitDecoratorMetadata: true,
      target: 'es2021',
    }
    json.include = [
      'src/**/*.ts',
      '../../libs/api/**/*.ts'  // Include all API library files
    ]
    json.exclude = ['jest.config.ts', 'src/**/*.spec.ts', 'src/**/*.test.ts']
    return json
  })

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

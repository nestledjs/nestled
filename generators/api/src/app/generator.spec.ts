import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { execSync } from 'child_process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import generator from './generator'

vi.mock('child_process', async (importOriginal) => {
  const originalModule = await importOriginal()
  return {
    ...(originalModule as object),
    execSync: vi.fn(),
  }
})

describe('api generator', () => {
  let tree: Tree
  const mockedExecSync = execSync as ReturnType<(typeof vi)['fn']>

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    tree.write('package.json', JSON.stringify({ name: 'test-repo', scripts: {} }))

    mockedExecSync.mockImplementation((command: string) => {
      if (command.startsWith('nx g @nx/nest:application')) {
        tree.write(
          'apps/api/webpack.config.js',
          `
const path = require('path');
const { composePlugins, withNx } = require('@nx/webpack');

module.exports = composePlugins(withNx(), (config) => {
  return {
    ...config,
    output: {
      ...config.output,
      devtoolModuleFilenameTemplate: (info) => {
        const rel = path.relative(process.cwd(), info.absoluteResourcePath);
        return \`webpack://\${rel}\`;
      },
    },
    assets: ['./src/assets'],
    generatePackageJson: true,
  };
});`
        )
        // Add a mock tsconfig.app.json file with the compiler options we want to remove
        tree.write('apps/api/tsconfig.app.json', JSON.stringify({
          extends: '../../tsconfig.base.json',
          compilerOptions: {
            module: 'commonjs',
            moduleResolution: 'node',
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
            outDir: '../../dist/out-tsc',
            declaration: true,
            types: ['node']
          },
          exclude: ['jest.config.ts', '**/*.spec.ts', '**/*.test.ts'],
          include: ['**/*.ts']
        }, null, 2))
        tree.write('apps/api/src/app/.gitkeep', '')
        tree.write('apps/api/src/assets/.gitkeep', '')
      }
      return ''
    })

    vi.spyOn(console, 'log').mockImplementation(() => { /* empty */ })
    vi.spyOn(console, 'warn').mockImplementation(() => { /* empty */ })
    vi.spyOn(console, 'error').mockImplementation(() => { /* empty */ })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mockedExecSync.mockClear()
  })

  it('should run successfully', async () => {
    await generator(tree, {})

    expect(mockedExecSync).toHaveBeenCalledWith(
      'nx g @nx/nest:application --name api --directory apps/api --no-interactive',
      {
        stdio: 'inherit',
        cwd: tree.root,
      }
    )

    const webpackConfig = tree.read('apps/api/webpack.config.js', 'utf-8')
    expect(webpackConfig).not.toContain("assets: ['./src/assets']")

    const packageJson = JSON.parse(tree.read('package.json', 'utf-8'))
    expect(packageJson.scripts['dev:api']).toBe('nx serve api --skip-nx-cache')

    expect(tree.exists('apps/api/src/app')).toBe(false)
    expect(tree.exists('apps/api/src/assets')).toBe(false)

    expect(tree.exists('apps/api/src/app.config.ts')).toBe(true)
    expect(tree.exists('apps/api/src/app.module.ts')).toBe(true)
    expect(tree.exists('apps/api/src/applogger.middleware.ts')).toBe(true)
    expect(tree.exists('apps/api/src/main.ts')).toBe(true)

    // Verify that the compiler options are removed from tsconfig.app.json
    const tsConfig = JSON.parse(tree.read('apps/api/tsconfig.app.json', 'utf-8'))
    expect(tsConfig.compilerOptions.module).toBeUndefined()
    expect(tsConfig.compilerOptions.moduleResolution).toBeUndefined()
    expect(tsConfig.compilerOptions.emitDecoratorMetadata).toBeUndefined()
    expect(tsConfig.compilerOptions.experimentalDecorators).toBeUndefined()
    // Verify that other compiler options are preserved
    expect(tsConfig.compilerOptions.outDir).toBe('../../dist/out-tsc')
    expect(tsConfig.compilerOptions.declaration).toBe(true)
  })
})

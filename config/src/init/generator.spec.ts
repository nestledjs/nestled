import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { readJson, Tree } from '@nx/devkit'
import { execSync } from 'child_process'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { initConfigGenerator } from './generator'

vi.mock('child_process')

describe('init-config generator', () => {
  let tree: Tree
  // @ts-expect-error Intellij vitest namespace issue
  const mockedExecSync = execSync as vi.MockedFunction<typeof execSync>

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    mockedExecSync.mockClear()
  })

  it('should update tsconfig.base.json correctly', async () => {
    const initialTsConfig = {
      compilerOptions: {
        emitDeclarationOnly: true,
        someOtherOption: 'value',
      },
    }
    tree.write('tsconfig.base.json', JSON.stringify(initialTsConfig))

    await initConfigGenerator(tree)

    const updatedTsConfig = readJson(tree, 'tsconfig.base.json')
    expect(updatedTsConfig.compilerOptions.baseUrl).toBe('.')
    expect(updatedTsConfig.compilerOptions.emitDeclarationOnly).toBeUndefined()
    expect(updatedTsConfig.compilerOptions.someOtherOption).toBe('value')
  })

  it('should remove workspaces from package.json', async () => {
    const initialPackageJson = {
      name: 'test-repo',
      workspaces: ['packages/*'],
    }
    tree.write('package.json', JSON.stringify(initialPackageJson))

    await initConfigGenerator(tree)

    const updatedPackageJson = readJson(tree, 'package.json')
    expect(updatedPackageJson.workspaces).toBeUndefined()
  })

  it('should not throw if tsconfig.base.json does not exist', async () => {
    await expect(initConfigGenerator(tree)).resolves.toBeDefined()
  })

  it('should not throw if package.json does not exist', async () => {
    await expect(initConfigGenerator(tree)).resolves.toBeDefined()
  })

  it('should return a callback that runs pnpm install', async () => {
    const callback = await initConfigGenerator(tree)
    callback()

    expect(mockedExecSync).toHaveBeenCalledWith('pnpm install', {
      stdio: 'inherit',
    })
  })

  it('should handle error during pnpm install', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockedExecSync.mockImplementation(() => {
      throw new Error('pnpm failed')
    })

    const callback = await initConfigGenerator(tree)
    callback()

    expect(mockedExecSync).toHaveBeenCalledWith('pnpm install', {
      stdio: 'inherit',
    })
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to run pnpm install:', expect.any(Error))
    consoleErrorSpy.mockRestore()
  })
})

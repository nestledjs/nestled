import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { readJson, Tree } from '@nx/devkit'
import { execSync } from 'child_process'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as yaml from 'yaml'

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

  it('should remove workspaces from package.json', async () => {
    const initialPackageJson = {
      name: '@test/test-repo',
      workspaces: ['packages/*'],
    }
    tree.write('package.json', JSON.stringify(initialPackageJson))

    await initConfigGenerator(tree)

    const updatedPackageJson = readJson(tree, 'package.json')
    expect(updatedPackageJson.workspaces).toBeUndefined()
  })

  it('should add the clean script to package.json', async () => {
    tree.write('package.json', JSON.stringify({ name: '@test/test-repo' }))
    await initConfigGenerator(tree)
    const updatedPackageJson = readJson(tree, 'package.json')
    expect(updatedPackageJson.scripts.clean).toBe(
      'git reset --hard HEAD && git clean -fd && rm -rf node_modules && rm -rf tmp && rm -rf dist && rm -rf apps && rm -rf libs && pnpm install',
    )
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
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {
      // Mock implementation
    })
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

  describe('pnpm-workspace.yaml', () => {
    it('should create pnpm-workspace.yaml if it does not exist', async () => {
      await initConfigGenerator(tree)

      const workspaceYaml = tree.read('pnpm-workspace.yaml', 'utf-8')
      expect(workspaceYaml).toBeDefined()
      const parsedYaml = yaml.parse(workspaceYaml)
      expect(parsedYaml.packages).toEqual(['apps/**', 'libs/**', 'tools/*'])
    })

    it('should add packages to an existing pnpm-workspace.yaml', async () => {
      tree.write('pnpm-workspace.yaml', 'packages:\n  - some-other-package')
      await initConfigGenerator(tree)

      const workspaceYaml = tree.read('pnpm-workspace.yaml', 'utf-8')
      const parsedYaml = yaml.parse(workspaceYaml)
      expect(parsedYaml.packages).toEqual(
        expect.arrayContaining(['apps/**', 'libs/**', 'tools/*', 'some-other-package']),
      )
    })

    it('should not add duplicate packages to pnpm-workspace.yaml', async () => {
      tree.write('pnpm-workspace.yaml', 'packages:\n  - apps/**\n  - existing-package')
      await initConfigGenerator(tree)

      const workspaceYaml = tree.read('pnpm-workspace.yaml', 'utf-8')
      const parsedYaml = yaml.parse(workspaceYaml)
      expect(parsedYaml.packages).toHaveLength(4)
      expect(parsedYaml.packages).toEqual(expect.arrayContaining(['apps/**', 'libs/**', 'tools/*', 'existing-package']))
    })

    it('should handle an empty pnpm-workspace.yaml file', async () => {
      tree.write('pnpm-workspace.yaml', '')
      await initConfigGenerator(tree)

      const workspaceYaml = tree.read('pnpm-workspace.yaml', 'utf-8')
      const parsedYaml = yaml.parse(workspaceYaml)
      expect(parsedYaml.packages).toEqual(['apps/**', 'libs/**', 'tools/*'])
    })
  })
})

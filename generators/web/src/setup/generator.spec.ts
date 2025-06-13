import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as devkit from '@nx/devkit'
import * as utils from '@nestled/utils'
import { webSetupGenerator } from './generator'

describe('webSetupGenerator', () => {
  let tree: Tree
  let addDependenciesSpy: ReturnType<typeof vi['spyOn']>
  let updatePnpmWorkspaceConfigSpy: ReturnType<typeof vi['spyOn']>
  let pnpmInstallCallbackSpy: ReturnType<typeof vi['spyOn']>
  let installCallback: ReturnType<typeof vi['fn']>

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    addDependenciesSpy = vi.spyOn(devkit, 'addDependenciesToPackageJson').mockImplementation(() => undefined as any)
    updatePnpmWorkspaceConfigSpy = vi.spyOn(utils, 'updatePnpmWorkspaceConfig').mockImplementation(() => undefined as any)
    installCallback = vi.fn()
    pnpmInstallCallbackSpy = vi.spyOn(utils, 'pnpmInstallCallback').mockReturnValue(installCallback)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should add dependencies, update pnpm workspace config, and run install callback', async () => {
    const result = await webSetupGenerator(tree)

    expect(addDependenciesSpy).toHaveBeenCalledWith(
      tree,
      expect.objectContaining({
        'react-router-dom': expect.any(String),
        'isbot': expect.any(String),
      }),
      expect.objectContaining({
        '@react-router/dev': expect.any(String),
        '@nx/react': expect.any(String),
        'vite-tsconfig-paths': expect.any(String),
        '@tailwindcss/vite': expect.any(String),
        'tailwindcss': expect.any(String),
        '@tailwindcss/postcss': expect.any(String),
      })
    )
    expect(updatePnpmWorkspaceConfigSpy).toHaveBeenCalledWith(tree, { onlyBuiltDependencies: ['@tailwindcss/oxide'] })
    expect(pnpmInstallCallbackSpy).toHaveBeenCalled()
    expect(result).toBe(installCallback)
  })
}) 
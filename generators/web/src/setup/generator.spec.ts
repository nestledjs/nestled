import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import * as devkit from '@nx/devkit'
import { Tree } from '@nx/devkit'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as utils from '@nestledjs/utils'
import { webSetupGenerator } from './generator'

describe('webSetupGenerator', () => {
  let tree: Tree
  let addDependenciesSpy: ReturnType<(typeof vi)['spyOn']>
  let updatePnpmWorkspaceConfigSpy: ReturnType<(typeof vi)['spyOn']>
  let pnpmInstallCallbackSpy: ReturnType<(typeof vi)['spyOn']>
  let installCallback: ReturnType<(typeof vi)['fn']>

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    addDependenciesSpy = vi.spyOn(devkit, 'addDependenciesToPackageJson').mockImplementation(() => undefined as any)
    updatePnpmWorkspaceConfigSpy = vi
      .spyOn(utils, 'updatePnpmWorkspaceConfig')
      .mockImplementation(() => undefined as any)
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
      {
        '@apollo/client': '^3.13.8',
        '@apollo/client-integration-react-router': '0.12.0-alpha.4',
        '@react-router/dev': '^7.6.2',
        isbot: '5.1.28',
        'react-router-dom': '^7.6.2',
      },
      {
        '@nx/react': '21.1.3',
        '@tailwindcss/vite': '^4.1.8',
        tailwindcss: '^4.1.8',
        'vite-tsconfig-paths': '^5.1.4',
      },
    )
    expect(updatePnpmWorkspaceConfigSpy).toHaveBeenCalledWith(tree, { onlyBuiltDependencies: ['@tailwindcss/oxide'] })
    expect(pnpmInstallCallbackSpy).not.toHaveBeenCalled()
    await result()
    expect(pnpmInstallCallbackSpy).toHaveBeenCalled()
    expect(installCallback).toHaveBeenCalled()
  })
})

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
  let installCallback: ReturnType<(typeof vi)['fn']>

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    installCallback = vi.fn()
    addDependenciesSpy = vi.spyOn(devkit, 'addDependenciesToPackageJson').mockReturnValue(installCallback)
    updatePnpmWorkspaceConfigSpy = vi
      .spyOn(utils, 'updatePnpmWorkspaceConfig')
      .mockImplementation(() => undefined as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should add dependencies, update pnpm workspace config, and run install callback', async () => {
    const result = await webSetupGenerator(tree)

    expect(addDependenciesSpy).toHaveBeenCalledWith(
      tree,
      {
        '@react-router/node': '7.6.2',
        '@react-router/serve': '7.6.2',
        react: '19.0.0',
        'react-dom': '19.0.0',
        'react-router': '7.6.2',
        'react-router-dom': '^7.6.2',
        '@react-router/dev': '^7.6.2',
        isbot: '5.1.28',
        '@apollo/client': '^3.13.8',
        '@apollo/client-integration-react-router': '0.12.0-alpha.4',
      },
      {
        '@nx/react': '21.2.1',
        '@tailwindcss/vite': '^4.1.8',
        tailwindcss: '^4.1.8',
        'vite-tsconfig-paths': '^5.1.4',
        '@testing-library/dom': '10.4.0',
        '@testing-library/react': '16.1.0',
        '@types/react': '19.0.0',
        '@types/react-dom': '19.0.0',
        '@vitejs/plugin-react': '4.5.2',
        'eslint-plugin-import': '2.31.0',
        'eslint-plugin-react': '7.35.0',
        'eslint-plugin-react-hooks': '5.0.0',
        'jsonc-eslint-parser': '2.4.0',
      },
    )
    expect(updatePnpmWorkspaceConfigSpy).toHaveBeenCalledWith(tree, { onlyBuiltDependencies: ['@tailwindcss/oxide'] })
    await result()
    expect(installCallback).toHaveBeenCalled()
  })
})

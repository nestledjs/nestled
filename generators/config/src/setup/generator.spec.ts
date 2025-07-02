import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Tree } from '@nx/devkit'

// Mock the utility functions and addDependenciesToPackageJson
vi.mock('@nx/devkit', async () => {
  const actual = await vi.importActual<typeof import('@nx/devkit')>('@nx/devkit')
  return {
    ...actual,
    addDependenciesToPackageJson: vi.fn(),
  }
})
vi.mock('@nestledjs/utils', () => ({
  pnpmInstallCallback: vi.fn(() => undefined),
  removeWorkspacesFromPackageJson: vi.fn(),
  updatePnpmWorkspaceConfig: vi.fn(),
}))

import { configSetupGenerator } from './generator'
import { addDependenciesToPackageJson } from '@nx/devkit'
import { pnpmInstallCallback, removeWorkspacesFromPackageJson } from '@nestledjs/utils'

describe('configSetupGenerator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    tree.write('package.json', JSON.stringify({ dependencies: {}, devDependencies: {} }, null, 2))
    vi.clearAllMocks()
  })

  it('should call addDependenciesToPackageJson and utilities', async () => {
    await configSetupGenerator(tree)
    // Get the actual call arguments
    const call = (addDependenciesToPackageJson as any).mock.calls[0]
    const devDeps = call[2]
    expect(Object.keys(devDeps)).toContain('@prisma/internals')
    expect(['^6.11.0', '^']).toContain(devDeps['@prisma/internals'])
    expect(removeWorkspacesFromPackageJson).toHaveBeenCalledWith(tree)
    expect(pnpmInstallCallback).toHaveBeenCalled()
  })

  it('should remove composite and declarationMap from tsconfig.base.json but not emitDeclarationOnly', async () => {
    const initialTsConfig = {
      compilerOptions: {
        composite: true,
        declarationMap: true,
        emitDeclarationOnly: true,
        someOtherOption: 'value',
      },
    }
    tree.write('tsconfig.base.json', JSON.stringify(initialTsConfig, null, 2))

    await configSetupGenerator(tree)

    const updatedTsConfig = JSON.parse(tree.read('tsconfig.base.json', 'utf-8'))
    expect(updatedTsConfig.compilerOptions.composite).toBeUndefined()
    expect(updatedTsConfig.compilerOptions.declarationMap).toBeUndefined()
    expect(updatedTsConfig.compilerOptions.emitDeclarationOnly).toBeUndefined()
    expect(updatedTsConfig.compilerOptions.someOtherOption).toBe('value')
  })
})

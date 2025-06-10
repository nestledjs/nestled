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
vi.mock('@nestled/utils', () => ({
  pnpmInstallCallback: vi.fn(() => () => {}),
  removeWorkspacesFromPackageJson: vi.fn(),
}))

import { configSetupGenerator } from './generator'
import { addDependenciesToPackageJson } from '@nx/devkit'
import { pnpmInstallCallback, removeWorkspacesFromPackageJson } from '@nestled/utils'

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
    expect(['^6.9.0', '^']).toContain(devDeps['@prisma/internals'])
    expect(removeWorkspacesFromPackageJson).toHaveBeenCalledWith(tree)
    expect(pnpmInstallCallback).toHaveBeenCalled()
  })
}) 
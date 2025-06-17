import { formatFiles, installPackagesTask, Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { describe, expect, it, vi } from 'vitest'
import { apiLibraryGenerator } from '@nestledjs/utils'

import generator from './generator'

vi.mock('@nestledjs/utils', async () => {
  const actual = await vi.importActual('@nestledjs/utils')
  return {
    ...actual,
    apiLibraryGenerator: vi.fn(),
  }
})

vi.mock('@nx/devkit', async () => {
  const actual = await vi.importActual('@nx/devkit')
  return {
    ...actual,
    formatFiles: vi.fn(),
    installPackagesTask: vi.fn(),
  }
})

describe('user generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('should run successfully', async () => {
    const callback = await generator(tree)
    callback()

    expect(apiLibraryGenerator).toHaveBeenCalledWith(tree, { name: 'user' }, expect.any(String), 'data-access')
    expect(apiLibraryGenerator).toHaveBeenCalledWith(tree, { name: 'user' }, expect.any(String), 'feature', true)
    expect(formatFiles).toHaveBeenCalledWith(tree)
    expect(installPackagesTask).toHaveBeenCalledWith(tree)
  })
})

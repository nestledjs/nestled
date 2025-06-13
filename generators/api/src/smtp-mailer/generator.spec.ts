import { formatFiles, Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { describe, expect, it, vi } from 'vitest'
import { apiLibraryGenerator } from '@nestled/utils'
import { installPackagesTask } from '@nx/devkit'

import generator from './generator'

vi.mock('@nestled/utils', async () => {
  const actual = await vi.importActual('@nestled/utils')
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

describe('mailer generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('should run successfully', async () => {
    const callback = await generator(tree)
    callback()

    expect(apiLibraryGenerator).toHaveBeenCalledWith(tree, { name: 'smtp-mailer' }, expect.any(String), 'data-access')
    expect(formatFiles).toHaveBeenCalledWith(tree)
    expect(installPackagesTask).toHaveBeenCalledWith(tree)
  })
}) 
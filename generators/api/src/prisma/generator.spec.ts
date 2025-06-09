import { formatFiles, installPackagesTask, Tree, updateJson } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { describe, expect, it, vi } from 'vitest'
import { apiLibraryGenerator } from '@nestled/utils'

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

describe('prisma generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    tree.write('package.json', JSON.stringify({ name: 'test' }))
  })

  it('should run successfully', async () => {
    const callback = await generator(tree)
    callback()

    const packageJson = JSON.parse(tree.read('package.json', 'utf-8'))

    expect(packageJson.prisma).toEqual({
      schema: 'libs/api/prisma/src/lib/schemas',
      seed: 'ts-node libs/api/prisma/src/lib/seed/seed.ts',
    })

    expect(packageJson.scripts['generate:models']).toBe('ts-node libs/api/core/data-access/src/scripts/generate-models.ts')

    expect(apiLibraryGenerator).toHaveBeenCalledWith(tree, { name: 'prisma', overwrite: false }, expect.any(String))
    expect(formatFiles).toHaveBeenCalledWith(tree)
    expect(installPackagesTask).toHaveBeenCalledWith(tree)
  })

  it('should pass overwrite flag to apiLibraryGenerator when overwrite is true', async () => {
    tree.write('package.json', JSON.stringify({ name: 'test' }))
    const callback = await generator(tree, { overwrite: true })
    callback()

    expect(apiLibraryGenerator).toHaveBeenCalledWith(tree, { name: 'prisma', overwrite: true }, expect.any(String))
  })
}) 
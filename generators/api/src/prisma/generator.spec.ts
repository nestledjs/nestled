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

describe('prisma generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    tree.write('package.json', JSON.stringify({ name: '@test/test' }))
  })

  it('should run successfully', async () => {
    const callback = await generator(tree)
    callback()

    const packageJson = JSON.parse(tree.read('package.json', 'utf-8'))

    // prisma.schema is deprecated and should not be set (now in prisma.config.ts)
    expect(packageJson.prisma?.schema).toBeUndefined()
    // prisma.seed is deprecated and should not be set (now in prisma.config.ts)
    expect(packageJson.prisma?.seed).toBeUndefined()
    // prisma object should be removed entirely when empty
    expect(packageJson.prisma).toBeUndefined()

    // prisma.config.ts should be generated
    expect(tree.exists('prisma.config.ts')).toBe(true)

    expect(packageJson.scripts['generate:models']).toBe(
      'ts-node --project libs/api/core/models/tsconfig.lib.json libs/api/core/models/src/lib/generate-models.ts',
    )

    expect(apiLibraryGenerator).toHaveBeenCalledWith(tree, { name: 'prisma', overwrite: false }, expect.any(String))
    expect(formatFiles).toHaveBeenCalledWith(tree)
    expect(installPackagesTask).toHaveBeenCalledWith(tree)
  })

  it('should pass overwrite flag to apiLibraryGenerator when overwrite is true', async () => {
    tree.write('package.json', JSON.stringify({ name: '@test/test' }))
    const callback = await generator(tree, { overwrite: true })
    callback()

    expect(apiLibraryGenerator).toHaveBeenCalledWith(tree, { name: 'prisma', overwrite: true }, expect.any(String))
  })
})

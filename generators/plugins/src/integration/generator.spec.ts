import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { formatFiles, generateFiles, joinPathFragments, Tree } from '@nx/devkit'
import generator from './generator'

vi.mock('@nx/devkit', async () => {
  const actual = await vi.importActual('@nx/devkit')
  return {
    ...actual,
    formatFiles: vi.fn(),
    generateFiles: vi.fn(),
    joinPathFragments: actual.joinPathFragments,
  }
})

describe('integration generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    // Simulate the index file existing
    tree.write('libs/api/integrations/src/lib/index.ts', '')
    vi.clearAllMocks()
  })

  it('should generate files and update index for smtp-mailer', async () => {
    await generator(tree, { name: 'smtp-mailer' })

    expect(generateFiles).toHaveBeenCalledWith(
      tree,
      expect.any(String),
      joinPathFragments('libs', 'api/integrations/src/lib', 'smtp-mailer'),
      expect.objectContaining({ name: 'smtp-mailer' }),
    )
    const indexContent = tree.read('libs/api/integrations/src/lib/index.ts', 'utf-8')
    expect(indexContent).toContain("export * from './smtp-mailer/smtp-mailer.service';")
    expect(indexContent).toContain("export * from './smtp-mailer/smtp-mailer.module';")
    expect(formatFiles).toHaveBeenCalledWith(tree)
  })

  it('should throw if name is not smtp-mailer', async () => {
    await expect(() => generator(tree, { name: 'not-allowed' } as any)).rejects.toThrow(
      "Currently, only 'smtp-mailer' is supported as an integration name."
    )
  })
})

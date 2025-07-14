import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { generateFiles, Tree } from '@nx/devkit'
import { applicationGenerator as realApplicationGenerator } from '@nx/react/src/generators/application/application'
import * as path from 'path'
import generator from './generator'

vi.mock('@nx/react/src/generators/application/application', () => {
  return {
    applicationGenerator: vi.fn(async (tree) => {
      // Simulate creation of 'apps/web' directory as the real generator would
      if (!tree.exists('apps/web')) {
        tree.write('apps/web/.gitkeep', '')
      }
    }),
  }
})

vi.mock('@nx/devkit', async () => {
  const actual = await import('@nx/devkit')
  return {
    ...actual,
    generateFiles: vi.fn(actual.generateFiles),
    updateJson: vi.fn(actual.updateJson),
    joinPathFragments: actual.joinPathFragments,
  }
})

vi.mock('@nx/js/src/utils/package-json/get-npm-scope', () => ({
  getNpmScope: vi.fn(() => 'test-scope'),
}))



describe('web generator', () => {
  let tree: Tree
  let schema: Record<string, unknown>

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    schema = {}
    vi.clearAllMocks()
  })

  it('should create apps/.gitkeep if apps does not exist', async () => {
    tree.delete('apps')
    await generator(tree, schema)
    expect(tree.exists('apps/.gitkeep')).toBe(true)
  })

  it('should call applicationGenerator with correct options', async () => {
    await generator(tree, schema)
    expect(realApplicationGenerator).toHaveBeenCalledWith(
      tree,
      expect.objectContaining({
        name: 'web',
        directory: 'apps/web',
        bundler: 'vite',
        style: 'none',
        routing: true,
        useReactRouter: true,
        unitTestRunner: 'vitest',
        e2eTestRunner: 'none',
        linter: 'eslint',
      }),
    )
  })

  it('should update package.json with dev:web script', async () => {
    tree.write('package.json', JSON.stringify({}))
    await generator(tree, schema)
    const pkg = JSON.parse(tree.read('package.json', 'utf-8')!)
    expect(pkg.scripts['dev:web']).toBe('nx serve web')
  })

  it('should call generateFiles with correct arguments if targetPath exists', async () => {
    const generateFilesMock = generateFiles as unknown as ReturnType<typeof vi.fn>
    tree.write(path.join('apps', 'web', 'dummy.txt'), 'test')
    await generator(tree, schema)
    expect(generateFilesMock).toHaveBeenCalled()
    // Check that the target path is correct
    const callArgs = generateFilesMock.mock.calls[0]
    expect(callArgs[2]).toBe(path.join('apps', 'web'))
    expect(callArgs[3].npmScope).toBe('test-scope')
  })

  it('should log error if targetPath does not exist', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    // Override the mock to NOT create the directory for this test
    const appGenMock = realApplicationGenerator as unknown as ReturnType<typeof vi.fn>
    appGenMock.mockImplementationOnce(async () => {
      /* do nothing */
    })
    // Remove apps/web to trigger error
    if (tree.exists('apps/web')) tree.delete('apps/web')
    await generator(tree, schema)
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('does not exist after generation'))
    errorSpy.mockRestore()
  })

  it('should throw and log error if an exception occurs', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    // Mock applicationGenerator to throw
    const appGenMock = realApplicationGenerator as unknown as ReturnType<typeof vi.fn>
    appGenMock.mockImplementationOnce(async () => { throw new Error('test error') })
    await expect(generator(tree, schema)).rejects.toThrow('test error')
    expect(errorSpy).toHaveBeenCalledWith('Error generating Web app:', expect.any(Error))
    errorSpy.mockRestore()
  })
})

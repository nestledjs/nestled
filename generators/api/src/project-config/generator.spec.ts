import { generateFiles, logger, Tree, formatFiles } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import generator from './generator'

vi.mock('@nx/devkit', async () => {
  const actual = await vi.importActual('@nx/devkit')
  return {
    ...actual,
    generateFiles: vi.fn(),
    formatFiles: vi.fn(),
    logger: {
      info: vi.fn(),
    },
  }
})

describe('project-config generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    vi.clearAllMocks()
  })

  it('should run successfully with default options', async () => {
    await generator(tree, {
      overwritePrettier: false,
      generateEnv: false,
      generateDocker: false,
      ignoreEnv: false,
    })
    expect(logger.info).toHaveBeenCalledWith('⏭️  Skipping .prettierrc generation')
    expect(logger.info).toHaveBeenCalledWith('⏭️  Skipping .env.example generation')
    expect(logger.info).toHaveBeenCalledWith('⏭️  Skipping Docker files generation')
    expect(logger.info).toHaveBeenCalledWith('⏭️  Skipping .env addition to .gitignore')
  })

  it('should generate prettier file if overwritePrettier is true', async () => {
    await generator(tree, { overwritePrettier: true, generateEnv: false, generateDocker: false, ignoreEnv: false })
    expect(generateFiles).toHaveBeenCalledWith(tree, expect.any(String), '.', expect.any(Object))
    expect(logger.info).toHaveBeenCalledWith('✅ Generated .prettierrc file')
  })

  it('should generate .env.example if generateEnv is true', async () => {
    await generator(tree, { overwritePrettier: false, generateEnv: true, generateDocker: false, ignoreEnv: false })
    expect(generateFiles).toHaveBeenCalledWith(tree, expect.any(String), '.', expect.any(Object))
    expect(logger.info).toHaveBeenCalledWith('✅ Generated .env.example file')
  })

  describe('with docker', () => {
    beforeEach(() => {
      tree.write('package.json', JSON.stringify({ scripts: {} }))
    })

    it('should generate docker files and update package.json if generateDocker is true', async () => {
      await generator(tree, { overwritePrettier: false, generateEnv: false, generateDocker: true, ignoreEnv: false })
      expect(generateFiles).toHaveBeenCalledWith(tree, expect.any(String), '.', expect.any(Object))
      expect(logger.info).toHaveBeenCalledWith('✅ Generated Dockerfile and docker-compose.yml')

      const pkg = JSON.parse(tree.read('package.json', 'utf-8'))
      expect(pkg.scripts['docker:build']).toBeDefined()
      expect(logger.info).toHaveBeenCalledWith('✅ Added scripts to package.json')
    })
  })

  describe('with gitignore', () => {
    it('should add .env to .gitignore if ignoreEnv is true', async () => {
      tree.write('.gitignore', '')
      await generator(tree, { overwritePrettier: false, generateEnv: false, generateDocker: false, ignoreEnv: true })
      const gitignore = tree.read('.gitignore', 'utf-8')
      expect(gitignore).toContain('.env')
      expect(logger.info).toHaveBeenCalledWith('✅ Added .env to .gitignore')
    })

    it('should not add .env to .gitignore if it already exists', async () => {
      tree.write('.gitignore', '.env')
      await generator(tree, { overwritePrettier: false, generateEnv: false, generateDocker: false, ignoreEnv: true })
      expect(logger.info).toHaveBeenCalledWith('ℹ️  .env already exists in .gitignore')
    })
  })

  describe('with eslint', () => {
    it('should update eslint.config.mjs', async () => {
      const eslintContent = `
        const eslintConfig = {
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*']
            }
          ]
        }
        export default eslintConfig;
      `
      tree.write('eslint.config.mjs', eslintContent)
      await generator(tree, { overwritePrettier: false, generateEnv: false, generateDocker: false, ignoreEnv: false })
      const updatedEslint = tree.read('eslint.config.mjs', 'utf-8')
      expect(updatedEslint).toContain('sourceTag: \'scope:api\'')
      expect(logger.info).toHaveBeenCalledWith('✅ Updated ESLint configuration with project boundary rules')
    })
  })

  it('should call formatFiles', async () => {
    await generator(tree, { overwritePrettier: false, generateEnv: false, generateDocker: false, ignoreEnv: false })
    expect(formatFiles).toHaveBeenCalledWith(tree)
  })
}) 
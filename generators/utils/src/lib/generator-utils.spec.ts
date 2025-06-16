import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { generateFiles, names, readJson, Tree, writeJson } from '@nx/devkit'
import {
  addScriptToPackageJson,
  deleteDirectory,
  deleteFiles,
  endsWithQuestionMark,
  generateTemplateFiles,
  getAllPrismaModels,
  getNpmScope,
  getPrismaSchemaPath,
  installPlugins,
  mapPrismaTypeToNestJsType,
  parsePrismaSchema,
  readPrismaSchema,
  removeQuestionMarkAtEnd,
  removeWorkspacesFromPackageJson,
  updateTsConfigPaths,
  updateTypeScriptConfigs,
} from './generator-utils'
import { getDMMF } from '@prisma/internals'

vi.mock('@nx/devkit', async (importOriginal) => {
  const original = await importOriginal<any>()
  return {
    ...original,
    generateFiles: vi.fn(),
  }
})

vi.mock('@prisma/internals', () => ({
  getDMMF: vi.fn(),
}))

describe('generator-utils', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    vi.mocked(generateFiles).mockReset()
  })

  describe('removeWorkspacesFromPackageJson', () => {
    it('should remove workspaces property from package.json', () => {
      const packageJson = {
        name: 'test-project',
        version: '0.0.1',
        workspaces: ['packages/*'],
      }
      writeJson(tree, 'package.json', packageJson)

      removeWorkspacesFromPackageJson(tree)

      const updatedPackageJson = readJson(tree, 'package.json')
      expect(updatedPackageJson.workspaces).toBeUndefined()
      expect(updatedPackageJson.name).toBe('test-project')
    })

    it('should handle package.json not existing', () => {
      expect(() => removeWorkspacesFromPackageJson(tree)).not.toThrow()
    })

    it('should handle workspaces property not existing', () => {
      const packageJson = {
        name: 'test-project',
        version: '0.0.1',
      }
      writeJson(tree, 'package.json', packageJson)

      removeWorkspacesFromPackageJson(tree)

      const updatedPackageJson = readJson(tree, 'package.json')
      expect(updatedPackageJson.workspaces).toBeUndefined()
    })
  })

  describe('deleteFiles', () => {
    it('should delete specified files', () => {
      tree.write('file1.txt', 'content')
      tree.write('file2.txt', 'content')
      deleteFiles(tree, ['file1.txt', 'file2.txt'])
      expect(tree.exists('file1.txt')).toBe(false)
      expect(tree.exists('file2.txt')).toBe(false)
    })

    it('should not throw if a file does not exist', () => {
      tree.write('file1.txt', 'content')
      expect(() => deleteFiles(tree, ['file1.txt', 'non-existent.txt'])).not.toThrow()
      expect(tree.exists('file1.txt')).toBe(false)
    })
  })

  describe('deleteDirectory', () => {
    it('should delete a directory and its contents', () => {
      tree.write('dir/file1.txt', 'content')
      tree.write('dir/subdir/file2.txt', 'content')
      deleteDirectory(tree, 'dir')
      expect(tree.exists('dir')).toBe(false)
    })

    it('should not throw if directory does not exist', () => {
      expect(() => deleteDirectory(tree, 'non-existent-dir')).not.toThrow()
    })
  })

  describe('endsWithQuestionMark', () => {
    it('should return true if string ends with ?', () => {
      expect(endsWithQuestionMark('hello?')).toBe(true)
    })

    it('should return false if string does not end with ?', () => {
      expect(endsWithQuestionMark('hello')).toBe(false)
    })
  })

  describe('removeQuestionMarkAtEnd', () => {
    it('should remove ? from the end of the string', () => {
      expect(removeQuestionMarkAtEnd('hello?')).toBe('hello')
    })

    it('should not change string if it does not end with ?', () => {
      expect(removeQuestionMarkAtEnd('hello')).toBe('hello')
    })
  })

  describe('getPrismaSchemaPath', () => {
    it('should return the prisma schema path from package.json', () => {
      const packageJson = { prisma: { schema: 'prisma/schema.prisma' } }
      writeJson(tree, 'package.json', packageJson)
      expect(getPrismaSchemaPath(tree)).toBe('prisma/schema.prisma')
    })

    it('should return null if package.json does not exist', () => {
      expect(getPrismaSchemaPath(tree)).toBeNull()
    })

    it('should return null if prisma schema path is not in package.json', () => {
      writeJson(tree, 'package.json', {})
      expect(getPrismaSchemaPath(tree)).toBeNull()
    })
  })

  describe('readPrismaSchema', () => {
    it('should read a single prisma schema file', () => {
      const schemaContent = 'model User {}'
      tree.write('prisma/schema.prisma', schemaContent)
      expect(readPrismaSchema(tree, 'prisma/schema.prisma')).toBe(schemaContent)
    })

    it('should read and combine prisma schema files from a directory', () => {
      tree.write('prisma/user.prisma', 'model User {}')
      tree.write('prisma/post.prisma', 'model Post {}')
      const expectedContent = 'model User {}\nmodel Post {}\n'
      expect(readPrismaSchema(tree, 'prisma')).toBe(expectedContent)
    })

    it('should return null if prisma path is not provided', () => {
      expect(readPrismaSchema(tree, null)).toBeNull()
    })

    it('should return null if path does not exist', () => {
      expect(readPrismaSchema(tree, 'non-existent-path')).toBeNull()
    })

    it('should return null if directory contains no .prisma files', () => {
      tree.write('prisma/readme.md', 'some content')
      expect(readPrismaSchema(tree, 'prisma')).toBeNull()
    })
  })

  describe('mapPrismaTypeToNestJsType', () => {
    it('should map prisma types to NestJS types', () => {
      expect(mapPrismaTypeToNestJsType('String')).toBe('string')
      expect(mapPrismaTypeToNestJsType('Int')).toBe('number')
      expect(mapPrismaTypeToNestJsType('DateTime')).toBe('Date')
    })

    it('should return original type if no mapping exists', () => {
      expect(mapPrismaTypeToNestJsType('CustomType')).toBe('CustomType')
    })
  })

  describe('getNpmScope', () => {
    it('should return npm scope from package.json', () => {
      writeJson(tree, 'package.json', { name: '@scope/project' })
      expect(getNpmScope(tree)).toBe('scope')
    })

    it('should throw error if no npm scope is found', () => {
      writeJson(tree, 'package.json', { name: 'project' })
      expect(() => getNpmScope(tree)).toThrow('No npm scope found in package.json name')
    })
  })

  describe('parsePrismaSchema', () => {
    it('should parse a prisma schema and return model fields', async () => {
      const schemaContent = `
        model User {
          id    Int     @id @default(autoincrement())
          name  String?
          email String  @unique
        }
      `
      const dmmf = {
        datamodel: {
          models: [
            {
              name: 'User',
              fields: [
                { name: 'id', type: 'Int', isRequired: true },
                { name: 'name', type: 'String', isRequired: false },
                { name: 'email', type: 'String', isRequired: true },
              ],
            },
          ],
        },
      }
      ;(getDMMF as any).mockResolvedValue(dmmf)

      const fields = await parsePrismaSchema(schemaContent, 'User')
      expect(fields).toEqual([
        { name: 'id', type: 'number', optional: false },
        { name: 'name', type: 'string', optional: true },
        { name: 'email', type: 'string', optional: false },
      ])
    })

    it('should return null if model is not found', async () => {
      const schemaContent = 'model User {}'
      const dmmf = {
        datamodel: {
          models: [{ name: 'User', fields: [] }],
        },
      }
      ;(getDMMF as any).mockResolvedValue(dmmf)
      const fields = await parsePrismaSchema(schemaContent, 'Post')
      expect(fields).toBeNull()
    })

    it('should return null on parsing error', async () => {
      const schemaContent = 'invalid schema'
      ;(getDMMF as any).mockRejectedValue(new Error('parsing error'))
      const fields = await parsePrismaSchema(schemaContent, 'User')
      expect(fields).toBeNull()
    })
  })

  describe('generateTemplateFiles', () => {
    it('should call generateFiles with the correct parameters', () => {
      const options = {
        tree,
        schema: { name: 'my-lib' },
        libraryRoot: 'libs/my-lib',
        templatePath: 'templates',
        npmScope: 'my-scope',
      }
      generateTemplateFiles(options)

      expect(generateFiles).toHaveBeenCalledWith(
        tree,
        'templates',
        'libs/my-lib',
        expect.objectContaining({
          ...names('my-lib'),
          npmScope: 'my-scope',
          name: 'my-lib',
        }),
      )
    })
  })

  describe('installPlugins', () => {
    beforeEach(() => {
      writeJson(tree, 'package.json', { dependencies: {}, devDependencies: {} })
    })

    it('should add dependencies to package.json', async () => {
      await installPlugins(tree, { 'my-plugin': '1.0.0' })
      const pkg = readJson(tree, 'package.json')
      expect(pkg.dependencies['my-plugin']).toBe('1.0.0')
    })

    it('should add devDependencies to package.json', async () => {
      await installPlugins(tree, {}, { 'my-dev-plugin': '1.0.0' })
      const pkg = readJson(tree, 'package.json')
      expect(pkg.devDependencies['my-dev-plugin']).toBe('1.0.0')
    })

    it('should handle empty dependencies', async () => {
      const originalPkg = readJson(tree, 'package.json')
      await installPlugins(tree)
      const pkg = readJson(tree, 'package.json')
      expect(pkg).toEqual(originalPkg)
    })
  })

  describe('updateTsConfigPaths', () => {
    it('should add a new path to tsconfig.base.json', () => {
      writeJson(tree, 'tsconfig.base.json', {
        compilerOptions: { paths: {} },
      })
      updateTsConfigPaths(tree, '@my/lib', 'libs/my-lib')
      const tsConfig = readJson(tree, 'tsconfig.base.json')
      expect(tsConfig.compilerOptions.paths['@my/lib']).toEqual(['libs/my-lib/src/index.ts'])
    })

    it('should create paths property if it does not exist', () => {
      writeJson(tree, 'tsconfig.base.json', {
        compilerOptions: {},
      })
      updateTsConfigPaths(tree, '@my/lib', 'libs/my-lib')
      const tsConfig = readJson(tree, 'tsconfig.base.json')
      expect(tsConfig.compilerOptions.paths['@my/lib']).toEqual(['libs/my-lib/src/index.ts'])
    })

    it('should not throw if tsconfig.base.json does not exist', () => {
      expect(() => updateTsConfigPaths(tree, '@my/lib', 'libs/my-lib')).not.toThrow()
    })
  })

  describe('updateTypeScriptConfigs', () => {
    it("should add a reference to the new library in other projects' tsconfig.json files", () => {
      // Setup project tsconfigs
      writeJson(tree, 'libs/lib1/tsconfig.json', {})
      writeJson(tree, 'apps/app1/tsconfig.json', { references: [] })
      writeJson(tree, 'libs/new-lib/tsconfig.json', {}) // The new library itself

      updateTypeScriptConfigs(tree, 'libs/new-lib')

      const lib1TsConfig = readJson(tree, 'libs/lib1/tsconfig.json')
      expect(lib1TsConfig.references).toEqual([{ path: './libs/new-lib' }])

      const app1TsConfig = readJson(tree, 'apps/app1/tsconfig.json')
      expect(app1TsConfig.references).toEqual([{ path: './libs/new-lib' }])

      // Should not add a reference to itself
      const newLibTsConfig = readJson(tree, 'libs/new-lib/tsconfig.json')
      expect(newLibTsConfig.references).toBeUndefined()
    })
  })

  describe('getAllPrismaModels', () => {
    it('should return all prisma models from the schema', async () => {
      const schemaContent = `
        model User {
          id    Int     @id @default(autoincrement())
          name  String?
        }
        model Post {
          id    Int     @id @default(autoincrement())
          title String
        }
      `
      tree.write('prisma/schema.prisma', schemaContent)
      writeJson(tree, 'package.json', { prisma: { schema: 'prisma/schema.prisma' } })
      const dmmf = {
        datamodel: {
          models: [
            { name: 'User', fields: [] },
            { name: 'Post', fields: [] },
          ],
        },
      }
      ;(getDMMF as any).mockResolvedValue(dmmf)

      const models = await getAllPrismaModels(tree)
      expect(models).toEqual([
        expect.objectContaining({ name: 'User', modelName: 'User' }),
        expect.objectContaining({ name: 'Post', modelName: 'Post' }),
      ])
    })
  })

  describe('addScriptToPackageJson', () => {
    it('should add a script to an existing scripts object', () => {
      const pkgJson = { name: 'test', scripts: { start: 'node .' } }
      writeJson(tree, 'package.json', pkgJson)
      addScriptToPackageJson(tree, 'test', 'jest')
      const updated = readJson(tree, 'package.json')
      expect(updated.scripts.test).toBe('jest')
      expect(updated.scripts.start).toBe('node .')
    })

    it('should create a scripts object if it does not exist', () => {
      const pkgJson = { name: 'test' }
      writeJson(tree, 'package.json', pkgJson)
      addScriptToPackageJson(tree, 'test', 'jest')
      const updated = readJson(tree, 'package.json')
      expect(updated.scripts.test).toBe('jest')
    })

    it('should overwrite an existing script', () => {
      const pkgJson = { name: 'test', scripts: { test: 'old' } }
      writeJson(tree, 'package.json', pkgJson)
      addScriptToPackageJson(tree, 'test', 'new')
      const updated = readJson(tree, 'package.json')
      expect(updated.scripts.test).toBe('new')
    })

    it('should not throw if package.json does not exist', () => {
      expect(() => addScriptToPackageJson(tree, 'test', 'jest')).not.toThrow()
    })
  })
})

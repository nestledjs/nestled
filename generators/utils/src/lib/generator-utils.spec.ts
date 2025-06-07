import { describe, it, expect, beforeEach } from 'vitest'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree, readJson, writeJson } from '@nx/devkit'

import {
  updateTypeScriptConfig,
  removeWorkspacesFromPackageJson,
} from './generator-utils'

describe('generator-utils', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  describe('updateTypeScriptConfig', () => {
    it('should set baseUrl and remove emitDeclarationOnly from tsconfig.base.json', () => {
      const tsConfig = {
        compilerOptions: {
          emitDeclarationOnly: true,
          otherOption: 'value',
        },
      }
      writeJson(tree, 'tsconfig.base.json', tsConfig)

      updateTypeScriptConfig(tree)

      const updatedTsConfig = readJson(tree, 'tsconfig.base.json')
      expect(updatedTsConfig.compilerOptions.baseUrl).toBe('.')
      expect(
        updatedTsConfig.compilerOptions.emitDeclarationOnly,
      ).toBeUndefined()
      expect(updatedTsConfig.compilerOptions.otherOption).toBe('value')
    })

    it('should handle tsconfig.base.json not existing', () => {
      expect(() => updateTypeScriptConfig(tree)).not.toThrow()
    })

    it('should handle compilerOptions not existing', () => {
      const tsConfig = {}
      writeJson(tree, 'tsconfig.base.json', tsConfig)
      
      // Manually parse and update to avoid writeJson adding compilerOptions
      const tsConfigWithoutCompilerOptions = tree.read('tsconfig.base.json', 'utf-8')
      const parsedConfig = JSON.parse(tsConfigWithoutCompilerOptions)
      delete parsedConfig.compilerOptions

      tree.write('tsconfig.base.json', JSON.stringify(parsedConfig))


      updateTypeScriptConfig(tree)

      const updatedTsConfig = readJson(tree, 'tsconfig.base.json')
      expect(updatedTsConfig.compilerOptions.baseUrl).toBe('.')
    })
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
}) 
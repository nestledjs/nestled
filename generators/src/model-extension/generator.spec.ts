import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ModelExtensionGeneratorDependencies, modelExtensionGeneratorLogic } from './generator'

describe('model-extension generator', () => {
  let tree: Tree
  let dependencies: ModelExtensionGeneratorDependencies

  const dmmf = {
    datamodel: {
      models: [
        { name: 'User', fields: [] },
        { name: 'PasswordHistory', documentation: '@skipCrud', fields: [] },
      ],
    },
  }

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    tree.write('prisma/schema.prisma', 'model User { id String @id }')
    tree.write('libs/api/custom/src/lib/default/index.ts', '')
    tree.write(
      'apps/api/src/app.module.ts',
      `import { Module } from '@nestjs/common'

export const defaultModules = []

@Module({ imports: [...defaultModules] })
export class AppModule {}
`,
    )
    dependencies = {
      addToModules: vi.fn(),
      formatFiles: vi.fn(),
      generateFiles: vi.fn((host, source, destination, substitutions) => {
        const name = substitutions.extensionFileName
        host.write(
          `${destination}/${name}/${name}.resolver.ts`,
          `export class ${substitutions.extensionClassName}Resolver {}`,
        )
        host.write(
          `${destination}/${name}/${name}.module.ts`,
          `export class ${substitutions.extensionClassName}Module {}`,
        )
      }) as any,
      getDMMF: vi.fn().mockResolvedValue(dmmf),
      getNpmScope: vi.fn(() => 'test-scope'),
      getPrismaSchemaPath: vi.fn(() => 'prisma/schema.prisma'),
      joinPathFragments: vi.fn((...parts: string[]) => parts.join('/')),
      names: vi.fn((value: string) => {
        const fileName = value
          .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
          .replace(/\s+/g, '-')
          .toLowerCase()
        return {
          name: value,
          className: value.replace(/(^|-|\s)(\w)/g, (_match, _prefix, letter) => letter.toUpperCase()),
          propertyName: value,
          constantName: value.toUpperCase(),
          fileName,
        }
      }) as any,
      readPrismaSchema: vi.fn(() => 'model User { id String @id }'),
    }
  })

  it('scaffolds an additive resolver module for a Prisma model', async () => {
    await modelExtensionGeneratorLogic(tree, { model: 'user' }, dependencies)

    expect(tree.exists('libs/api/custom/src/lib/default/user/user.resolver.ts')).toBe(true)
    expect(tree.exists('libs/api/custom/src/lib/default/user/user.module.ts')).toBe(true)
    expect(tree.read('libs/api/custom/src/lib/default/index.ts', 'utf-8')).toBe("export * from './user/user.module'\n")
    expect(dependencies.generateFiles).toHaveBeenCalledWith(
      tree,
      expect.stringContaining('/model-extension/files'),
      'libs/api/custom/src/lib/default',
      expect.objectContaining({
        extensionClassName: 'User',
        extensionFileName: 'user',
        modelName: 'User',
        npmScope: 'test-scope',
      }),
    )
    expect(dependencies.addToModules).toHaveBeenCalledWith({
      tree,
      modulePath: 'apps/api/src/app.module.ts',
      moduleArrayName: 'defaultModules',
      moduleToAdd: 'UserModule',
      importPath: '@test-scope/api/custom',
    })
  })

  it('allows a separate artifact name while preserving the target GraphQL model', async () => {
    await modelExtensionGeneratorLogic(tree, { model: 'User', name: 'UserProfile' }, dependencies)

    expect(dependencies.generateFiles).toHaveBeenCalledWith(
      tree,
      expect.any(String),
      'libs/api/custom/src/lib/default',
      expect.objectContaining({ extensionClassName: 'UserProfile', modelName: 'User' }),
    )
    expect(dependencies.addToModules).toHaveBeenCalledWith(
      expect.objectContaining({ moduleToAdd: 'UserProfileModule' }),
    )
  })

  it('refuses to overwrite an existing extension folder', async () => {
    tree.write('libs/api/custom/src/lib/default/user/user.resolver.ts', 'preserve me')

    await expect(modelExtensionGeneratorLogic(tree, { model: 'User' }, dependencies)).rejects.toThrow(
      'Model extension folder already exists',
    )
    expect(tree.read('libs/api/custom/src/lib/default/user/user.resolver.ts', 'utf-8')).toBe('preserve me')
  })

  it('reports unknown models with the available model names', async () => {
    await expect(modelExtensionGeneratorLogic(tree, { model: 'Account' }, dependencies)).rejects.toThrow(
      'Available models: PasswordHistory, User',
    )
  })

  it('rejects @skipCrud models because their GraphQL model is not generated', async () => {
    await expect(modelExtensionGeneratorLogic(tree, { model: 'PasswordHistory' }, dependencies)).rejects.toThrow(
      'uses @skipCrud',
    )
  })

  it('rejects a workspace that still uses @crudAuth', async () => {
    dependencies.getDMMF = vi.fn().mockResolvedValue({
      datamodel: {
        models: [
          {
            name: 'User',
            documentation: '@crudAuth: { "readMany": "user" }',
            fields: [],
          },
        ],
      },
    })

    await expect(modelExtensionGeneratorLogic(tree, { model: 'User' }, dependencies)).rejects.toThrow(
      /Remove @crudAuth from: User/,
    )
    expect(dependencies.generateFiles).not.toHaveBeenCalled()
  })
})

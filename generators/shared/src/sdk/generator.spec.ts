import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { sdkGeneratorLogic, SdkGeneratorDependencies } from './generator';
import { Tree } from '@nx/devkit';

const prismaSchema = `
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id   Int @id @default(autoincrement())
}
`;

describe('sdk generator', () => {
  let tree: Tree;
  let mockDependencies: SdkGeneratorDependencies;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    mockDependencies = {
      formatFiles: vi.fn(),
      installPackagesTask: vi.fn(),
      generateFiles: vi.fn(),
      joinPathFragments: vi.fn((...args: string[]) => args.join('/')),
      readJson: vi.fn().mockReturnValue({ prisma: { schema: 'prisma/schema.prisma' } }),
      addDependenciesToPackageJson: vi.fn(),
      addScriptToPackageJson: vi.fn(),
      getPluralName: vi.fn((name: string) => name + 's'),
      libraryGenerator: vi.fn(),
      join: vi.fn((...args: string[]) => args.join('/')),
      existsSync: vi.fn().mockReturnValue(true),
      statSync: vi.fn().mockReturnValue({ isDirectory: () => false }),
      readdirSync: vi.fn().mockReturnValue([]),
      readFileSync: vi.fn().mockReturnValue(prismaSchema),
    };
    vi.clearAllMocks();
  });

  it('throws if prisma schema path is missing in config or package.json', async () => {
    mockDependencies.readJson = vi.fn().mockReturnValue({});
    await expect(sdkGeneratorLogic(tree, {}, mockDependencies)).rejects.toThrow(
      'Prisma schema path not found (config or package.json)',
    );
  });

  it('throws if prisma schema file does not exist', async () => {
    mockDependencies.existsSync = vi.fn().mockReturnValue(false);
    await expect(sdkGeneratorLogic(tree, {}, mockDependencies)).rejects.toThrow('Prisma schema not found at');
  });

  it('generates files and scripts for models in schema, including admin SDK', async () => {
    const callback = await sdkGeneratorLogic(tree, {}, mockDependencies);
    expect(mockDependencies.generateFiles).toHaveBeenCalled();
    expect(mockDependencies.addScriptToPackageJson).toHaveBeenCalledWith(tree, 'sdk', expect.any(String));
    expect(mockDependencies.addDependenciesToPackageJson).toHaveBeenCalled();
    expect(mockDependencies.formatFiles).toHaveBeenCalledWith(tree);
    expect(typeof callback).toBe('function');
    if (callback) callback();
    expect(mockDependencies.installPackagesTask).toHaveBeenCalledWith(tree);

    // Check that generateFiles is called for both user and admin SDK
    const calls = vi.mocked(mockDependencies.generateFiles).mock.calls;
    // There should be at least one call for user and one for admin
    const userCall = calls.find(([_, __, modelDir, context]) =>
      typeof modelDir === 'string' && modelDir.includes('graphql') && !modelDir.includes('__admin')
    );
    const adminCall = calls.find(([_, __, modelDir, context]) =>
      typeof modelDir === 'string' && modelDir.includes('__admin') && context?.adminPrefix === '__Admin'
    );
    expect(userCall).toBeTruthy();
    expect(adminCall).toBeTruthy();
    // Check that adminPrefix is empty string for user SDK and '__Admin' for admin SDK
    expect(userCall[3].adminPrefix).toBe('');
    expect(adminCall[3].adminPrefix).toBe('__Admin');
  });

  describe('codegen.yml handling', () => {
    it('generates new codegen.yml when file does not exist', async () => {
      tree.exists = vi.fn().mockImplementation((path: string) => {
        return path !== 'libs/shared/sdk/src/codegen.yml';
      });

      await sdkGeneratorLogic(tree, {}, mockDependencies);

      expect(mockDependencies.generateFiles).toHaveBeenCalledWith(
        tree,
        expect.stringContaining('./files'),
        'libs/shared/sdk/src',
        { tmpl: '' }
      );
    });

    it('preserves existing codegen.yml by default', async () => {
      const existingContent = 'existing config content';
      tree.exists = vi.fn().mockImplementation((path: string) => {
        return path === 'libs/shared/sdk/src/codegen.yml' || path !== 'libs/shared/sdk';
      });
      tree.read = vi.fn().mockReturnValue(existingContent);
      tree.write = vi.fn();

      await sdkGeneratorLogic(tree, {}, mockDependencies);

      expect(tree.read).toHaveBeenCalledWith('libs/shared/sdk/src/codegen.yml', 'utf-8');
      expect(tree.write).toHaveBeenCalledWith('libs/shared/sdk/src/codegen.yml', existingContent);
    });

    it('forces regeneration when forceCodegen is true', async () => {
      tree.exists = vi.fn().mockImplementation((path: string) => {
        return path === 'libs/shared/sdk/src/codegen.yml' || path !== 'libs/shared/sdk';
      });
      tree.write = vi.fn();

      await sdkGeneratorLogic(tree, { forceCodegen: true }, mockDependencies);

      expect(mockDependencies.generateFiles).toHaveBeenCalledWith(
        tree,
        expect.stringContaining('./files'),
        'libs/shared/sdk/src',
        { tmpl: '' }
      );
      // Should not restore the existing content
      expect(tree.write).not.toHaveBeenCalledWith('libs/shared/sdk/src/codegen.yml', expect.any(String));
    });

    it('handles null return from tree.read gracefully', async () => {
      tree.exists = vi.fn().mockImplementation((path: string) => {
        return path === 'libs/shared/sdk/src/codegen.yml' || path !== 'libs/shared/sdk';
      });
      tree.read = vi.fn().mockReturnValue(null);
      tree.write = vi.fn();

      await sdkGeneratorLogic(tree, {}, mockDependencies);

      expect(tree.write).toHaveBeenCalledWith('libs/shared/sdk/src/codegen.yml', '');
    });
  });
}); 
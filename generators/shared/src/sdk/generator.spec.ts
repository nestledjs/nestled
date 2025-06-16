import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { sdkGeneratorLogic, SdkGeneratorDependencies } from './generator';
import { Tree } from '@nx/devkit';

const prismaSchema = `model User { id Int @id @default(autoincrement()) }`;

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

  it('throws if prisma schema path is missing in package.json', async () => {
    mockDependencies.readJson = vi.fn().mockReturnValue({});
    await expect(sdkGeneratorLogic(tree, {}, mockDependencies)).rejects.toThrow(
      'Prisma schema path not found in package.json',
    );
  });

  it('throws if prisma schema file does not exist', async () => {
    mockDependencies.existsSync = vi.fn().mockReturnValue(false);
    await expect(sdkGeneratorLogic(tree, {}, mockDependencies)).rejects.toThrow('Prisma schema not found at');
  });

  it('generates files and scripts for models in schema', async () => {
    const callback = await sdkGeneratorLogic(tree, {}, mockDependencies);
    expect(mockDependencies.generateFiles).toHaveBeenCalled();
    expect(mockDependencies.addScriptToPackageJson).toHaveBeenCalledWith(tree, 'sdk', expect.any(String));
    expect(mockDependencies.addDependenciesToPackageJson).toHaveBeenCalled();
    expect(mockDependencies.formatFiles).toHaveBeenCalledWith(tree);
    expect(typeof callback).toBe('function');
    if (callback) callback();
    expect(mockDependencies.installPackagesTask).toHaveBeenCalledWith(tree);
  });
}); 
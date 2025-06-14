import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { generateCrudLogic, GenerateCrudGeneratorDependencies } from './generator';

// The mocked DMMF object
const dmmf = {
  datamodel: {
    models: [
      {
        name: 'User',
        fields: [
          { name: 'id', type: 'Int', isId: true },
          { name: 'name', type: 'String', isId: false },
          { name: 'posts', type: 'Post', isList: true },
        ],
      },
      {
        name: 'Post',
        fields: [
          { name: 'id', type: 'Int', isId: true },
          { name: 'title', type: 'String', isId: false },
          { name: 'user', type: 'User', isId: false },
          { name: 'userId', type: 'Int', isId: false },
        ],
      },
    ],
  },
};

describe('generate-crud generator', () => {
  let tree: any;
  let mockDependencies: GenerateCrudGeneratorDependencies;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    tree.write('prisma/schema.prisma', 'model User {}');
    // Create a fresh set of mock dependencies for each test
    mockDependencies = {
      formatFiles: vi.fn(),
      generateFiles: vi.fn(),
      installPackagesTask: vi.fn(),
      joinPathFragments: vi.fn((...args: string[]) => args.join('/')),
      names: vi.fn((name: string) => ({
        name,
        className: name,
        propertyName: name,
        constantName: name,
        fileName: name,
      })),
      getDMMF: vi.fn().mockResolvedValue(dmmf),
      apiLibraryGenerator: vi.fn(),
      getPrismaSchemaPath: vi.fn(() => 'prisma/schema.prisma'),
      readPrismaSchema: vi.fn(() => `model User {}`),
      deleteFiles: vi.fn(),
      getPluralName: vi.fn((name: string) => name + 's'),
      getNpmScope: vi.fn(() => 'testscope'),
    };
    vi.clearAllMocks();
  });

  it('returns early if no Prisma models are found', async () => {
    mockDependencies.getDMMF = vi.fn().mockResolvedValue({ datamodel: { models: [] } });
    const result = await generateCrudLogic(
      tree,
      { name: 'crud', directory: '', model: 'User', plural: 'Users' },
      mockDependencies,
    );
    expect(result).toBeUndefined();
    expect(mockDependencies.apiLibraryGenerator).not.toHaveBeenCalled();
    expect(mockDependencies.generateFiles).not.toHaveBeenCalled();
  });

  it('generates files and calls utilities for valid models', async () => {
    const callback = await generateCrudLogic(
      tree,
      { name: 'crud', directory: '', model: 'User', plural: 'Users' },
      mockDependencies,
    );
    expect(mockDependencies.apiLibraryGenerator).toHaveBeenCalled();
    expect(mockDependencies.generateFiles).toHaveBeenCalled();
    expect(mockDependencies.formatFiles).toHaveBeenCalled();
    expect(typeof callback).toBe('function');
    if (callback) callback();
    expect(mockDependencies.installPackagesTask).toHaveBeenCalled();
  });
}); 
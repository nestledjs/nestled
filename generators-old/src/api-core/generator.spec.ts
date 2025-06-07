import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';

import generator from './generator';
import { ApiCoreGeneratorSchema } from './schema';

describe('api-core generator', () => {
  let tree: Tree;
  const options: ApiCoreGeneratorSchema = { name: 'core' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should generate core data-access and feature libraries', async () => {
    await generator(tree, options);
    
    const dataAccessConfig = readProjectConfiguration(tree, 'api-core-data-access');
    expect(dataAccessConfig).toBeDefined();
    expect(dataAccessConfig.tags).toEqual(['scope:api', 'type:data-access']);

    const featureConfig = readProjectConfiguration(tree, 'api-core-feature');
    expect(featureConfig).toBeDefined();
    expect(featureConfig.tags).toEqual(['scope:api', 'type:feature']);
  });
}); 
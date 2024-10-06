import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { readProjectConfiguration, Tree } from '@nx/devkit';

import { appSetupGenerator } from './generator';
import { AppSetupGeneratorSchema } from './schema';

describe('app-setup generator', () => {
  let tree: Tree;
  const options: AppSetupGeneratorSchema = { setupType: 'both' };

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should run successfully', async () => {
    await appSetupGenerator(tree, options);
    const config = readProjectConfiguration(tree, 'test');
    expect(config).toBeDefined();
  });
});

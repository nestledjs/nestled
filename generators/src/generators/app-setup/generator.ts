import { formatFiles, installPackagesTask, Tree } from '@nx/devkit';
import { AppSetupGeneratorSchema } from './schema';
import { createApi } from './utils/create-api';
import { installPlugins } from './utils/install-plugins';
import { createWeb } from './utils/create-web';

export async function appSetupGenerator(
  tree: Tree,
  options: AppSetupGeneratorSchema
) {
  await installPlugins(tree, options);

  if (options.setupType === 'api' || options.setupType === 'both') {
    await createApi(tree);
  }

  if (options.setupType === 'web' || options.setupType === 'both') {
    await createWeb(tree);
  }

  await formatFiles(tree);
  return () => {
    installPackagesTask(tree);
  };
}

export default appSetupGenerator;

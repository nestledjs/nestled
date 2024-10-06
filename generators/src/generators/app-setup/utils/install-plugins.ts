import { Tree, addDependenciesToPackageJson } from '@nx/devkit';
import { AppSetupGeneratorSchema } from '../schema';

export async function installPlugins(tree: Tree, options: AppSetupGeneratorSchema) {
  const dependencies = {};
  const devDependencies = {};

  if (options.setupType === 'api' || options.setupType === 'both') {
    devDependencies['@nx/nest'] = 'latest';
  }

  if (options.setupType === 'web' || options.setupType === 'both') {
    devDependencies['@nx/remix'] = 'latest';
  }

  return addDependenciesToPackageJson(tree, dependencies, devDependencies);
}

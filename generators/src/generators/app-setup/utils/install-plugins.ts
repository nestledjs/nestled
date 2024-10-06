import { Tree, addDependenciesToPackageJson, logger } from '@nx/devkit';
import { AppSetupGeneratorSchema } from '../schema';

export async function installPlugins(tree: Tree, options: AppSetupGeneratorSchema) {
  const dependencies = {};
  const devDependencies = {};

  if (options.setupType === 'api' || options.setupType === 'both') {
    devDependencies['@nx/nest'] = 'latest';
    logger.info('Adding @nx/nest as a devDependency...');
  }

  if (options.setupType === 'web' || options.setupType === 'both') {
    devDependencies['@nx/remix'] = 'latest';
    logger.info('Adding @nx/remix as a devDependency...');
  }

  if (Object.keys(dependencies).length || Object.keys(devDependencies).length) {
    logger.info('Adding dependencies to package.json...');
  } else {
    logger.warn('No dependencies to add based on the provided setupType.');
  }

  try {
    // Add dependencies to package.json
    const installTask = addDependenciesToPackageJson(tree, dependencies, devDependencies);
    logger.info('Dependencies added successfully!');
    return installTask;
  } catch (error) {
    logger.error('Failed to add dependencies to package.json.');
    throw error;
  }
}

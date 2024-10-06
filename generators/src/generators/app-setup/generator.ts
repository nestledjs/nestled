import {formatFiles, installPackagesTask, logger, runTasksInSerial, Tree} from '@nx/devkit'
import { AppSetupGeneratorSchema } from './schema';
import { createApi } from './utils/create-api';
import { installPlugins } from './utils/install-plugins';
import { createWeb } from './utils/create-web';

export async function appSetupGenerator(
  tree: Tree,
  options: AppSetupGeneratorSchema
) {
  // Step 1: Install Plugins and collect the install callback
  const installTask = await installPlugins(tree, options);

  // Step 2: Format the updated files (e.g., package.json)
  await formatFiles(tree);

  // Step 3: Schedule the install task to run after generator finishes
  try {
    runTasksInSerial(installTask);
    logger.info('Dependencies installed successfully!');
  } catch {
    logger.error('Dependencies failed to install.');
  }

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

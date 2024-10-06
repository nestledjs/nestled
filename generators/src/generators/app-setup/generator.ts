// ./tools/generators/app-setup/index.ts

import {
  formatFiles,
  GeneratorCallback,
  logger,
  runTasksInSerial,
  Tree,
} from '@nx/devkit';
import { AppSetupGeneratorSchema } from './schema';
import { createApi } from './utils/create-api';
import { installPlugins } from './utils/install-plugins';
import { createWeb } from './utils/create-web';

export async function appSetupGenerator(
  tree: Tree,
  options: AppSetupGeneratorSchema
): Promise<GeneratorCallback> {
  // Step 3: Schedule the install task to run after generator finishes
  // Collect all tasks to run serially
  const tasks: GeneratorCallback[] = [];

  // Step 1: Install Plugins and collect the install callback
  const installTask = await installPlugins(tree, options);
  tasks.push(installTask);

  // Step 4: Create Applications as separate tasks
  if (options.setupType === 'api' || options.setupType === 'both') {
    const createApiTask = async () => {
      await createApi(tree);
      logger.info('API application created successfully!');
    };
    tasks.push(createApiTask);
  }

  if (options.setupType === 'web' || options.setupType === 'both') {
    const createWebTask = async () => {
      await createWeb(tree);
      logger.info('Web application created successfully!');
    };
    tasks.push(createWebTask);
  }

  // Step 5: Format files again after creating apps
  await formatFiles(tree);

  // Step 6: Return a combined task that runs all collected tasks serially
  return runTasksInSerial(...tasks);
}

export default appSetupGenerator;

// Related to the target generated in the root project.json
import {startLocalRegistry} from '@nx/js/plugins/jest/local-registry'
import {readdirSync, readFileSync } from 'fs';
import {releasePublish, releaseVersion} from 'nx/release'
import {readCachedProjectGraph} from 'nx/src/project-graph/project-graph'
import { execSync } from 'child_process';
import * as yargs from 'yargs'
import { resolve } from 'path';

const localRegistryTarget = '@nestled/source:local-registry';

// Callback used to stop Verdaccio process
let stopLocalRegistry = () => {};

(async () => {
  // Get Options From Execution
  const options = await yargs
  .version(false) // don't use the default meaning of version in yargs
  .option('version', {
    description:
      'Explicit version specifier to use, if overriding conventional commits',
    type: 'string',
    default: `0.0.0-local.${Date.now()}`, // the version will be always unique
  })
  .option('targetPath', {
    description:
      'Relative path to the repo where to install the published libraries',
    type: 'string',
    default: '',
  })
  .parseAsync();

  /**
   * Step 1: Start Verdaccio
   */
  stopLocalRegistry = await startLocalRegistry({
    localRegistryTarget,
    verbose: false,
  });

  /**
   * Step 2: Build your Libraries
   * Step 3: Update Versions in Outputs
   */
  const { projectsVersionData } = await releaseVersion({
    specifier: options.version,
    stageChanges: false,
    gitCommit: false,
    gitTag: false,
    firstRelease: true,
    generatorOptionsOverrides: {
      skipLockFileUpdate: true,
    },
  });

  /**
   * Step 4: Publish Library on Verdaccio
   */
  const publishStatus = await releasePublish({
    firstRelease: true,
  });

  /**
   * Step 5: Install your Libraries
   */
  // Get All published Npm packages that should be installed
  const packagesToInstall = Object.entries(projectsVersionData).map(
    ([projectName, { newVersion }]) => {
      const project = readCachedProjectGraph().nodes[projectName];

      const packageJson = JSON.parse(
        readFileSync(
          resolve(process.cwd(), project.data.root, `package.json`)
        ).toString()
      );

      console.log(`Preparing to install package: ${packageJson.name}@${newVersion}`);
      
      // Also install dependencies if this is the generator package
      if (packageJson.name === '@nestled/generators') {
        console.log('Installing generator dependencies...');
        Object.entries(packageJson.dependencies || {}).forEach(([dep, version]) => {
          console.log(`- ${dep}@${version}`);
        });
      }

      return `${packageJson.name}@${newVersion}`;
    }
  );

  // Prepare the install command
  const targetPath = resolve(process.cwd(), options.targetPath);
  const installCommand = `${getInstallCommand(
    targetPath
  )} ${packagesToInstall.join(' ')} --registry=http://localhost:4873`;

  console.log('Installing packages in target workspace:', installCommand);

  // Locate to target dir and run the install command
  process.chdir(targetPath);
  try {
    // Install packages one by one to better track failures
    for (const pkg of packagesToInstall) {
      const singleInstallCommand = `${getInstallCommand(targetPath)} ${pkg} --registry=http://localhost:4873`;
      console.log(`Installing package: ${pkg}`);
      try {
        execSync(singleInstallCommand, { stdio: 'inherit' });
        console.log(`✓ Successfully installed ${pkg}`);
      } catch (error) {
        console.error(`✗ Failed to install ${pkg}:`, error);
        throw error;
      }
    }
  } catch (error) {
    console.error('Installation process failed:', error);
    stopLocalRegistry();
    process.exit(1);
  }

  /**
   * Final: When installation is done, no need to have Verdaccio
   */
  stopLocalRegistry();

  process.exit(publishStatus);
})().catch((e) => {
  // If anything goes wrong, stop Verdaccio
  console.error(e);
  stopLocalRegistry();
  process.exit(1);
});

// Used to define which install command should be used on the targetPath
function getInstallCommand(targetPath: string): string {
  const siblingFiles = readdirSync(targetPath);

  if (siblingFiles.includes('yarn.lock')) {
    return 'yarn add';
  }
  if (siblingFiles.includes('package-lock.json')) {
    return 'npm install';
  }
  if (siblingFiles.includes('pnpm-lock.yaml')) {
    return 'pnpm add';
  }
  throw new Error(
    `No package manager found for target repository: ${targetPath}`
  );
}

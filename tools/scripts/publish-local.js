// Related to the target generated in the root project.json
const { readdirSync, readFileSync } = require('fs');
const { releasePublish, releaseVersion } = require('nx/release');
const { execSync } = require('child_process');
const yargs = require('yargs/yargs');
const { resolve } = require('path');
const { readCachedProjectGraph } = require('nx/src/project-graph/project-graph');
const startLocalRegistry = require('./start-local-registry');
const stopLocalRegistry = require('./stop-local-registry');

const REGISTRY_PORT = 4873;
const REGISTRY_URL = `http://localhost:${REGISTRY_PORT}`;

// Configure yargs properly
const argv = yargs(process.argv.slice(2))
  .usage('Usage: $0 [options]')
  .version(false)
  .options({
    releaseVersion: {
      description: 'Explicit version specifier to use, if overriding conventional commits',
      type: 'string',
      default: `0.0.0-local.${Date.now()}`,
    },
    targetPath: {
      description: 'Relative path to the repo where to install the published libraries',
      type: 'string',
      default: '',
    }
  })
  .help()
  .parse();

// Ensure cleanup happens on process termination
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Cleaning up...');
  stopLocalRegistry();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM. Cleaning up...');
  stopLocalRegistry();
  process.exit(0);
});

(async () => {
  let stopRegistry = null;
  try {
    console.log('Starting with configuration:', {
      releaseVersion: argv.releaseVersion,
      targetPath: argv.targetPath
    });

    console.log('Installing missing dependencies...');
    try {
      execSync('pnpm add -D @nx/eslint', { stdio: 'inherit' });
      console.log('✓ Dependencies installed successfully');
    } catch (error) {
      console.error('✗ Failed to install dependencies:', error);
      throw error;
    }

    console.log('Starting local registry...');
    const registry = await startLocalRegistry();
    stopRegistry = registry.stopLocalRegistry;

    // Build all projects using nx CLI
    console.log('Building all packages...');
    try {
      execSync('nx run-many --target=build --all --skip-nx-cache', { 
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: 'true' }
      });
      console.log('✓ Build completed successfully');
    } catch (error) {
      console.error('✗ Build failed:', error);
      throw error;
    }

    console.log(`Running version update with version: ${argv.releaseVersion}`);
    const versionResult = await releaseVersion({
      specifier: argv.releaseVersion,
      stageChanges: false,
      gitCommit: false,
      gitTag: false,
      firstRelease: true,
      generatorOptionsOverrides: {
        skipLockFileUpdate: true,
      },
    });

    console.log('Version update result:', versionResult);

    if (!versionResult.projectsVersionData || Object.keys(versionResult.projectsVersionData).length === 0) {
      throw new Error('No projects found to version');
    }

    const { projectsVersionData } = versionResult;

    // Log all projects and their new versions
    console.log('Projects version data:', JSON.stringify(projectsVersionData, null, 2));

    console.log('Publishing packages to local registry...');
    const publishStatus = await releasePublish({
      firstRelease: true,
      registry: REGISTRY_URL,
      verbose: true,
      tag: 'local'
    });

    if (!publishStatus) {
      throw new Error('Package publishing failed');
    }
    console.log('✓ Packages published successfully');

    const packagesToInstall = Object.entries(projectsVersionData).map(([projectName, { newVersion }]) => {
      const project = readCachedProjectGraph().nodes[projectName];
      const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), project.data.root, `package.json`)).toString());

      console.log(`Preparing to install package: ${packageJson.name}@${newVersion}`);

      if (packageJson.name === '@nestled/generators') {
        console.log('Installing generator dependencies...');
        Object.entries(packageJson.dependencies || {}).forEach(([dep, version]) => {
          console.log(`- ${dep}@${version}`);
        });
      }

      return `${packageJson.name}@${newVersion}`;
    });

    const targetPath = resolve(process.cwd(), argv.targetPath);
    const installCommand = `${getInstallCommand(targetPath)} ${packagesToInstall.join(
      ' ',
    )} --registry=${REGISTRY_URL}`;

    console.log('Installing packages in target workspace:', installCommand);

    process.chdir(targetPath);
    for (const pkg of packagesToInstall) {
      const singleInstallCommand = `${getInstallCommand(targetPath)} ${pkg} --registry=${REGISTRY_URL}`;
      console.log(`Installing package: ${pkg}`);
      try {
        execSync(singleInstallCommand, { stdio: 'inherit' });
        console.log(`✓ Successfully installed ${pkg}`);
      } catch (error) {
        console.error(`✗ Failed to install ${pkg}:`, error);
        throw error;
      }
    }

    console.log('All operations completed successfully. Cleaning up...');
    if (stopRegistry) {
      stopRegistry();
    }
    stopLocalRegistry();
    process.exit(publishStatus ? 0 : 1);
  } catch (error) {
    console.error('Error occurred:', error);
    if (stopRegistry) {
      stopRegistry();
    }
    stopLocalRegistry();
    process.exit(1);
  }
})().catch((error) => {
  console.error('Unhandled error:', error);
  stopLocalRegistry();
  process.exit(1);
});

function getInstallCommand(targetPath) {
  const siblingFiles = readdirSync(targetPath);

  if (siblingFiles.includes('yarn.lock')) {
    return 'yarn add';
  }
  if (siblingFiles.includes('package-lock.json')) {
    return 'npm install';
  }
  if (siblingFiles.includes('pnpm-lock.yaml')) {
    return 'pnpm add -w';
  }
  throw new Error(`No package manager found for target repository: ${targetPath}`);
} 
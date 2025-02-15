const { startLocalRegistry } = require('@nx/js/plugins/jest/local-registry');
const { execFileSync } = require('child_process');
const { releasePublish, releaseVersion } = require('nx/release');

module.exports = async () => {
  const localRegistryTarget = '@nestled/source:local-registry';
  const storage = './tmp/local-registry/storage';

  global.stopLocalRegistry = await startLocalRegistry({
    localRegistryTarget,
    storage,
    verbose: false,
  });

  await releaseVersion({
    specifier: '0.0.0-e2e',
    stageChanges: false,
    gitCommit: false,
    gitTag: false,
    firstRelease: true,
    generatorOptionsOverrides: {
      skipLockFileUpdate: true,
    },
  });
  await releasePublish({
    tag: 'e2e',
    firstRelease: true,
  });
}; 
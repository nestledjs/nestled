const { startLocalRegistry } = require('@nx/js/plugins/jest/local-registry');
const { execFileSync } = require('child_process');
const { releasePublish, releaseVersion } = require('nx/release');

const REGISTRY_PORT = 4873;
const REGISTRY_URL = `http://localhost:${REGISTRY_PORT}`;

module.exports = async () => {
  const localRegistryTarget = '@nestled/source:local-registry';
  const storage = './tmp/local-registry/storage';

  // Ensure we stop any existing registry first
  if (global.stopLocalRegistry) {
    global.stopLocalRegistry();
  }

  try {
    global.stopLocalRegistry = await startLocalRegistry({
      localRegistryTarget,
      storage,
      verbose: false,
      port: REGISTRY_PORT, // Explicitly set the port
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
      registry: REGISTRY_URL,
    });

    return {
      stopLocalRegistry: global.stopLocalRegistry,
      registryUrl: REGISTRY_URL,
    };
  } catch (error) {
    if (global.stopLocalRegistry) {
      global.stopLocalRegistry();
    }
    throw error;
  }
}; 
const REGISTRY_PORT = 4873;
const { execSync } = require('child_process');

module.exports = () => {
  try {
    console.log('Attempting to stop local registry...');
    
    // First try the global stop function if it exists
    if (global.stopLocalRegistry) {
      console.log('Using global stop function...');
      global.stopLocalRegistry();
      global.stopLocalRegistry = null;
    }

    // Then try to kill any process using the registry port
    try {
      console.log(`Checking for processes using port ${REGISTRY_PORT}...`);
      const output = execSync(`lsof -ti:${REGISTRY_PORT}`).toString().trim();
      if (output) {
        console.log(`Found process(es) using port ${REGISTRY_PORT}, attempting to kill...`);
        execSync(`kill -9 ${output}`);
        console.log('Successfully killed process(es)');
      } else {
        console.log(`No processes found using port ${REGISTRY_PORT}`);
      }
    } catch (error) {
      // This is expected if no process is found
      if (!error.message.includes('No such process')) {
        console.error('Error while checking/killing process:', error);
      }
    }

    console.log('Local registry cleanup completed');
  } catch (error) {
    console.error('Error during local registry cleanup:', error);
    // Even if there's an error, we want to clear the reference
    global.stopLocalRegistry = null;
  }
}; 
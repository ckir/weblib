// This is an example usage file for ConnectRedisMulti.mjs
// To run this, you need to have your environment variables for the cloud config set up.
// (WEBLIB_CLOUD_CONFIG_URL and WEBLIB_AES_PASSWORD)

import ConnectRedisMulti from './ConnectRedisMulti.mjs';
import { default as ConfigCloud } from '../Configs/ConfigCloud.mjs';
import { default as Logger } from '../Loggers/LoggerDummy.mjs';

// --- Setup ---
// The connection modules rely on global.configData and global.logger.
// In a real application, this would be set up once at the entry point.
async function setupGlobals() {
  if (!global.logger) {
    global.logger = new Logger();
    global.logger.info('Logger initialized for test.');
  }
  if (!global.configData) {
    try {
      global.logger.info('Fetching cloud configuration...');
      global.configData = await ConfigCloud.getCloudConfig();
      global.logger.info('Cloud configuration loaded.');
    } catch (error) {
      global.logger.fatal(`Failed to load configuration. Cannot proceed with test. ${error.message}`);
      process.exit(1);
    }
  }
}

// Helper function to log results from Promise.allSettled
function logResults(operation, results) {
  console.log(`\n--- Results for ${operation} ---`);
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`  [${index}] SUCCESS: ${result.value}`);
    } else {
      console.error(`  [${index}] FAILED: ${result.reason.message}`);
    }
  });
  console.log('--------------------------\n');
}


async function main() {
  await setupGlobals();

  // The imports for ConnectRedis and ConnectRedisCloud happen inside ConnectRedisMulti,
  // and they will initialize themselves using the globals we just set up.

  console.log('--- Starting ConnectRedisMulti Test ---');

  // 1. Test setAll
  const testKey = `test-key-${Date.now()}`;
  const testValue = 'This value was set by ConnectRedisMulti.setAll';
  console.log(`Attempting to set key "${testKey}" on all Redis instances...`);
  const setResults = await ConnectRedisMulti.setAll([testKey, testValue]);
  logResults('setAll', setResults);

  // 2. Test publishAll
  const channel = 'global-notifications';
  const message = 'A message for all subscribers from ConnectRedisMulti!';
  console.log(`Attempting to publish message to channel "${channel}" on all Redis instances...`);
  const publishResults = await ConnectRedisMulti.publishAll([channel, message]);
  logResults('publishAll', publishResults);
  // Note: The result of a PUBLISH command is the number of clients that received the message.

  // 3. Clean up
  console.log('Attempting to close all connections...');
  const closeResults = await ConnectRedisMulti.closeAll();
  logResults('closeAll', closeResults);

  console.log('--- ConnectRedisMulti Test Finished ---');
}

main().catch(error => {
  console.error('An unexpected error occurred during the test:', error);
  process.exit(1);
});
/** @type {import('jest').Config} */
const config = {
  // The root directory that Jest should scan for tests and modules within.
  // We set it to the 'src' directory where all the code lives.
  rootDir: 'src',

  // This is the key change. By providing an empty transform object,
  // we are telling Jest to not use Babel for transformation and instead
  // rely on Node.js's native ESM support, which is enabled by the
  // --experimental-vm-modules flag in the test script.
  transform: {},

  // A list of paths to modules that run some code to configure or set up
  // the testing framework before each test file in the suite is executed.
  setupFiles: ['./test-setup.mjs'],

  // The test environment that will be used for testing.
  testEnvironment: 'node',
};

export default config;

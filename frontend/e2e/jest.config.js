/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  rootDir: "..",
  testMatch: ["<rootDir>/e2e/**/*.test.js"],
  testTimeout: 180000, // Increased timeout for API calls
  maxWorkers: 1,
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  reporters: ["detox/runners/jest/reporter"],
  testEnvironment: "detox/runners/jest/testEnvironment",
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/e2e/setup.js"],
  testSequencer: "<rootDir>/e2e/testSequencer.js",
};

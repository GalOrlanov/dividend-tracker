// Test sequencer to ensure proper test order
const TestSequencer = require("@jest/test-sequencer").default;

class CustomSequencer extends TestSequencer {
  sort(tests) {
    // Define test order priority
    const testOrder = [
      "app.test.js", // Basic app functionality first
      "search.test.js", // Search functionality
      "portfolio.test.js", // Portfolio functionality
      "api.test.js", // API integration tests last
    ];

    return tests.sort((testA, testB) => {
      const indexA = testOrder.findIndex((pattern) => testA.path.includes(pattern));
      const indexB = testOrder.findIndex((pattern) => testB.path.includes(pattern));

      // If both tests have defined order, sort by that order
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // If only one has defined order, prioritize it
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // If neither has defined order, sort alphabetically
      return testA.path.localeCompare(testB.path);
    });
  }
}

module.exports = CustomSequencer;

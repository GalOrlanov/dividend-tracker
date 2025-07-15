# Dividend Tracker E2E Test Suite

## 🎯 Overview

This comprehensive end-to-end test suite validates all major functionality of the Dividend Tracker app using Detox. The tests ensure that the app works correctly across different scenarios, API integrations, and user interactions.

## 📊 Test Coverage

### ✅ **Core App Functionality** (app.test.js)

- **Navigation**: Tab switching between Dashboard, Dividends, Search, and Portfolio
- **UI Elements**: Verification of all major UI components and screens
- **Basic Interactions**: Button taps, form inputs, and screen transitions

### 🔍 **Search & Stock Management** (search.test.js)

- **Stock Search**: Real-time API integration with Alpha Vantage
- **Search Filters**: Dividend yield range filtering
- **Results Display**: Proper formatting and data presentation
- **Stock Selection**: Navigation to stock details and portfolio addition
- **Error Handling**: Invalid searches and network issues

### 💼 **Portfolio Management** (portfolio.test.js)

- **Portfolio Summary**: Investment totals, current values, yields
- **Enhanced Charts**: Dividend history visualization with tooltips
- **Calendar View**: Upcoming dividend payouts with date calculations
- **Stock Actions**: Edit, delete, and refresh functionality
- **Empty States**: Proper handling when no data exists

### 🌐 **API Integration** (api.test.js)

- **Backend Connectivity**: MongoDB integration and data persistence
- **Real-time Data**: Stock quotes and company information
- **CRUD Operations**: Portfolio management (Create, Read, Update, Delete)
- **Data Synchronization**: Cross-tab data consistency
- **Performance**: Large dataset handling and API rate limiting

## 🚀 Quick Start

### Prerequisites

1. **Backend Server**: Running on `http://localhost:5001`
2. **iOS Simulator**: iPhone 15 (or available alternative)
3. **Dependencies**: All npm packages installed

### Running Tests

```bash
# Navigate to frontend directory
cd frontend

# Option 1: Use the test runner script (recommended)
./run-tests.sh

# Option 2: Manual execution
npm run test:e2e:build
npm run test:e2e

# Option 3: Check prerequisites only
./run-tests.sh check

# Option 4: Clean and rebuild
./run-tests.sh clean
./run-tests.sh build
```

## 🧪 Test Structure

### Test Files

```
e2e/
├── app.test.js          # Core app functionality
├── search.test.js       # Search and stock management
├── portfolio.test.js    # Portfolio and chart features
├── api.test.js         # API integration and backend
├── setup.js            # Global test configuration
├── testSequencer.js    # Test execution order
└── jest.config.js      # Jest configuration
```

### Test Organization

Each test file follows a hierarchical structure:

```javascript
describe("Feature Name", () => {
  describe("Sub-feature", () => {
    it("should perform specific action", async () => {
      // Test implementation
    });
  });
});
```

## 🔧 Test Helpers

### Global Helper Functions

```javascript
// Navigation
await navigateToTab("Portfolio");
await tapByText("Search");

// Input handling
await typeText("search-input", "AAPL");
await clearAndTypeText("shares-input", "10");

// Waiting and verification
await waitForElement("chart-container");
await waitForText("Portfolio Summary");
await waitForAPIResponse("Apple Inc.");

// Complex operations
await performSearch("MSFT");
await addStockToPortfolio("AAPL", "10", "150");
```

### Test IDs Added

The following test IDs have been added to components:

- `search-input`: Main search field
- `min-yield-input` / `max-yield-input`: Yield filters
- `result-item`: Search result cards
- `stock-symbol` / `company-name`: Stock information
- `portfolio-scroll-view`: Portfolio scroll container
- `chart-container` / `chart-bars`: Chart elements
- `payout-item` / `payout-badge`: Calendar items
- `stock-menu-button`: Stock action menu
- `add-stock-fab`: Floating action button

## 📱 Test Configuration

### iOS Configuration

- **Device**: iPhone 15 Simulator
- **Platform**: iOS
- **Build**: Debug configuration
- **Timeout**: 180 seconds per test

### Android Configuration

- **Device**: Pixel 3a API 30 Emulator
- **Platform**: Android
- **Build**: Debug configuration

### Timeouts

- **Test Timeout**: 180 seconds (3 minutes)
- **API Timeout**: 15 seconds
- **Element Wait**: 10 seconds

## 🐛 Debugging

### Common Issues

1. **Backend Not Running**

   ```bash
   # Check backend status
   curl http://localhost:5001/api/health

   # Start backend
   cd ../backend && npm run dev
   ```

2. **Simulator Issues**

   ```bash
   # List available simulators
   xcrun simctl list devices

   # Reset simulator
   xcrun simctl erase all
   ```

3. **API Rate Limiting**

   - Alpha Vantage free tier: 5 calls/minute
   - Tests include delays between API calls
   - Consider upgrading API key for faster testing

4. **Test Failures**

   ```bash
   # Run with verbose logging
   npx detox test -c ios.sim.debug --loglevel trace

   # Run specific test
   npx detox test -c ios.sim.debug --testNamePattern="should search for stocks"
   ```

### Debug Logging

```bash
# Enable detailed logging
npx detox test -c ios.sim.debug --loglevel trace

# View test artifacts
open ~/Library/Developer/Xcode/DerivedData
```

## 📊 Test Reports

### Generated Reports

- **Test Results**: Pass/fail status for each test
- **Screenshots**: Automatic screenshots on test failures
- **Console Logs**: Detailed logging of test execution
- **Network Logs**: API request/response tracking
- **Performance Metrics**: Test execution times

### Report Location

```
artifacts/
├── screenshots/
├── logs/
└── reports/
```

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "18"

      - name: Install dependencies
        run: |
          cd frontend && npm install
          cd ../backend && npm install

      - name: Start backend
        run: |
          cd backend
          npm run dev &
          sleep 10

      - name: Run E2E tests
        run: |
          cd frontend
          npm run test:e2e:build
          npm run test:e2e
```

## 📈 Performance Considerations

### API Rate Limiting

- Alpha Vantage: 5 calls/minute (free tier)
- Tests include 1-second delays between API calls
- Consider using mock data for faster testing

### Test Optimization

- Tests run in parallel where possible
- Shared setup/teardown for efficiency
- Smart waiting strategies to reduce flakiness

### Memory Management

- Tests clean up after themselves
- Simulator reset between test runs
- Proper resource cleanup

## 🎯 Best Practices

### Test Design

1. **Isolation**: Each test is independent
2. **Realistic Data**: Use real stock symbols and data
3. **Error Scenarios**: Test both success and failure cases
4. **Performance**: Consider API limits and timeouts
5. **Maintainability**: Use helper functions and clear names

### Code Quality

1. **Descriptive Names**: Clear test and describe block names
2. **Helper Functions**: Reusable test utilities
3. **Proper Assertions**: Specific and meaningful checks
4. **Error Handling**: Graceful failure handling
5. **Documentation**: Clear comments and README

## 📞 Support

### Getting Help

1. **Check Backend**: Ensure backend is running on port 5001
2. **Verify API Keys**: Confirm Alpha Vantage API key is configured
3. **Simulator Status**: Check iOS simulator availability
4. **Test Logs**: Review detailed test execution logs
5. **Dependencies**: Ensure all packages are installed

### Useful Commands

```bash
# Check test setup
./run-tests.sh check

# Clean and rebuild
./run-tests.sh clean
./run-tests.sh build

# Run specific test file
npx detox test -c ios.sim.debug e2e/search.test.js

# Debug mode
npx detox test -c ios.sim.debug --loglevel trace
```

## 🎉 Success Metrics

When all tests pass, you can be confident that:

- ✅ All major app features work correctly
- ✅ API integrations are functioning
- ✅ UI components render properly
- ✅ Data flows correctly through the app
- ✅ Error handling works as expected
- ✅ Performance meets requirements

The test suite provides comprehensive coverage of the Dividend Tracker app's functionality, ensuring a reliable and robust user experience.

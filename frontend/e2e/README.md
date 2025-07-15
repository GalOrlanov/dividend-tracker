# Dividend Tracker E2E Tests

This directory contains comprehensive end-to-end tests for the Dividend Tracker app using Detox.

## 🧪 Test Coverage

### 1. **App Navigation Tests** (`app.test.js`)

- Tab navigation between Dashboard, Dividends, Search, and Portfolio
- Screen transitions and UI element visibility
- Basic app functionality verification

### 2. **Search Functionality Tests** (`search.test.js`)

- Stock search with real-time API integration
- Search filters (dividend yield range)
- Search results display and formatting
- Stock selection and details view
- Add stock to portfolio workflow
- Error handling for invalid searches

### 3. **Portfolio Management Tests** (`portfolio.test.js`)

- Portfolio summary display
- Enhanced chart functionality with tooltips
- Calendar view for upcoming dividend payouts
- Portfolio holdings management
- Stock actions (edit, delete, refresh)
- Dividend history summary
- FAB functionality
- Pull-to-refresh functionality
- Empty state handling

### 4. **API Integration Tests** (`api.test.js`)

- Backend connectivity verification
- Real-time stock data fetching
- Portfolio API operations (CRUD)
- Dividend history API
- Market data API integration
- Error handling and network issues
- Data synchronization across tabs
- Performance testing with large datasets

## 🚀 Running Tests

### Prerequisites

1. **Backend Server**: Ensure the backend is running on `http://localhost:5001`
2. **iOS Simulator**: For iOS tests (recommended)
3. **Android Emulator**: For Android tests

### Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Build and run iOS tests
npm run test:e2e:build
npm run test:e2e

# Build and run Android tests
npm run test:e2e:build:android
npm run test:e2e:android

# Clean up
npm run test:e2e:clean
```

### Individual Test Files

```bash
# Run specific test file
npx detox test -c ios.sim.debug --testNamePattern="Search Functionality"

# Run tests with specific pattern
npx detox test -c ios.sim.debug --testNamePattern="should search for stocks"
```

## 📱 Test Configuration

### iOS Configuration

- **Device**: iPhone 15 Simulator
- **Platform**: iOS
- **Build**: Debug configuration

### Android Configuration

- **Device**: Pixel 3a API 30 Emulator
- **Platform**: Android
- **Build**: Debug configuration

## ⏱️ Timeouts

- **Test Timeout**: 180 seconds (3 minutes)
- **API Timeout**: 15 seconds
- **Element Wait Timeout**: 10 seconds

## 🔧 Test Helpers

The tests include several helper functions for common operations:

```javascript
// Navigation helpers
await navigateToTab("Portfolio");
await tapByText("Search");

// Input helpers
await typeText("search-input", "AAPL");
await clearAndTypeText("shares-input", "10");

// Wait helpers
await waitForElement("chart-container");
await waitForText("Portfolio Summary");
await waitForAPIResponse("Apple Inc.");

// Search helpers
await performSearch("MSFT");
await addStockToPortfolio("AAPL", "10", "150");
```

## 🧪 Test Data

The tests use real API data from:

- **Alpha Vantage**: Stock quotes and company information
- **Backend API**: Portfolio management and dividend history

### Sample Test Data

- **Stocks**: AAPL, MSFT, O (Realty Income), JNJ, PG
- **Portfolio Entries**: Sample stocks with dividend data
- **Dividend History**: Historical dividend payments

## 🐛 Debugging Tests

### Enable Debug Logging

```bash
# Run tests with verbose logging
npx detox test -c ios.sim.debug --loglevel trace
```

### Common Issues

1. **Backend Not Running**

   - Ensure backend is running on port 5001
   - Check API connectivity: `curl http://localhost:5001/api/health`

2. **Simulator Issues**

   - Reset simulator: `xcrun simctl erase all`
   - Check available simulators: `xcrun simctl list devices`

3. **API Rate Limiting**

   - Alpha Vantage has rate limits (5 calls/minute for free tier)
   - Tests include delays between API calls

4. **Test Timeouts**
   - Increase timeout in `jest.config.js` if needed
   - Check network connectivity

## 📊 Test Reports

Tests generate detailed reports including:

- Test execution time
- Pass/fail status
- Screenshots on failure
- Console logs
- Network request logs

## 🔄 Continuous Integration

For CI/CD integration, add these steps:

```yaml
# Example GitHub Actions workflow
- name: Start Backend
  run: |
    cd backend
    npm install
    npm run dev &

- name: Run E2E Tests
  run: |
    cd frontend
    npm run test:e2e:build
    npm run test:e2e
```

## 📝 Adding New Tests

1. **Create test file**: `e2e/new-feature.test.js`
2. **Follow naming convention**: `describe('Feature Name')`
3. **Use helper functions**: Leverage existing helpers
4. **Add to sequencer**: Update `testSequencer.js` if needed
5. **Update README**: Document new test coverage

## 🎯 Best Practices

1. **Test Isolation**: Each test should be independent
2. **Realistic Data**: Use real stock symbols and data
3. **Error Scenarios**: Test both success and failure cases
4. **Performance**: Consider API rate limits and timeouts
5. **Maintainability**: Use helper functions and clear test names

## 📞 Support

For test-related issues:

1. Check the backend is running
2. Verify API keys are configured
3. Check simulator/emulator status
4. Review test logs for specific errors
5. Ensure all dependencies are installed

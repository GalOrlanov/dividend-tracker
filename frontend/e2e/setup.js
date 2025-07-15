// Global setup for Detox tests
const { device, element, by, expect, waitFor } = require("detox");

// Global test configuration
global.TEST_TIMEOUT = 10000;
global.API_TIMEOUT = 15000;

// Helper function to wait for element with custom timeout
global.waitForElement = async (elementId, timeout = global.TEST_TIMEOUT) => {
  return waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(timeout);
};

// Helper function to wait for text with custom timeout
global.waitForText = async (text, timeout = global.TEST_TIMEOUT) => {
  return waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout);
};

// Helper function to tap element by text
global.tapByText = async (text) => {
  await element(by.text(text)).tap();
};

// Helper function to type text into input
global.typeText = async (elementId, text) => {
  await element(by.id(elementId)).typeText(text);
};

// Helper function to clear and type text
global.clearAndTypeText = async (elementId, text) => {
  await element(by.id(elementId)).clearText();
  await element(by.id(elementId)).typeText(text);
};

// Helper function to navigate to tab
global.navigateToTab = async (tabName) => {
  await element(by.text(tabName)).tap();
};

// Helper function to check if element exists
global.elementExists = async (elementId) => {
  try {
    await expect(element(by.id(elementId))).toBeVisible();
    return true;
  } catch (error) {
    return false;
  }
};

// Helper function to check if text exists
global.textExists = async (text) => {
  try {
    await expect(element(by.text(text))).toBeVisible();
    return true;
  } catch (error) {
    return false;
  }
};

// Helper function to wait for API response
global.waitForAPIResponse = async (expectedText, timeout = global.API_TIMEOUT) => {
  return waitFor(element(by.text(expectedText)))
    .toBeVisible()
    .withTimeout(timeout);
};

// Helper function to perform search
global.performSearch = async (searchTerm) => {
  await navigateToTab("Search");
  await typeText("search-input", searchTerm);
  await tapByText("Search");
};

// Helper function to add stock to portfolio
global.addStockToPortfolio = async (symbol, shares, price) => {
  await performSearch(symbol);
  await waitForAPIResponse("Apple Inc."); // Generic company name
  await tapByText("Apple Inc.");
  await typeText("shares-input", shares);
  await typeText("purchase-price-input", price);
  await tapByText("Add to Portfolio");
};

// Helper function to refresh portfolio
global.refreshPortfolio = async () => {
  await navigateToTab("Portfolio");
  await element(by.id("portfolio-scroll-view")).scrollTo("top");
};

// Global beforeAll hook
beforeAll(async () => {
  console.log("🚀 Starting Dividend Tracker E2E Tests");
  console.log("📱 Device:", device.getPlatform());
  console.log("⏰ Test Timeout:", global.TEST_TIMEOUT);
  console.log("🌐 API Timeout:", global.API_TIMEOUT);
});

// Global afterAll hook
afterAll(async () => {
  console.log("✅ Dividend Tracker E2E Tests Completed");
});

// Global beforeEach hook
beforeEach(async () => {
  console.log("🔄 Reloading app for new test");
});

// Global afterEach hook
afterEach(async () => {
  console.log("🧹 Test completed, cleaning up");
});

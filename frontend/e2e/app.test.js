const { by, device, element, expect } = require("detox");

describe("Dividend Tracker App", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe("App Navigation", () => {
    it("should navigate between all tabs", async () => {
      // Check if Dashboard tab is active by default
      await expect(element(by.text("Dashboard"))).toBeVisible();

      // Navigate to Dividends tab
      await element(by.text("Dividends")).tap();
      await expect(element(by.text("Dividend History"))).toBeVisible();

      // Navigate to Search tab
      await element(by.text("Search")).tap();
      await expect(element(by.text("Search Stocks"))).toBeVisible();

      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();
      await expect(element(by.text("Portfolio Summary"))).toBeVisible();
    });
  });

  describe("Stock Search Functionality", () => {
    it("should search for stocks and display results", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Enter search query
      await element(by.id("search-input")).typeText("AAPL");

      // Tap search button
      await element(by.text("Search")).tap();

      // Wait for results and verify
      await waitFor(element(by.text("Apple Inc.")))
        .toBeVisible()
        .withTimeout(5000);
      await expect(element(by.text("AAPL"))).toBeVisible();
    });

    it("should filter stocks by dividend yield", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Enter search query
      await element(by.id("search-input")).typeText("O");

      // Set minimum yield filter
      await element(by.id("min-yield-input")).typeText("3");

      // Tap search button
      await element(by.text("Search")).tap();

      // Verify filtered results
      await waitFor(element(by.text("Realty Income Corp")))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe("Portfolio Management", () => {
    it("should add stock to portfolio", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for a stock
      await element(by.id("search-input")).typeText("MSFT");
      await element(by.text("Search")).tap();

      // Wait for results and select first stock
      await waitFor(element(by.text("Microsoft Corporation")))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.text("Microsoft Corporation")).tap();

      // Fill in portfolio form
      await element(by.id("shares-input")).typeText("10");
      await element(by.id("purchase-price-input")).typeText("300");

      // Add to portfolio
      await element(by.text("Add to Portfolio")).tap();

      // Verify success message
      await expect(element(by.text("Stock added to portfolio"))).toBeVisible();
    });

    it("should display portfolio summary", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Verify portfolio summary elements
      await expect(element(by.text("Total Investment"))).toBeVisible();
      await expect(element(by.text("Current Value"))).toBeVisible();
      await expect(element(by.text("Annual Dividends"))).toBeVisible();
      await expect(element(by.text("Avg Yield"))).toBeVisible();
    });

    it("should switch between portfolio and calendar tabs", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Switch to Calendar tab
      await element(by.text("Calendar")).tap();

      // Verify calendar elements
      await expect(element(by.text("Upcoming Dividend Payouts"))).toBeVisible();
      await expect(element(by.text("Next 30 Days"))).toBeVisible();
      await expect(element(by.text("Next 90 Days"))).toBeVisible();

      // Switch back to Portfolio tab
      await element(by.text("Portfolio")).tap();
      await expect(element(by.text("Portfolio Summary"))).toBeVisible();
    });
  });

  describe("Dividend Chart", () => {
    it("should display dividend history chart", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Verify chart is displayed
      await expect(element(by.text("Dividend Income (Last 12 Months)"))).toBeVisible();

      // Check for chart legend
      await expect(element(by.text("Monthly Dividend Income"))).toBeVisible();
    });
  });

  describe("Stock Management", () => {
    it("should edit stock in portfolio", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Find and tap menu on first stock
      await element(by.id("stock-menu-button")).atIndex(0).tap();

      // Tap edit option
      await element(by.text("Edit")).tap();

      // Update shares
      await element(by.id("edit-shares-input")).clearText();
      await element(by.id("edit-shares-input")).typeText("15");

      // Save changes
      await element(by.text("Save")).tap();

      // Verify success message
      await expect(element(by.text("Portfolio updated"))).toBeVisible();
    });

    it("should delete stock from portfolio", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Find and tap menu on first stock
      await element(by.id("stock-menu-button")).atIndex(0).tap();

      // Tap delete option
      await element(by.text("Delete")).tap();

      // Confirm deletion
      await element(by.text("Delete")).atIndex(1).tap();

      // Verify success message
      await expect(element(by.text("Stock removed from portfolio"))).toBeVisible();
    });
  });

  describe("Dividend History", () => {
    it("should display dividend history", async () => {
      // Navigate to Dividends tab
      await element(by.text("Dividends")).tap();

      // Verify dividend history elements
      await expect(element(by.text("Total Received"))).toBeVisible();
      await expect(element(by.text("This Year"))).toBeVisible();
      await expect(element(by.text("This Month"))).toBeVisible();
    });
  });

  describe("Dashboard", () => {
    it("should display dashboard with summary", async () => {
      // Navigate to Dashboard tab
      await element(by.text("Dashboard")).tap();

      // Verify dashboard elements
      await expect(element(by.text("Portfolio Overview"))).toBeVisible();
      await expect(element(by.text("Recent Dividends"))).toBeVisible();
      await expect(element(by.text("Upcoming Payouts"))).toBeVisible();
    });
  });

  describe("Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for invalid stock
      await element(by.id("search-input")).typeText("INVALID123");
      await element(by.text("Search")).tap();

      // Should show appropriate error or empty state
      await expect(element(by.text("No results found"))).toBeVisible();
    });
  });
});

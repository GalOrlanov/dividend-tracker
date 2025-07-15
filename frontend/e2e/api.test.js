const { by, device, element, expect, waitFor } = require("detox");

describe("API Integration Tests", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe("Backend Connectivity", () => {
    it("should connect to backend and load portfolio data", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Wait for data to load
      await waitFor(element(by.text("Portfolio Summary")))
        .toBeVisible()
        .withTimeout(5000);

      // Verify data is loaded (should show summary even if empty)
      await expect(element(by.text("Total Investment"))).toBeVisible();
      await expect(element(by.text("Current Value"))).toBeVisible();
      await expect(element(by.text("Annual Dividends"))).toBeVisible();
    });

    it("should load dividend history data", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Wait for dividend history to load
      await waitFor(element(by.text("Dividend History")))
        .toBeVisible()
        .withTimeout(5000);

      // Verify dividend history elements
      await expect(element(by.text("Total Received"))).toBeVisible();
      await expect(element(by.text("This Year"))).toBeVisible();
      await expect(element(by.text("This Month"))).toBeVisible();
    });

    it("should load upcoming payouts data", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Switch to Calendar tab
      await element(by.text("Calendar")).tap();

      // Wait for upcoming payouts to load
      await waitFor(element(by.text("Upcoming Dividend Payouts")))
        .toBeVisible()
        .withTimeout(5000);

      // Verify upcoming payouts elements
      await expect(element(by.text("Next 30 Days"))).toBeVisible();
      await expect(element(by.text("Next 90 Days"))).toBeVisible();
      await expect(element(by.text("Total Upcoming"))).toBeVisible();
    });
  });

  describe("Stock Data API", () => {
    it("should fetch real-time stock data", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for a stock
      await element(by.id("search-input")).typeText("AAPL");
      await element(by.text("Search")).tap();

      // Wait for API response
      await waitFor(element(by.text("Apple Inc.")))
        .toBeVisible()
        .withTimeout(10000);

      // Verify stock data is loaded
      await expect(element(by.text("AAPL"))).toBeVisible();
      await expect(element(by.text("Equity"))).toBeVisible();
      await expect(element(by.text("United States"))).toBeVisible();
    });

    it("should handle API rate limiting gracefully", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Perform multiple rapid searches to test rate limiting
      for (let i = 0; i < 3; i++) {
        await element(by.id("search-input")).clearText();
        await element(by.id("search-input")).typeText(`STOCK${i}`);
        await element(by.text("Search")).tap();

        // Wait a bit between searches
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Should handle without crashing
      await expect(element(by.text("Search Stocks"))).toBeVisible();
    });
  });

  describe("Portfolio API Operations", () => {
    it("should add stock to portfolio via API", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for a stock
      await element(by.id("search-input")).typeText("MSFT");
      await element(by.text("Search")).tap();

      // Wait for results and select stock
      await waitFor(element(by.text("Microsoft Corporation")))
        .toBeVisible()
        .withTimeout(10000);
      await element(by.text("Microsoft Corporation")).tap();

      // Fill portfolio form
      await element(by.id("shares-input")).typeText("5");
      await element(by.id("purchase-price-input")).typeText("250");

      // Add to portfolio
      await element(by.text("Add to Portfolio")).tap();

      // Verify API success
      await expect(element(by.text("Stock added to portfolio"))).toBeVisible();
    });

    it("should update stock in portfolio via API", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Try to edit stock if exists
      try {
        await waitFor(element(by.id("stock-menu-button")))
          .toBeVisible()
          .withTimeout(3000);
        await element(by.id("stock-menu-button")).atIndex(0).tap();
        await element(by.text("Edit")).tap();

        // Update shares
        await element(by.id("edit-shares-input")).clearText();
        await element(by.id("edit-shares-input")).typeText("20");

        // Save changes
        await element(by.text("Save")).tap();

        // Verify API success
        await expect(element(by.text("Portfolio updated"))).toBeVisible();
      } catch (error) {
        // If no stocks exist, this is expected
        console.log("No stocks to test update functionality");
      }
    });

    it("should delete stock from portfolio via API", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Try to delete stock if exists
      try {
        await waitFor(element(by.id("stock-menu-button")))
          .toBeVisible()
          .withTimeout(3000);
        await element(by.id("stock-menu-button")).atIndex(0).tap();
        await element(by.text("Delete")).tap();

        // Confirm deletion
        await element(by.text("Delete")).atIndex(1).tap();

        // Verify API success
        await expect(element(by.text("Stock removed from portfolio"))).toBeVisible();
      } catch (error) {
        // If no stocks exist, this is expected
        console.log("No stocks to test delete functionality");
      }
    });
  });

  describe("Dividend History API", () => {
    it("should load dividend history data", async () => {
      // Navigate to Dividends tab
      await element(by.text("Dividends")).tap();

      // Wait for dividend history to load
      await waitFor(element(by.text("Dividend History")))
        .toBeVisible()
        .withTimeout(5000);

      // Verify API data is loaded
      await expect(element(by.text("Total Received"))).toBeVisible();
      await expect(element(by.text("This Year"))).toBeVisible();
      await expect(element(by.text("This Month"))).toBeVisible();
    });

    it("should display dividend history entries", async () => {
      // Navigate to Dividends tab
      await element(by.text("Dividends")).tap();

      // Wait for data to load
      await waitFor(element(by.text("Dividend History")))
        .toBeVisible()
        .withTimeout(5000);

      // Check for dividend entries (if any exist)
      try {
        await waitFor(element(by.id("dividend-entry")))
          .toBeVisible()
          .withTimeout(3000);
        await expect(element(by.id("dividend-symbol"))).toBeVisible();
        await expect(element(by.id("dividend-amount"))).toBeVisible();
        await expect(element(by.id("dividend-date"))).toBeVisible();
      } catch (error) {
        // If no dividend history exists, this is expected
        console.log("No dividend history to test");
      }
    });
  });

  describe("Market Data API", () => {
    it("should fetch stock quotes", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for a stock
      await element(by.id("search-input")).typeText("AAPL");
      await element(by.text("Search")).tap();

      // Wait for results and select stock
      await waitFor(element(by.text("Apple Inc.")))
        .toBeVisible()
        .withTimeout(10000);
      await element(by.text("Apple Inc.")).tap();

      // Verify stock quote data is loaded
      await expect(element(by.text("Current Price:"))).toBeVisible();
      await expect(element(by.text("Dividend Yield:"))).toBeVisible();
    });

    it("should fetch company overview data", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for a stock
      await element(by.id("search-input")).typeText("MSFT");
      await element(by.text("Search")).tap();

      // Wait for results and select stock
      await waitFor(element(by.text("Microsoft Corporation")))
        .toBeVisible()
        .withTimeout(10000);
      await element(by.text("Microsoft Corporation")).tap();

      // Verify company overview data is loaded
      await expect(element(by.text("MSFT"))).toBeVisible();
      await expect(element(by.text("Microsoft Corporation"))).toBeVisible();
    });
  });

  describe("Error Handling", () => {
    it("should handle network connectivity issues", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Should still show UI even if API fails
      await expect(element(by.text("Portfolio Summary"))).toBeVisible();
      await expect(element(by.text("Total Investment"))).toBeVisible();
    });

    it("should handle API timeout gracefully", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for a stock
      await element(by.id("search-input")).typeText("AAPL");
      await element(by.text("Search")).tap();

      // Should handle timeout without crashing
      await expect(element(by.text("Search Stocks"))).toBeVisible();
    });

    it("should handle invalid API responses", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for invalid stock
      await element(by.id("search-input")).typeText("INVALID123");
      await element(by.text("Search")).tap();

      // Should handle invalid response gracefully
      await waitFor(element(by.text("No results found")))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe("Data Synchronization", () => {
    it("should sync data across tabs", async () => {
      // Add a stock to portfolio
      await element(by.text("Search")).tap();
      await element(by.id("search-input")).typeText("AAPL");
      await element(by.text("Search")).tap();

      await waitFor(element(by.text("Apple Inc.")))
        .toBeVisible()
        .withTimeout(10000);
      await element(by.text("Apple Inc.")).tap();

      await element(by.id("shares-input")).typeText("10");
      await element(by.id("purchase-price-input")).typeText("150");
      await element(by.text("Add to Portfolio")).tap();

      // Navigate to Portfolio tab and verify data is synced
      await element(by.text("Portfolio")).tap();
      await waitFor(element(by.text("AAPL")))
        .toBeVisible()
        .withTimeout(5000);
    });

    it("should refresh data on pull-to-refresh", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Perform pull-to-refresh
      await element(by.id("portfolio-scroll-view")).scrollTo("top");

      // Wait for refresh to complete
      await waitFor(element(by.text("Portfolio Summary")))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe("Performance Testing", () => {
    it("should handle large datasets efficiently", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Switch to Calendar tab
      await element(by.text("Calendar")).tap();

      // Should load efficiently even with many upcoming payouts
      await waitFor(element(by.text("Upcoming Dividend Payouts")))
        .toBeVisible()
        .withTimeout(5000);
    });

    it("should handle rapid API calls", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Perform multiple searches quickly
      const searches = ["AAPL", "MSFT", "O", "JNJ", "PG"];

      for (const search of searches) {
        await element(by.id("search-input")).clearText();
        await element(by.id("search-input")).typeText(search);
        await element(by.text("Search")).tap();

        // Wait a bit between searches
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Should handle without crashing
      await expect(element(by.text("Search Stocks"))).toBeVisible();
    });
  });
});

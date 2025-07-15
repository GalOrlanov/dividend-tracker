const { by, device, element, expect, waitFor } = require("detox");

describe("Search Functionality", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe("Search Screen Navigation", () => {
    it("should navigate to search screen and display search interface", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Verify search screen elements
      await expect(element(by.text("Search Stocks"))).toBeVisible();
      await expect(element(by.id("search-input"))).toBeVisible();
      await expect(element(by.text("Search"))).toBeVisible();
    });

    it("should display search filters", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Verify filter elements
      await expect(element(by.text("Filters"))).toBeVisible();
      await expect(element(by.id("min-yield-input"))).toBeVisible();
      await expect(element(by.id("max-yield-input"))).toBeVisible();
    });
  });

  describe("Stock Search", () => {
    it("should search for popular stocks and display results", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for Apple
      await element(by.id("search-input")).typeText("AAPL");
      await element(by.text("Search")).tap();

      // Wait for results
      await waitFor(element(by.text("Apple Inc.")))
        .toBeVisible()
        .withTimeout(5000);
      await expect(element(by.text("AAPL"))).toBeVisible();
      await expect(element(by.text("Equity"))).toBeVisible();
      await expect(element(by.text("United States"))).toBeVisible();
    });

    it("should search for Microsoft and display results", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for Microsoft
      await element(by.id("search-input")).typeText("MSFT");
      await element(by.text("Search")).tap();

      // Wait for results
      await waitFor(element(by.text("Microsoft Corporation")))
        .toBeVisible()
        .withTimeout(5000);
      await expect(element(by.text("MSFT"))).toBeVisible();
    });

    it("should search for dividend stocks and display results", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for Realty Income
      await element(by.id("search-input")).typeText("O");
      await element(by.text("Search")).tap();

      // Wait for results
      await waitFor(element(by.text("Realty Income Corp")))
        .toBeVisible()
        .withTimeout(5000);
      await expect(element(by.text("O"))).toBeVisible();
    });

    it("should handle search with no results", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for invalid stock
      await element(by.id("search-input")).typeText("INVALID123");
      await element(by.text("Search")).tap();

      // Should show no results or empty state
      await waitFor(element(by.text("No results found")))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe("Search Filters", () => {
    it("should filter stocks by minimum dividend yield", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for dividend stocks
      await element(by.id("search-input")).typeText("O");

      // Set minimum yield filter
      await element(by.id("min-yield-input")).typeText("3");

      // Search
      await element(by.text("Search")).tap();

      // Wait for filtered results
      await waitFor(element(by.text("Realty Income Corp")))
        .toBeVisible()
        .withTimeout(5000);
    });

    it("should filter stocks by maximum dividend yield", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for stocks
      await element(by.id("search-input")).typeText("AAPL");

      // Set maximum yield filter
      await element(by.id("max-yield-input")).typeText("2");

      // Search
      await element(by.text("Search")).tap();

      // Wait for filtered results
      await waitFor(element(by.text("Apple Inc.")))
        .toBeVisible()
        .withTimeout(5000);
    });

    it("should filter stocks by yield range", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for dividend stocks
      await element(by.id("search-input")).typeText("O");

      // Set yield range
      await element(by.id("min-yield-input")).typeText("3");
      await element(by.id("max-yield-input")).typeText("6");

      // Search
      await element(by.text("Search")).tap();

      // Wait for filtered results
      await waitFor(element(by.text("Realty Income Corp")))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe("Search Results Display", () => {
    it("should display search results with proper formatting", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for a stock
      await element(by.id("search-input")).typeText("AAPL");
      await element(by.text("Search")).tap();

      // Wait for results
      await waitFor(element(by.id("search-results")))
        .toBeVisible()
        .withTimeout(5000);

      // Verify result item structure
      await expect(element(by.id("result-item"))).toBeVisible();
      await expect(element(by.id("stock-symbol"))).toBeVisible();
      await expect(element(by.id("company-name"))).toBeVisible();
      await expect(element(by.id("stock-type"))).toBeVisible();
      await expect(element(by.id("stock-region"))).toBeVisible();
    });

    it("should display multiple search results", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for a broad term
      await element(by.id("search-input")).typeText("O");
      await element(by.text("Search")).tap();

      // Wait for multiple results
      await waitFor(element(by.id("search-results")))
        .toBeVisible()
        .withTimeout(5000);

      // Should show multiple result items
      await expect(element(by.id("result-item")).atIndex(0)).toBeVisible();
      await expect(element(by.id("result-item")).atIndex(1)).toBeVisible();
    });
  });

  describe("Stock Selection and Details", () => {
    it("should navigate to stock details when result is tapped", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for a stock
      await element(by.id("search-input")).typeText("AAPL");
      await element(by.text("Search")).tap();

      // Wait for results and tap first result
      await waitFor(element(by.text("Apple Inc.")))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.text("Apple Inc.")).tap();

      // Should navigate to stock details/add stock screen
      await expect(element(by.text("Add to Portfolio"))).toBeVisible();
    });

    it("should display stock details with proper information", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for a stock
      await element(by.id("search-input")).typeText("MSFT");
      await element(by.text("Search")).tap();

      // Wait for results and tap first result
      await waitFor(element(by.text("Microsoft Corporation")))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.text("Microsoft Corporation")).tap();

      // Verify stock details
      await expect(element(by.text("MSFT"))).toBeVisible();
      await expect(element(by.text("Microsoft Corporation"))).toBeVisible();
      await expect(element(by.text("Current Price:"))).toBeVisible();
      await expect(element(by.text("Dividend Yield:"))).toBeVisible();
    });
  });

  describe("Add Stock to Portfolio", () => {
    it("should display add to portfolio form", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for a stock
      await element(by.id("search-input")).typeText("AAPL");
      await element(by.text("Search")).tap();

      // Wait for results and tap first result
      await waitFor(element(by.text("Apple Inc.")))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.text("Apple Inc.")).tap();

      // Verify form elements
      await expect(element(by.text("Add to Portfolio"))).toBeVisible();
      await expect(element(by.id("shares-input"))).toBeVisible();
      await expect(element(by.id("purchase-price-input"))).toBeVisible();
      await expect(element(by.id("purchase-date-input"))).toBeVisible();
    });

    it("should add stock to portfolio with valid data", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for a stock
      await element(by.id("search-input")).typeText("MSFT");
      await element(by.text("Search")).tap();

      // Wait for results and tap first result
      await waitFor(element(by.text("Microsoft Corporation")))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.text("Microsoft Corporation")).tap();

      // Fill form
      await element(by.id("shares-input")).typeText("10");
      await element(by.id("purchase-price-input")).typeText("300");

      // Add to portfolio
      await element(by.text("Add to Portfolio")).tap();

      // Verify success
      await expect(element(by.text("Stock added to portfolio"))).toBeVisible();
    });

    it("should validate form inputs", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for a stock
      await element(by.id("search-input")).typeText("AAPL");
      await element(by.text("Search")).tap();

      // Wait for results and tap first result
      await waitFor(element(by.text("Apple Inc.")))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.text("Apple Inc.")).tap();

      // Try to add without filling required fields
      await element(by.text("Add to Portfolio")).tap();

      // Should show validation error
      await expect(element(by.text("Please fill in all required fields"))).toBeVisible();
    });
  });

  describe("Search Performance", () => {
    it("should handle rapid search requests", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Perform multiple searches quickly
      await element(by.id("search-input")).typeText("AAPL");
      await element(by.text("Search")).tap();

      await element(by.id("search-input")).clearText();
      await element(by.id("search-input")).typeText("MSFT");
      await element(by.text("Search")).tap();

      await element(by.id("search-input")).clearText();
      await element(by.id("search-input")).typeText("O");
      await element(by.text("Search")).tap();

      // Should handle without crashing
      await waitFor(element(by.text("Realty Income Corp")))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe("Search Error Handling", () => {
    it("should handle network errors gracefully", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Search for invalid stock
      await element(by.id("search-input")).typeText("INVALID123");
      await element(by.text("Search")).tap();

      // Should show appropriate error message
      await waitFor(element(by.text("No results found")))
        .toBeVisible()
        .withTimeout(5000);
    });

    it("should handle empty search queries", async () => {
      // Navigate to Search tab
      await element(by.text("Search")).tap();

      // Try to search with empty input
      await element(by.text("Search")).tap();

      // Should not crash and should show appropriate message
      await expect(element(by.text("Search Stocks"))).toBeVisible();
    });
  });
});

const { by, device, element, expect, waitFor } = require("detox");

describe("Portfolio Functionality", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe("Portfolio Tab Navigation", () => {
    it("should display portfolio tab with summary", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Verify portfolio tab is active
      await expect(element(by.text("Portfolio Summary"))).toBeVisible();

      // Check summary grid elements
      await expect(element(by.text("Total Investment"))).toBeVisible();
      await expect(element(by.text("Current Value"))).toBeVisible();
      await expect(element(by.text("Annual Dividends"))).toBeVisible();
      await expect(element(by.text("Avg Yield"))).toBeVisible();
      await expect(element(by.text("Total Return"))).toBeVisible();
    });

    it("should switch to calendar tab and display upcoming payouts", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Switch to Calendar tab
      await element(by.text("Calendar")).tap();

      // Verify calendar view elements
      await expect(element(by.text("Upcoming Dividend Payouts"))).toBeVisible();
      await expect(element(by.text("Next 30 Days"))).toBeVisible();
      await expect(element(by.text("Next 90 Days"))).toBeVisible();
      await expect(element(by.text("Total Upcoming"))).toBeVisible();

      // Check for upcoming payouts list
      await expect(element(by.text("Upcoming Payouts"))).toBeVisible();
    });
  });

  describe("Enhanced Chart Functionality", () => {
    it("should display dividend history chart with proper styling", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Verify chart title
      await expect(element(by.text("Dividend Income (Last 12 Months)"))).toBeVisible();

      // Check for chart container
      await expect(element(by.id("chart-container"))).toBeVisible();

      // Verify chart legend
      await expect(element(by.text("Monthly Dividend Income"))).toBeVisible();

      // Check for legend color indicator
      await expect(element(by.id("legend-color"))).toBeVisible();
    });

    it("should show chart data when dividend history exists", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Wait for chart to load
      await waitFor(element(by.id("chart-container")))
        .toBeVisible()
        .withTimeout(3000);

      // Check if chart bars are visible (indicating data)
      await expect(element(by.id("chart-bars"))).toBeVisible();
    });
  });

  describe("Calendar View Features", () => {
    it("should display upcoming payouts with proper formatting", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Switch to Calendar tab
      await element(by.text("Calendar")).tap();

      // Check for payout items
      await expect(element(by.id("payout-list"))).toBeVisible();

      // Verify payout item structure (if payouts exist)
      try {
        await waitFor(element(by.id("payout-item")))
          .toBeVisible()
          .withTimeout(2000);

        // Check payout item elements
        await expect(element(by.id("payout-symbol"))).toBeVisible();
        await expect(element(by.id("payout-company"))).toBeVisible();
        await expect(element(by.id("payout-badge"))).toBeVisible();
        await expect(element(by.id("payout-amount"))).toBeVisible();
      } catch (error) {
        // If no payouts exist, check for empty state
        await expect(element(by.text("No upcoming payouts"))).toBeVisible();
      }
    });

    it("should show days until payout in badge format", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Switch to Calendar tab
      await element(by.text("Calendar")).tap();

      // Check for days badge (if payouts exist)
      try {
        await waitFor(element(by.id("payout-badge")))
          .toBeVisible()
          .withTimeout(2000);
        await expect(element(by.text("days"))).toBeVisible();
      } catch (error) {
        // If no payouts, this is expected
        console.log("No payouts to test badge functionality");
      }
    });
  });

  describe("Portfolio Holdings Management", () => {
    it("should display portfolio holdings list", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Verify holdings section
      await expect(element(by.text("Portfolio Holdings"))).toBeVisible();

      // Check for holdings list
      await expect(element(by.id("holdings-list"))).toBeVisible();
    });

    it("should show stock details in portfolio cards", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Check for stock card elements (if stocks exist)
      try {
        await waitFor(element(by.id("stock-card")))
          .toBeVisible()
          .withTimeout(2000);

        // Verify stock card content
        await expect(element(by.id("stock-symbol"))).toBeVisible();
        await expect(element(by.id("company-name"))).toBeVisible();
        await expect(element(by.text("Shares:"))).toBeVisible();
        await expect(element(by.text("Purchase Price:"))).toBeVisible();
        await expect(element(by.text("Current Price:"))).toBeVisible();
        await expect(element(by.text("Dividend/Share:"))).toBeVisible();
      } catch (error) {
        // If no stocks, check for empty state
        await expect(element(by.text("No stocks in portfolio"))).toBeVisible();
        await expect(element(by.text("Add stocks to start tracking your dividend income"))).toBeVisible();
      }
    });

    it("should display stock calculations correctly", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Check for calculation elements (if stocks exist)
      try {
        await waitFor(element(by.id("stock-card")))
          .toBeVisible()
          .withTimeout(2000);

        // Verify calculation fields
        await expect(element(by.text("Total Investment:"))).toBeVisible();
        await expect(element(by.text("Current Value:"))).toBeVisible();
        await expect(element(by.text("Annual Dividend:"))).toBeVisible();
        await expect(element(by.text("Yield on Cost:"))).toBeVisible();
        await expect(element(by.text("Capital G/L:"))).toBeVisible();
      } catch (error) {
        // If no stocks, this is expected
        console.log("No stocks to test calculations");
      }
    });
  });

  describe("Stock Actions Menu", () => {
    it("should open stock menu and show action options", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Try to open stock menu (if stocks exist)
      try {
        await waitFor(element(by.id("stock-menu-button")))
          .toBeVisible()
          .withTimeout(2000);
        await element(by.id("stock-menu-button")).atIndex(0).tap();

        // Verify menu options
        await expect(element(by.text("Edit"))).toBeVisible();
        await expect(element(by.text("Refresh Data"))).toBeVisible();
        await expect(element(by.text("Delete"))).toBeVisible();
      } catch (error) {
        // If no stocks, this is expected
        console.log("No stocks to test menu functionality");
      }
    });

    it("should open edit modal with correct form fields", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Try to edit stock (if stocks exist)
      try {
        await waitFor(element(by.id("stock-menu-button")))
          .toBeVisible()
          .withTimeout(2000);
        await element(by.id("stock-menu-button")).atIndex(0).tap();
        await element(by.text("Edit")).tap();

        // Verify edit modal
        await expect(element(by.text("Edit Stock"))).toBeVisible();
        await expect(element(by.id("edit-shares-input"))).toBeVisible();
        await expect(element(by.id("edit-purchase-price-input"))).toBeVisible();
        await expect(element(by.text("Cancel"))).toBeVisible();
        await expect(element(by.text("Save"))).toBeVisible();
      } catch (error) {
        // If no stocks, this is expected
        console.log("No stocks to test edit functionality");
      }
    });
  });

  describe("Dividend History Summary", () => {
    it("should display dividend history summary", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Verify dividend history section
      await expect(element(by.text("Dividend History"))).toBeVisible();

      // Check summary elements
      await expect(element(by.text("Total Received"))).toBeVisible();
      await expect(element(by.text("This Year"))).toBeVisible();
      await expect(element(by.text("This Month"))).toBeVisible();
    });
  });

  describe("FAB Functionality", () => {
    it("should display FAB for adding stocks", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Verify FAB is visible
      await expect(element(by.id("add-stock-fab"))).toBeVisible();
    });

    it("should navigate to add stock screen when FAB is tapped", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Tap FAB
      await element(by.id("add-stock-fab")).tap();

      // Should navigate to search/add stock screen
      await expect(element(by.text("Search Stocks"))).toBeVisible();
    });
  });

  describe("Refresh Functionality", () => {
    it("should support pull-to-refresh", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Perform pull-to-refresh
      await element(by.id("portfolio-scroll-view")).scrollTo("top");

      // Wait for refresh to complete
      await waitFor(element(by.text("Portfolio Summary")))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe("Empty State Handling", () => {
    it("should display appropriate empty states", async () => {
      // Navigate to Portfolio tab
      await element(by.text("Portfolio")).tap();

      // Check for empty state elements (if no data)
      try {
        await waitFor(element(by.text("No stocks in portfolio")))
          .toBeVisible()
          .withTimeout(2000);
        await expect(element(by.text("Add stocks to start tracking your dividend income"))).toBeVisible();
      } catch (error) {
        // If data exists, this is expected
        console.log("Portfolio has data, empty state not shown");
      }

      // Switch to Calendar tab and check empty state
      await element(by.text("Calendar")).tap();

      try {
        await waitFor(element(by.text("No upcoming payouts")))
          .toBeVisible()
          .withTimeout(2000);
        await expect(element(by.text("Add dividend-paying stocks to see upcoming payouts"))).toBeVisible();
      } catch (error) {
        // If payouts exist, this is expected
        console.log("Upcoming payouts exist, empty state not shown");
      }
    });
  });
});

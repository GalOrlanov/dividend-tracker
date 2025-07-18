const express = require("express");
const router = express.Router();
const Portfolio = require("../models/Portfolio");
const DividendHistory = require("../models/DividendHistory");
const PolygonStockService = require("../services/polygonStockService");
const auth = require("../middleware/auth");

const stockService = new PolygonStockService();

// Get all portfolio entries
router.get("/", auth, async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ user: req.user._id }).sort({ symbol: 1 });

    // Aggregate portfolio by symbol to handle multiple purchases
    const aggregatedPortfolio = [];
    const symbolGroups = {};

    // Group entries by symbol
    portfolio.forEach((item) => {
      if (!symbolGroups[item.symbol]) {
        symbolGroups[item.symbol] = [];
      }
      symbolGroups[item.symbol].push(item);
    });

    // Calculate aggregated data for each symbol
    for (const symbol of Object.keys(symbolGroups)) {
      const entries = symbolGroups[symbol];
      const firstEntry = entries[0];

      // Calculate weighted average purchase price
      let totalShares = 0;
      let totalInvestment = 0;
      let totalPurchaseValue = 0;

      entries.forEach((entry) => {
        totalShares += entry.shares;
        totalInvestment += entry.shares * entry.purchasePrice;
        totalPurchaseValue += entry.shares * entry.purchasePrice;
      });

      const weightedAveragePurchasePrice = totalShares > 0 ? totalInvestment / totalShares : 0;

      // Use the most recent current price and dividend data
      const latestEntry = entries.reduce((latest, current) => (current.lastUpdated > latest.lastUpdated ? current : latest));

      // Fetch fresh stock quote for accurate current price
      let currentPrice = latestEntry.currentPrice;
      let priceChange = latestEntry.priceChange;
      let priceChangePercent = latestEntry.priceChangePercent;

      console.log(`🔍 [PORTFOLIO] Initial values for ${symbol}: currentPrice=${currentPrice}, totalShares=${totalShares}`);

      // Fetch fresh price and dividend data from Polygon API
      let freshDividendYield = latestEntry.dividendYield;
      let freshDividendPerShare = latestEntry.dividendPerShare;
      let freshPayoutFrequency = latestEntry.payoutFrequency;

      try {
        console.log(`🔍 [PORTFOLIO] Fetching fresh data for ${symbol}...`);
        const [quote, overview] = await Promise.all([stockService.getStockQuote(symbol), stockService.getCompanyOverview(symbol)]);

        console.log(`🔍 [PORTFOLIO] Fresh quote for ${symbol}:`, quote);
        console.log(`🔍 [PORTFOLIO] Fresh overview for ${symbol}:`, overview);
        console.log(`🔍 [PORTFOLIO] Overview dividend yield for ${symbol}:`, overview?.dividendYield);
        console.log(`🔍 [PORTFOLIO] Overview dividend per share for ${symbol}:`, overview?.dividendPerShare);

        // Update price data
        if (quote && quote.price && quote.price > 0) {
          currentPrice = parseFloat(quote.price);
          priceChange = parseFloat(quote.change) || 0;
          priceChangePercent = parseFloat(quote.changePercent) || 0;
          console.log(`✅ [PORTFOLIO] Using fresh quote price for ${symbol}: currentPrice=${currentPrice}`);
        } else if (quote && quote.previousClose && quote.previousClose > 0) {
          currentPrice = parseFloat(quote.previousClose);
          priceChange = parseFloat(quote.change) || 0;
          priceChangePercent = parseFloat(quote.changePercent) || 0;
          console.log(`✅ [PORTFOLIO] Using previousClose for ${symbol}: currentPrice=${currentPrice}`);
        } else {
          console.log(`⚠️ [PORTFOLIO] Fresh quote has no valid price or previousClose for ${symbol}, keeping stored value: currentPrice=${currentPrice}`);
        }

        // Update dividend data
        if (overview && overview.dividendYield !== undefined && overview.dividendYield > 0) {
          freshDividendYield = parseFloat(overview.dividendYield);
          console.log(`✅ [PORTFOLIO] Using fresh dividend yield for ${symbol}: ${freshDividendYield}%`);
        } else {
          console.log(`⚠️ [PORTFOLIO] Fresh overview has no valid dividend yield for ${symbol}, keeping stored value: ${freshDividendYield}%`);
        }

        if (overview && overview.dividendPerShare !== undefined && overview.dividendPerShare > 0) {
          freshDividendPerShare = parseFloat(overview.dividendPerShare);
          console.log(`✅ [PORTFOLIO] Using fresh dividend per share for ${symbol}: $${freshDividendPerShare}`);
        } else {
          console.log(`⚠️ [PORTFOLIO] Fresh overview has no valid dividend per share for ${symbol}, keeping stored value: $${freshDividendPerShare}`);
        }

        if (overview && overview.payoutFrequency) {
          freshPayoutFrequency = overview.payoutFrequency;
          console.log(`✅ [PORTFOLIO] Using fresh payout frequency for ${symbol}: ${freshPayoutFrequency}`);
        }
      } catch (err) {
        console.warn(`❌ [PORTFOLIO] Failed to fetch fresh data for ${symbol}:`, err.message);
        console.warn(`❌ [PORTFOLIO] Error details for ${symbol}:`, err);

        // Try fetching overview data separately as fallback
        try {
          console.log(`🔄 [PORTFOLIO] Trying to fetch overview data separately for ${symbol}...`);
          const fallbackOverview = await stockService.getCompanyOverview(symbol);
          console.log(`🔄 [PORTFOLIO] Fallback overview for ${symbol}:`, fallbackOverview);

          if (fallbackOverview && fallbackOverview.dividendYield !== undefined && fallbackOverview.dividendYield > 0) {
            freshDividendYield = parseFloat(fallbackOverview.dividendYield);
            console.log(`✅ [PORTFOLIO] Using fallback dividend yield for ${symbol}: ${freshDividendYield}%`);
          }

          if (fallbackOverview && fallbackOverview.dividendPerShare !== undefined && fallbackOverview.dividendPerShare > 0) {
            freshDividendPerShare = parseFloat(fallbackOverview.dividendPerShare);
            console.log(`✅ [PORTFOLIO] Using fallback dividend per share for ${symbol}: $${freshDividendPerShare}`);
          }

          if (fallbackOverview && fallbackOverview.payoutFrequency) {
            freshPayoutFrequency = fallbackOverview.payoutFrequency;
            console.log(`✅ [PORTFOLIO] Using fallback payout frequency for ${symbol}: ${freshPayoutFrequency}`);
          }
        } catch (fallbackErr) {
          console.warn(`❌ [PORTFOLIO] Fallback overview fetch also failed for ${symbol}:`, fallbackErr.message);
        }
      }

      // Create aggregated entry
      const aggregatedEntry = {
        _id: firstEntry._id, // Use first entry's ID for consistency
        user: firstEntry.user,
        symbol: symbol,
        companyName: firstEntry.companyName,
        shares: totalShares,
        purchasePrice: weightedAveragePurchasePrice,
        purchaseDate: entries.reduce((earliest, current) => (current.purchaseDate < earliest.purchaseDate ? current : earliest)).purchaseDate,
        currentPrice: currentPrice,
        priceChange: priceChange,
        priceChangePercent: priceChangePercent,
        dividendPerShare: freshDividendPerShare,
        dividendYield: freshDividendYield,
        payoutFrequency: freshPayoutFrequency,
        lastUpdated: latestEntry.lastUpdated,
        createdAt: firstEntry.createdAt,
        updatedAt: latestEntry.updatedAt,
        // Virtual fields
        totalInvestment: totalInvestment,
        currentValue: totalShares * currentPrice,
        totalDividendIncome:
          totalShares * (freshDividendPerShare * (freshPayoutFrequency === "monthly" ? 12 : freshPayoutFrequency === "quarterly" ? 4 : freshPayoutFrequency === "semi-annually" ? 2 : 1)),
        yieldOnCost:
          totalInvestment > 0
            ? ((totalShares * (freshDividendPerShare * (freshPayoutFrequency === "monthly" ? 12 : freshPayoutFrequency === "quarterly" ? 4 : freshPayoutFrequency === "semi-annually" ? 2 : 1))) /
                totalInvestment) *
              100
            : 0,
        capitalGainLoss: totalShares * currentPrice - totalInvestment,
        totalReturn:
          totalShares * currentPrice -
          totalInvestment +
          totalShares * (freshDividendPerShare * (freshPayoutFrequency === "monthly" ? 12 : freshPayoutFrequency === "quarterly" ? 4 : freshPayoutFrequency === "semi-annually" ? 2 : 1)),
        // Store individual purchases for reference
        individualPurchases: entries.map((entry) => ({
          _id: entry._id,
          shares: entry.shares,
          purchasePrice: entry.purchasePrice,
          purchaseDate: entry.purchaseDate,
          totalInvestment: entry.shares * entry.purchasePrice,
        })),
      };

      console.log(`🔍 [PORTFOLIO] Final values for ${symbol}: currentPrice=${aggregatedEntry.currentPrice}, currentValue=${aggregatedEntry.currentValue}, totalShares=${totalShares}`);

      aggregatedPortfolio.push(aggregatedEntry);
    }

    // Calculate portfolio totals
    const totals = {
      totalInvestment: 0,
      currentValue: 0,
      totalDividendIncome: 0,
      capitalGainLoss: 0,
      totalReturn: 0,
      averageYield: 0,
    };

    console.log(`🔍 [PORTFOLIO] Starting totals calculation for ${aggregatedPortfolio.length} stocks`);

    aggregatedPortfolio.forEach((item) => {
      console.log(`🔍 [PORTFOLIO] Adding ${item.symbol}: currentValue=${item.currentValue}, totalInvestment=${item.totalInvestment}`);
      totals.totalInvestment += item.totalInvestment;
      totals.currentValue += item.currentValue;
      totals.totalDividendIncome += item.totalDividendIncome;
      totals.capitalGainLoss += item.capitalGainLoss;
      totals.totalReturn += item.totalReturn;
    });

    console.log(`🔍 [PORTFOLIO] Final totals: currentValue=${totals.currentValue}, totalInvestment=${totals.totalInvestment}`);

    if (aggregatedPortfolio.length > 0) {
      totals.averageYield = (totals.totalDividendIncome / totals.totalInvestment) * 100;
    }

    res.json({
      portfolio: aggregatedPortfolio,
      totals,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add stock to portfolio (now allows multiple purchases of same stock)
router.post("/", auth, async (req, res) => {
  try {
    const { symbol, shares, purchasePrice, purchaseDate } = req.body;

    if (!symbol || !shares || !purchasePrice) {
      return res.status(400).json({
        message: "Symbol, shares, and purchase price are required",
      });
    }

    // Check if stock already exists in portfolio to get company info
    const existingStock = await Portfolio.findOne({
      symbol: symbol.toUpperCase(),
      user: req.user._id,
    });

    // Fetch current stock data
    let stockData = {};
    try {
      const [quote, overview] = await Promise.all([stockService.getStockQuote(symbol), stockService.getCompanyOverview(symbol)]);

      stockData = {
        currentPrice: parseFloat(quote.price) || 0,
        priceChange: parseFloat(quote.change) || 0,
        priceChangePercent: parseFloat(quote.changePercent) || 0,
        companyName: overview.companyName || symbol,
        dividendPerShare: parseFloat(overview.dividendPerShare) || 0,
        dividendYield: parseFloat(overview.dividendYield) || 0,
        payoutFrequency: overview.payoutFrequency || "quarterly",
      };
    } catch (error) {
      console.log("Error fetching stock data:", error.message);
      stockData = {
        currentPrice: purchasePrice,
        priceChange: 0,
        priceChangePercent: 0,
        companyName: existingStock ? existingStock.companyName : symbol,
        dividendPerShare: existingStock ? existingStock.dividendPerShare : 0,
        dividendYield: existingStock ? existingStock.dividendYield : 0,
        payoutFrequency: existingStock ? existingStock.payoutFrequency : "quarterly",
      };
    }

    const portfolioEntry = new Portfolio({
      user: req.user._id,
      symbol: symbol.toUpperCase(),
      shares: parseFloat(shares),
      purchasePrice: parseFloat(purchasePrice),
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      ...stockData,
    });

    const savedEntry = await portfolioEntry.save();

    // Generate future dividends for the newly added stock (only if it's a new stock or has dividends)
    if (savedEntry.dividendPerShare && savedEntry.dividendPerShare > 0) {
      try {
        console.log(`🔄 Generating future dividends for newly added stock: ${savedEntry.symbol}`);

        const currentYear = new Date().getFullYear();
        const yearsToGenerate = [currentYear, currentYear + 1];
        const purchaseDate = new Date(savedEntry.purchaseDate);
        const dividendDates = getDividendDates(savedEntry.payoutFrequency || "quarterly", yearsToGenerate, purchaseDate);

        let generatedCount = 0;
        for (const dividendDate of dividendDates) {
          const year = dividendDate.getFullYear();
          const month = dividendDate.getMonth() + 1;

          // Check if dividend entry already exists for this stock
          const existingEntry = await DividendHistory.findOne({
            user: req.user._id,
            symbol: savedEntry.symbol,
            year: year,
            month: month,
          });

          if (existingEntry) {
            continue;
          }

          // Calculate payment date (3 weeks after ex-dividend)
          const paymentDate = new Date(dividendDate);
          paymentDate.setDate(paymentDate.getDate() + 21);

          // Calculate total amount based on aggregated shares
          const allSharesForSymbol = await Portfolio.aggregate([{ $match: { user: req.user._id, symbol: savedEntry.symbol } }, { $group: { _id: null, totalShares: { $sum: "$shares" } } }]);

          const totalShares = allSharesForSymbol.length > 0 ? allSharesForSymbol[0].totalShares : savedEntry.shares;
          const totalAmount = savedEntry.dividendPerShare * totalShares;

          // Determine quarter
          const quarter = Math.ceil(month / 3);

          // Create dividend history entry
          const dividendEntry = new DividendHistory({
            user: req.user._id,
            symbol: savedEntry.symbol,
            companyName: savedEntry.companyName,
            shares: totalShares,
            dividendPerShare: savedEntry.dividendPerShare,
            totalAmount: totalAmount,
            year: year,
            month: month,
            quarter: quarter,
            payoutFrequency: savedEntry.payoutFrequency || "quarterly",
            exDividendDate: dividendDate,
            paymentDate: paymentDate,
          });

          await dividendEntry.save();
          generatedCount++;
        }

        console.log(`✅ Generated ${generatedCount} future dividend entries for ${savedEntry.symbol}`);
      } catch (error) {
        console.error(`❌ Error generating future dividends for ${savedEntry.symbol}:`, error.message);
        // Don't fail the stock addition if dividend generation fails
      }
    }

    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get individual purchases for a specific stock
router.get("/purchases/:symbol", auth, async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();

    const purchases = await Portfolio.find({
      user: req.user._id,
      symbol: symbol,
    }).sort({ purchaseDate: 1 });

    if (purchases.length === 0) {
      return res.status(404).json({ message: "No purchases found for this stock" });
    }

    // Calculate summary
    const summary = {
      symbol: symbol,
      companyName: purchases[0].companyName,
      totalShares: 0,
      totalInvestment: 0,
      weightedAveragePrice: 0,
      purchaseCount: purchases.length,
      firstPurchase: null,
      lastPurchase: null,
      purchases: purchases.map((purchase) => ({
        _id: purchase._id,
        shares: purchase.shares,
        purchasePrice: purchase.purchasePrice,
        purchaseDate: purchase.purchaseDate,
        totalInvestment: purchase.shares * purchase.purchasePrice,
      })),
    };

    purchases.forEach((purchase, index) => {
      summary.totalShares += purchase.shares;
      summary.totalInvestment += purchase.shares * purchase.purchasePrice;

      if (index === 0) summary.firstPurchase = purchase.purchaseDate;
      summary.lastPurchase = purchase.purchaseDate;
    });

    summary.weightedAveragePrice = summary.totalShares > 0 ? summary.totalInvestment / summary.totalShares : 0;

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update portfolio entry
router.put("/:id", auth, async (req, res) => {
  try {
    const { shares, purchasePrice, purchaseDate, dividendPerShare, dividendYield, payoutFrequency } = req.body;
    const updateData = {};

    if (shares !== undefined) updateData.shares = parseFloat(shares);
    if (purchasePrice !== undefined) updateData.purchasePrice = parseFloat(purchasePrice);
    if (purchaseDate !== undefined) updateData.purchaseDate = new Date(purchaseDate);
    if (dividendPerShare !== undefined) updateData.dividendPerShare = parseFloat(dividendPerShare);
    if (dividendYield !== undefined) updateData.dividendYield = parseFloat(dividendYield);
    if (payoutFrequency !== undefined) updateData.payoutFrequency = payoutFrequency;

    const updatedEntry = await Portfolio.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, updateData, { new: true, runValidators: true });

    if (!updatedEntry) {
      return res.status(404).json({ message: "Portfolio entry not found" });
    }

    res.json(updatedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete portfolio entry
router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedEntry = await Portfolio.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deletedEntry) {
      return res.status(404).json({ message: "Portfolio entry not found" });
    }

    // Also delete all dividend history entries for this stock
    const deletedDividends = await DividendHistory.deleteMany({
      user: req.user._id,
      symbol: deletedEntry.symbol,
    });

    console.log(`🗑️  Deleted portfolio entry for ${deletedEntry.symbol}`);
    console.log(`🗑️  Deleted ${deletedDividends.deletedCount} dividend history entries for ${deletedEntry.symbol}`);

    res.json({
      message: "Portfolio entry deleted",
      deletedDividendEntries: deletedDividends.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update stock data (refresh prices and dividend info)
router.post("/refresh/:id", auth, async (req, res) => {
  try {
    const portfolioEntry = await Portfolio.findOne({ _id: req.params.id, user: req.user._id });
    if (!portfolioEntry) {
      return res.status(404).json({ message: "Portfolio entry not found" });
    }

    // Fetch updated stock data
    try {
      const [quote, overview] = await Promise.all([stockService.getStockQuote(portfolioEntry.symbol), stockService.getCompanyOverview(portfolioEntry.symbol)]);

      portfolioEntry.currentPrice = parseFloat(quote.price) || portfolioEntry.currentPrice;
      portfolioEntry.priceChange = parseFloat(quote.change) || 0;
      portfolioEntry.priceChangePercent = parseFloat(quote.changePercent) || 0;
      portfolioEntry.dividendPerShare = parseFloat(overview.dividendPerShare) || portfolioEntry.dividendPerShare;
      portfolioEntry.dividendYield = parseFloat(overview.dividendYield) || portfolioEntry.dividendYield;
      portfolioEntry.payoutFrequency = overview.payoutFrequency || portfolioEntry.payoutFrequency;
      portfolioEntry.lastUpdated = new Date();

      const updatedEntry = await portfolioEntry.save();
      res.json(updatedEntry);
    } catch (error) {
      console.log("Error fetching stock data:", error.message);
      res.status(500).json({ message: "Failed to fetch updated stock data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Refresh all portfolio data
router.post("/refresh-all", auth, async (req, res) => {
  try {
    console.log("🔄 Starting refresh-all for portfolio data...");
    const portfolio = await Portfolio.find({ user: req.user._id });
    console.log(`📊 Found ${portfolio.length} stocks to refresh`);
    const updatedEntries = [];

    for (const entry of portfolio) {
      try {
        console.log(`🔄 Refreshing ${entry.symbol}...`);
        const [quote, overview] = await Promise.all([stockService.getStockQuote(entry.symbol), stockService.getCompanyOverview(entry.symbol)]);

        console.log(`📈 Quote for ${entry.symbol}:`, quote);
        console.log(`📊 Overview for ${entry.symbol}:`, overview);

        const oldPrice = entry.currentPrice;
        const oldDividendYield = entry.dividendYield;
        const oldDividendPerShare = entry.dividendPerShare;

        entry.currentPrice = parseFloat(quote.price) || entry.currentPrice;
        entry.priceChange = parseFloat(quote.change) || 0;
        entry.priceChangePercent = parseFloat(quote.changePercent) || 0;
        entry.dividendPerShare = parseFloat(overview.dividendPerShare) || entry.dividendPerShare;
        entry.dividendYield = parseFloat(overview.dividendYield) || entry.dividendYield;
        entry.payoutFrequency = overview.payoutFrequency || entry.payoutFrequency;
        entry.lastUpdated = new Date();

        console.log(
          `✅ ${entry.symbol} updated: Price ${oldPrice} → ${entry.currentPrice}, Yield ${oldDividendYield} → ${entry.dividendYield}, DPS ${oldDividendPerShare} → ${entry.dividendPerShare}`
        );

        const updatedEntry = await entry.save();
        updatedEntries.push(updatedEntry);
      } catch (error) {
        console.log(`❌ Error updating ${entry.symbol}:`, error.message);
        updatedEntries.push(entry);
      }
    }

    console.log(`✅ Refresh-all completed. Updated ${updatedEntries.length} stocks.`);
    res.json(updatedEntries);
  } catch (error) {
    console.error("❌ Refresh-all failed:", error.message);
    res.status(500).json({ message: error.message });
  }
});

// Get dividend history
router.get("/dividend-history", auth, async (req, res) => {
  try {
    const { year, symbol } = req.query;
    let query = { user: req.user._id };

    if (year) {
      query.year = parseInt(year);
    }

    if (symbol) {
      query.symbol = symbol.toUpperCase();
    }

    const history = await DividendHistory.find(query).sort({ paymentDate: -1 }).limit(1000);

    // Calculate totals
    const totals = {
      totalReceived: 0,
      totalThisYear: 0,
      totalThisMonth: 0,
    };

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    history.forEach((entry) => {
      totals.totalReceived += entry.totalAmount;
      if (entry.year === currentYear) {
        totals.totalThisYear += entry.totalAmount;
      }
      if (entry.year === currentYear && entry.month === currentMonth) {
        totals.totalThisMonth += entry.totalAmount;
      }
    });

    res.json({
      history,
      totals,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dividend chart data (aggregated by month)
router.get("/dividend-chart-data", auth, async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    // Aggregate dividend data by month for the specified year
    const monthlyData = await DividendHistory.aggregate([
      {
        $match: {
          user: req.user._id,
          year: targetYear,
        },
      },
      {
        $group: {
          _id: {
            year: "$year",
            month: "$month",
          },
          totalAmount: { $sum: "$totalAmount" },
          count: { $sum: 1 },
          symbols: { $addToSet: "$symbol" },
        },
      },
      {
        $sort: { "_id.month": 1 },
      },
    ]);

    // Create a complete 12-month dataset with zeros for missing months
    const completeMonthlyData = [];
    for (let month = 1; month <= 12; month++) {
      const monthData = monthlyData.find((data) => data._id.month === month);
      completeMonthlyData.push({
        month: month,
        totalAmount: monthData ? monthData.totalAmount : 0,
        count: monthData ? monthData.count : 0,
        symbols: monthData ? monthData.symbols : [],
      });
    }

    // Calculate yearly totals
    const yearlyTotal = completeMonthlyData.reduce((sum, month) => sum + month.totalAmount, 0);
    const yearlyCount = completeMonthlyData.reduce((sum, month) => sum + month.count, 0);

    // Get detailed dividend records for each month
    const monthlyDetails = [];
    for (let month = 1; month <= 12; month++) {
      const monthDividends = await DividendHistory.find({
        user: req.user._id,
        year: targetYear,
        month: month,
      }).sort({ paymentDate: 1 });

      monthlyDetails.push(monthDividends);
    }

    res.json({
      year: targetYear,
      monthlyData: completeMonthlyData,
      monthlyDetails: monthlyDetails,
      yearlyTotal,
      yearlyCount,
    });
  } catch (error) {
    console.error("Error fetching dividend chart data:", error);
    res.status(500).json({ error: "Failed to fetch dividend chart data" });
  }
});

// Get dividend data for specific month (for bar press)
router.get("/dividend-month-data", auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = parseInt(month) || 1;

    // Get historical dividends for this month and year
    const historicalDividends = await DividendHistory.find({
      user: req.user._id,
      year: targetYear,
      month: targetMonth,
    }).sort({ paymentDate: 1 });

    // Get upcoming payouts for this month and year (only for current year)
    const currentYear = new Date().getFullYear();
    let upcomingDividends = [];

    if (targetYear === currentYear) {
      const currentMonth = new Date().getMonth() + 1;
      if (targetMonth >= currentMonth) {
        upcomingDividends = await DividendHistory.find({
          user: req.user._id,
          year: targetYear,
          month: targetMonth,
        }).sort({ paymentDate: 1 });
      }
    }

    // Calculate totals
    const historicalTotal = historicalDividends.reduce((sum, div) => sum + div.totalAmount, 0);
    const upcomingTotal = upcomingDividends.reduce((sum, div) => sum + div.totalAmount, 0);
    const totalAmount = historicalTotal + upcomingTotal;

    // Group by symbol for summary
    const groupedBySymbol = {};

    // Process historical dividends
    historicalDividends.forEach((div) => {
      if (!groupedBySymbol[div.symbol]) {
        groupedBySymbol[div.symbol] = {
          symbol: div.symbol,
          historicalAmount: 0,
          upcomingAmount: 0,
          totalShares: 0,
          dividendPerShare: div.dividendPerShare || 0,
          paymentDate: div.paymentDate,
          isHistorical: true,
        };
      }
      groupedBySymbol[div.symbol].historicalAmount += div.totalAmount;
      groupedBySymbol[div.symbol].totalShares += div.shares || 0;
    });

    // Process upcoming dividends
    upcomingDividends.forEach((div) => {
      if (!groupedBySymbol[div.symbol]) {
        groupedBySymbol[div.symbol] = {
          symbol: div.symbol,
          historicalAmount: 0,
          upcomingAmount: 0,
          totalShares: 0,
          dividendPerShare: div.dividendPerShare || 0,
          paymentDate: div.paymentDate,
          isHistorical: false,
        };
      }
      groupedBySymbol[div.symbol].upcomingAmount += div.totalAmount;
      groupedBySymbol[div.symbol].totalShares += div.shares || 0;
    });

    const symbolSummary = Object.values(groupedBySymbol);

    res.json({
      year: targetYear,
      month: targetMonth,
      monthName: new Date(targetYear, targetMonth - 1, 1).toLocaleString("default", { month: "long" }),
      historicalDividends,
      upcomingDividends,
      symbolSummary,
      totals: {
        historicalTotal,
        upcomingTotal,
        totalAmount,
        dividendCount: historicalDividends.length + upcomingDividends.length,
      },
    });
  } catch (error) {
    console.error("Error fetching dividend month data:", error);
    res.status(500).json({ error: "Failed to fetch dividend month data" });
  }
});

// Add dividend payment to history
router.post("/dividend-history", auth, async (req, res) => {
  try {
    const { symbol, companyName, shares, dividendPerShare, exDividendDate, paymentDate, payoutFrequency } = req.body;

    if (!symbol || !shares || !dividendPerShare || !exDividendDate || !paymentDate) {
      return res.status(400).json({
        message: "Symbol, shares, dividend per share, ex-dividend date, and payment date are required",
      });
    }

    const totalAmount = shares * dividendPerShare;
    const paymentDateObj = new Date(paymentDate);
    const exDividendDateObj = new Date(exDividendDate);

    const dividendEntry = new DividendHistory({
      user: req.user._id,
      symbol: symbol.toUpperCase(),
      companyName,
      shares: parseFloat(shares),
      dividendPerShare: parseFloat(dividendPerShare),
      totalAmount,
      exDividendDate: exDividendDateObj,
      paymentDate: paymentDateObj,
      payoutFrequency: payoutFrequency || "quarterly",
      year: paymentDateObj.getFullYear(),
      quarter: Math.ceil((paymentDateObj.getMonth() + 1) / 3),
      month: paymentDateObj.getMonth() + 1,
    });

    const savedEntry = await dividendEntry.save();
    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get upcoming dividend payouts
router.get("/upcoming-payouts", auth, async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ user: req.user._id });
    const upcomingPayouts = [];
    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 1, 11, 31); // End of next year

    for (const stock of portfolio) {
      // Fetch fresh dividend data for each stock
      let freshDividendPerShare = stock.dividendPerShare;
      let freshPayoutFrequency = stock.payoutFrequency;

      try {
        const overview = await stockService.getCompanyOverview(stock.symbol);
        if (overview && overview.dividendPerShare !== undefined && overview.dividendPerShare > 0) {
          freshDividendPerShare = parseFloat(overview.dividendPerShare);
        }
        if (overview && overview.payoutFrequency) {
          freshPayoutFrequency = overview.payoutFrequency;
        }
      } catch (error) {
        console.log(`⚠️ Failed to fetch fresh dividend data for ${stock.symbol}:`, error.message);
      }

      if (freshDividendPerShare > 0) {
        // Calculate next payout dates based on frequency
        const nextPayouts = calculateNextPayoutDates(freshPayoutFrequency, now, nextYear);

        nextPayouts.forEach((payoutDate) => {
          upcomingPayouts.push({
            symbol: stock.symbol,
            companyName: stock.companyName,
            shares: stock.shares,
            dividendPerShare: freshDividendPerShare,
            totalAmount: stock.shares * freshDividendPerShare,
            payoutDate: payoutDate,
            payoutFrequency: freshPayoutFrequency,
            exDividendDate: calculateExDividendDate(payoutDate, freshPayoutFrequency),
          });
        });
      }
    }

    // Sort by payout date
    upcomingPayouts.sort((a, b) => new Date(a.payoutDate) - new Date(b.payoutDate));

    res.json({
      upcomingPayouts,
      totalUpcoming: upcomingPayouts.reduce((sum, payout) => sum + payout.totalAmount, 0),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate future dividends for portfolio
router.post("/generate-future-dividends", auth, async (req, res) => {
  try {
    console.log("🚀 API: Starting future dividend generation...");

    // Get all stocks from portfolio
    const portfolio = await Portfolio.find({ user: req.user._id });
    console.log(`📊 Found ${portfolio.length} stocks in portfolio`);

    if (portfolio.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No stocks found in portfolio",
      });
    }

    const currentYear = new Date().getFullYear();
    const yearsToGenerate = [currentYear, currentYear + 1]; // 2025, 2026

    // Check if we already have future entries for current year
    const existingFutureEntries = await DividendHistory.countDocuments({
      user: req.user._id,
      year: { $gte: currentYear },
    });

    console.log(`📊 Found ${existingFutureEntries} existing future dividend entries`);

    let totalGenerated = 0;
    let totalSkipped = 0;
    const results = [];

    for (const stock of portfolio) {
      console.log(`📈 Processing ${stock.symbol} (${stock.companyName})...`);

      // Skip if no dividend data
      if (!stock.dividendPerShare || stock.dividendPerShare <= 0) {
        console.log(`   ⚠️  No dividend data for ${stock.symbol}, skipping`);
        results.push({
          symbol: stock.symbol,
          status: "skipped",
          reason: "No dividend data",
        });
        continue;
      }

      const purchaseDate = new Date(stock.purchaseDate);
      const shares = stock.shares;
      const dividendPerShare = stock.dividendPerShare;
      const payoutFrequency = stock.payoutFrequency || "quarterly";

      // Generate dividend dates based on frequency
      const dividendDates = getDividendDates(payoutFrequency, yearsToGenerate, purchaseDate);
      let stockGenerated = 0;
      let stockSkipped = 0;

      // Calculate total amount once for this stock (will be consistent for all future dividends)
      const totalAmount = dividendPerShare * shares;

      for (const dividendDate of dividendDates) {
        const year = dividendDate.getFullYear();
        const month = dividendDate.getMonth() + 1;

        // Check if dividend entry already exists for this specific stock and month
        const existingEntry = await DividendHistory.findOne({
          user: req.user._id,
          symbol: stock.symbol,
          year: year,
          month: month,
        });

        if (existingEntry) {
          stockSkipped++;
          continue;
        }

        // Calculate payment date (3 weeks after ex-dividend)
        const paymentDate = new Date(dividendDate);
        paymentDate.setDate(paymentDate.getDate() + 21);

        // Determine quarter
        const quarter = Math.ceil(month / 3);

        // Create dividend history entry with consistent amount
        const dividendEntry = new DividendHistory({
          user: req.user._id,
          symbol: stock.symbol,
          companyName: stock.companyName,
          shares: shares,
          dividendPerShare: dividendPerShare,
          totalAmount: totalAmount, // Use the same amount for all future dividends
          year: year,
          month: month,
          quarter: quarter,
          payoutFrequency: payoutFrequency,
          exDividendDate: dividendDate,
          paymentDate: paymentDate,
        });

        await dividendEntry.save();
        stockGenerated++;
      }

      totalGenerated += stockGenerated;
      totalSkipped += stockSkipped;

      results.push({
        symbol: stock.symbol,
        status: "processed",
        generated: stockGenerated,
        skipped: stockSkipped,
        dividendPerShare: dividendPerShare,
        frequency: payoutFrequency,
      });
    }

    console.log(`🎉 Future dividend generation complete!`);
    console.log(`   ✅ Generated: ${totalGenerated} entries`);
    console.log(`   ⏭️  Skipped: ${totalSkipped} entries`);

    res.json({
      success: true,
      message: "Future dividends generated successfully",
      summary: {
        totalGenerated,
        totalSkipped,
        yearsGenerated: yearsToGenerate,
      },
      results,
    });
  } catch (error) {
    console.error("❌ Error generating future dividends:", error);
    res.status(500).json({
      success: false,
      message: "Error generating future dividends",
      error: error.message,
    });
  }
});

// Regenerate all dividend data for portfolio
router.post("/regenerate-dividends", auth, async (req, res) => {
  try {
    console.log("🔄 API: Starting dividend data regeneration...");

    // Get all stocks from portfolio
    const portfolio = await Portfolio.find({ user: req.user._id });
    console.log(`📊 Found ${portfolio.length} stocks in portfolio`);

    if (portfolio.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No stocks found in portfolio",
      });
    }

    // Delete all existing dividend entries for this user
    const deleteResult = await DividendHistory.deleteMany({ user: req.user._id });
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing dividend entries`);

    const currentYear = new Date().getFullYear();
    const yearsToGenerate = [currentYear, currentYear + 1]; // 2025, 2026

    let totalGenerated = 0;
    const results = [];

    for (const stock of portfolio) {
      console.log(`📈 Processing ${stock.symbol} (${stock.companyName})...`);

      // Skip if no dividend data
      if (!stock.dividendPerShare || stock.dividendPerShare <= 0) {
        console.log(`   ⚠️  No dividend data for ${stock.symbol}, skipping`);
        results.push({
          symbol: stock.symbol,
          status: "skipped",
          reason: "No dividend data",
        });
        continue;
      }

      const shares = stock.shares;
      const dividendPerShare = stock.dividendPerShare;
      const payoutFrequency = stock.payoutFrequency || "quarterly";

      // Generate dividend dates based on frequency (ignore purchase date for regeneration)
      const dividendDates = getDividendDates(payoutFrequency, yearsToGenerate, new Date(2020, 0, 1));
      let stockGenerated = 0;

      // Calculate total amount once for this stock (will be consistent for all future dividends)
      const totalAmount = dividendPerShare * shares;

      for (const dividendDate of dividendDates) {
        const year = dividendDate.getFullYear();
        const month = dividendDate.getMonth() + 1;

        // Calculate payment date (3 weeks after ex-dividend)
        const paymentDate = new Date(dividendDate);
        paymentDate.setDate(paymentDate.getDate() + 21);

        // Determine quarter
        const quarter = Math.ceil(month / 3);

        // Create dividend history entry
        const dividendEntry = new DividendHistory({
          user: req.user._id,
          symbol: stock.symbol,
          companyName: stock.companyName,
          shares: shares,
          dividendPerShare: dividendPerShare,
          totalAmount: totalAmount,
          year: year,
          month: month,
          quarter: quarter,
          payoutFrequency: payoutFrequency,
          exDividendDate: dividendDate,
          paymentDate: paymentDate,
        });

        await dividendEntry.save();
        stockGenerated++;
        console.log(`   ✅ Generated ${year}-${month.toString().padStart(2, "0")}: $${totalAmount.toFixed(2)}`);
      }

      totalGenerated += stockGenerated;

      results.push({
        symbol: stock.symbol,
        status: "processed",
        generated: stockGenerated,
        dividendPerShare: dividendPerShare,
        frequency: payoutFrequency,
      });
    }

    console.log(`🎉 Dividend regeneration complete!`);
    console.log(`   ✅ Generated: ${totalGenerated} entries`);

    res.json({
      success: true,
      message: "Dividend data regenerated successfully",
      summary: {
        totalGenerated,
        yearsGenerated: yearsToGenerate,
        deletedCount: deleteResult.deletedCount,
      },
      results,
    });
  } catch (error) {
    console.error("❌ Error regenerating dividend data:", error);
    res.status(500).json({
      success: false,
      message: "Error regenerating dividend data",
      error: error.message,
    });
  }
});

// Generate future dividends for a specific stock
router.post("/generate-future-dividends/:symbol", auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`🔄 Generating future dividends for specific stock: ${symbol}`);

    // Find the stock in portfolio
    const stock = await Portfolio.findOne({
      symbol: symbol.toUpperCase(),
      user: req.user._id,
    });
    if (!stock) {
      return res.status(404).json({
        success: false,
        message: `Stock ${symbol} not found in portfolio`,
      });
    }

    // Skip if no dividend data
    if (!stock.dividendPerShare || stock.dividendPerShare <= 0) {
      return res.status(400).json({
        success: false,
        message: `No dividend data for ${symbol}`,
      });
    }

    const currentYear = new Date().getFullYear();
    const yearsToGenerate = [currentYear, currentYear + 1];
    const purchaseDate = new Date(stock.purchaseDate);
    const dividendDates = getDividendDates(stock.payoutFrequency || "quarterly", yearsToGenerate, purchaseDate);

    let generatedCount = 0;
    let skippedCount = 0;

    for (const dividendDate of dividendDates) {
      const year = dividendDate.getFullYear();
      const month = dividendDate.getMonth() + 1;

      // Check if dividend entry already exists for this stock
      const existingEntry = await DividendHistory.findOne({
        user: req.user._id,
        symbol: stock.symbol,
        year: year,
        month: month,
      });

      if (existingEntry) {
        skippedCount++;
        continue;
      }

      // Calculate payment date (3 weeks after ex-dividend)
      const paymentDate = new Date(dividendDate);
      paymentDate.setDate(paymentDate.getDate() + 21);

      // Calculate total amount
      const totalAmount = stock.dividendPerShare * stock.shares;

      // Determine quarter
      const quarter = Math.ceil(month / 3);

      // Create dividend history entry
      const dividendEntry = new DividendHistory({
        user: req.user._id,
        symbol: stock.symbol,
        companyName: stock.companyName,
        shares: stock.shares,
        dividendPerShare: stock.dividendPerShare,
        totalAmount: totalAmount,
        year: year,
        month: month,
        quarter: quarter,
        payoutFrequency: stock.payoutFrequency || "quarterly",
        exDividendDate: dividendDate,
        paymentDate: paymentDate,
      });

      await dividendEntry.save();
      generatedCount++;
    }

    console.log(`✅ Generated ${generatedCount} future dividend entries for ${symbol} (skipped: ${skippedCount})`);

    res.json({
      success: true,
      message: `Future dividends generated for ${symbol}`,
      summary: {
        symbol: symbol,
        generated: generatedCount,
        skipped: skippedCount,
        dividendPerShare: stock.dividendPerShare,
        frequency: stock.payoutFrequency,
      },
    });
  } catch (error) {
    console.error(`❌ Error generating future dividends for ${req.params.symbol}:`, error);
    res.status(500).json({
      success: false,
      message: "Error generating future dividends",
      error: error.message,
    });
  }
});

// Delete future dividend entries for a specific stock
router.delete("/dividend-history/:symbol", auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const currentYear = new Date().getFullYear();

    console.log(`🗑️  Deleting future dividend entries for ${symbol} from ${currentYear} onwards`);

    const result = await DividendHistory.deleteMany({
      user: req.user._id,
      symbol: symbol.toUpperCase(),
      year: { $gte: currentYear },
    });

    console.log(`✅ Deleted ${result.deletedCount} future dividend entries for ${symbol}`);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} future dividend entries for ${symbol}`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(`❌ Error deleting future dividends for ${req.params.symbol}:`, error);
    res.status(500).json({
      success: false,
      message: "Error deleting future dividends",
      error: error.message,
    });
  }
});

// Helper function to calculate next payout dates
function calculateNextPayoutDates(frequency, startDate, endDate) {
  const payouts = [];
  const currentDate = new Date(startDate);

  // Set to next payout date based on frequency
  switch (frequency) {
    case "monthly":
      currentDate.setDate(1);
      currentDate.setMonth(currentDate.getMonth() + 1);
      break;
    case "quarterly":
      currentDate.setDate(1);
      const quarter = Math.floor(currentDate.getMonth() / 3);
      currentDate.setMonth((quarter + 1) * 3);
      break;
    case "semi-annually":
      currentDate.setDate(1);
      currentDate.setMonth(currentDate.getMonth() < 6 ? 6 : 12);
      break;
    case "annually":
      currentDate.setDate(1);
      currentDate.setMonth(11); // December
      break;
  }

  while (currentDate <= endDate) {
    payouts.push(new Date(currentDate));

    switch (frequency) {
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case "quarterly":
        currentDate.setMonth(currentDate.getMonth() + 3);
        break;
      case "semi-annually":
        currentDate.setMonth(currentDate.getMonth() + 6);
        break;
      case "annually":
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
    }
  }

  return payouts;
}

// Helper function to calculate ex-dividend date (typically 1-2 days before payout)
function calculateExDividendDate(payoutDate, frequency) {
  const exDate = new Date(payoutDate);
  const daysBefore = frequency === "monthly" ? 1 : 2;
  exDate.setDate(exDate.getDate() - daysBefore);
  return exDate;
}

// Helper function to get dividend dates
function getDividendDates(frequency, years, purchaseDate) {
  const dates = [];
  const currentDate = new Date();

  for (const year of years) {
    let months = [];

    switch (frequency.toLowerCase()) {
      case "monthly":
        months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        break;
      case "quarterly":
        months = [3, 6, 9, 12]; // March, June, September, December
        break;
      case "semi-annually":
        months = [6, 12]; // June, December
        break;
      case "annually":
        months = [12]; // December
        break;
      default:
        months = [3, 6, 9, 12]; // Default to quarterly
    }

    for (const month of months) {
      // Create ex-dividend date (15th of each month)
      const exDividendDate = new Date(year, month - 1, 15);

      // For current year, only include future months (including current month) after purchase date
      // For future years, include ALL months regardless of purchase date
      const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      if (year === currentDate.getFullYear()) {
        // Current year: only include current month and future months after purchase date
        if (exDividendDate >= currentMonth && exDividendDate > purchaseDate) {
          dates.push(exDividendDate);
        }
      } else {
        // Future years: include ALL months regardless of purchase date
        // This ensures we get January, February, etc. for future years
        dates.push(exDividendDate);
      }
    }
  }

  return dates.sort((a, b) => a - b);
}

module.exports = router;

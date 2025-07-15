const express = require("express");
const router = express.Router();
const HybridStockService = require("../services/hybridStockService");
const indicesService = require("../services/indicesService");
const stockDataService = new HybridStockService();

// Get real-time stock quote
router.get("/quote/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;

    // Check if it's an index symbol (starts with I: or ^)
    if (symbol.startsWith("I:") || symbol.startsWith("^")) {
      console.log(`📊 Getting index quote for: ${symbol}`);
      const quote = await indicesService.getIndexQuote(symbol);
      res.json(quote);
    } else {
      // Use existing stock service for regular symbols
      console.log(`📈 Getting stock quote for: ${symbol}`);
      const quote = await stockDataService.getStockQuote(symbol);
      res.json(quote);
    }
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Get company overview
router.get("/overview/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const overview = await stockDataService.getCompanyOverview(symbol);
    res.json(overview);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Search stocks
router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Search query is required" });
    }

    console.log(`🔍 Fast search for: ${q}`);
    const searchResults = await stockDataService.searchStocks(q);

    // Return basic search results immediately without fetching detailed data
    const basicResults = (searchResults.results || []).map((stock) => ({
      symbol: stock.symbol,
      companyName: stock.companyName,
      sector: stock.sector,
      type: stock.type,
      region: stock.region,
      currentPrice: stock.currentPrice || 0,
      dividendYield: stock.dividendYield || 0,
      dividendPerShare: stock.dividendPerShare || 0,
      payoutRatio: stock.payoutRatio || 0,
      frequency: stock.payoutFrequency || stock.frequency || "quarterly",
      exDividendDate: stock.exDividendDate || null,
      change: stock.change || 0,
      changePercent: stock.changePercent || 0,
    }));

    console.log(`✅ Fast search completed: ${basicResults.length} results`);
    res.json({
      count: basicResults.length,
      results: basicResults,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get detailed stock data for a specific symbol
router.get("/stock-details/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    if (!symbol) {
      return res.status(400).json({ error: "Stock symbol is required" });
    }

    console.log(`📊 Getting detailed data for: ${symbol}`);
    // Get detailed data for this specific stock using the new method
    const stockDetails = await stockDataService.getFullStockData(symbol);

    // Format the response for frontend compatibility
    const formattedDetails = {
      symbol: stockDetails.symbol,
      currentPrice: stockDetails.price && stockDetails.price > 0 ? stockDetails.price : stockDetails.previousClose > 0 ? stockDetails.previousClose : 0,
      dividendYield: stockDetails.dividendYield || 0,
      dividendPerShare: stockDetails.dividendPerShare || 0,
      payoutRatio: stockDetails.payoutRatio || 0,
      frequency: stockDetails.payoutFrequency || stockDetails.frequency || "quarterly",
      exDividendDate: stockDetails.exDividendDate || null,
      change: stockDetails.change || 0,
      changePercent: stockDetails.changePercent || 0,
      previousClose: stockDetails.previousClose || 0,
      open: stockDetails.open || 0,
      high: stockDetails.high || 0,
      low: stockDetails.low || 0,
      volume: stockDetails.volume || 0,
      isPreviousClose: (!stockDetails.price || stockDetails.price === 0) && stockDetails.previousClose > 0, // Flag to indicate if we're using previous close
      companyName: stockDetails.companyName || "Unknown Company",
      sector: stockDetails.sector || "Unknown Sector",
      industry: stockDetails.industry || "Unknown Industry",
      description: stockDetails.description || "No description available",
    };

    console.log(`✅ Detailed data retrieved for: ${symbol}`);
    res.json(formattedDetails);
  } catch (error) {
    console.error("Stock details error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get quick stock quote (faster than full details)
router.get("/quick-quote/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    if (!symbol) {
      return res.status(400).json({ error: "Stock symbol is required" });
    }

    console.log(`⚡ Getting quick quote for: ${symbol}`);
    const quote = await stockDataService.getStockQuote(symbol);

    console.log(`✅ Quick quote retrieved for: ${symbol}`);
    res.json(quote);
  } catch (error) {
    console.error("Quick quote error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get full stock data (quote + overview)
router.get("/stock/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const stockData = await stockDataService.getFullStockData(symbol);
    res.json(stockData);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Get dividend history for a stock
router.get("/dividend-history/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const dividendHistory = await stockDataService.getDividendHistory(symbol);
    res.json(dividendHistory);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Get historical price data for charts
router.get("/price-history/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = "1m" } = req.query;

    console.log(`📈 Getting price history for ${symbol} (${timeframe})`);
    const priceHistory = await stockDataService.getPriceHistory(symbol, timeframe);

    res.json(priceHistory);
  } catch (error) {
    console.error("Price history error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get full stock data (quote + overview + dividend history)
router.get("/full-stock-data/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const [quote, overview, dividendHistory] = await Promise.all([stockDataService.getStockQuote(symbol), stockDataService.getCompanyOverview(symbol), stockDataService.getDividendHistory(symbol)]);

    const fullData = {
      symbol: symbol,
      quote: quote,
      overview: overview,
      dividendHistory: dividendHistory,
    };

    res.json(fullData);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Get top gainers and losers
router.get("/top-movers", async (req, res) => {
  try {
    const movers = await stockDataService.getTopMovers();
    res.json(movers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dividend calendar
router.get("/dividend-calendar", async (req, res) => {
  try {
    const calendar = await stockDataService.getDividendCalendar();
    res.json(calendar);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get popular dividend stocks (predefined list)
router.get("/popular-dividends", async (req, res) => {
  try {
    const popularSymbols = ["AAPL", "MSFT", "JNJ", "PG", "KO", "PEP", "VZ", "T", "XOM", "CVX", "JPM", "BAC", "WMT", "HD", "MCD", "DIS"];

    const stocks = [];
    for (const symbol of popularSymbols.slice(0, 5)) {
      // Limit to 5 to avoid API rate limits
      try {
        const stockData = await stockDataService.getFullStockData(symbol);
        if (stockData.dividendYield > 0) {
          stocks.push(stockData);
        }
      } catch (error) {
        console.log(`Skipping ${symbol}: ${error.message}`);
      }
    }

    // Sort by dividend yield
    stocks.sort((a, b) => b.dividendYield - a.dividendYield);
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

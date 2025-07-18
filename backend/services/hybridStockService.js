// Hybrid Stock Service - Combines multiple APIs with fallback to mock data
const YahooFinanceScraper = require("./yahooFinanceScraper");
const FreeApiService = require("./freeApiService");
const PolygonStockService = require("./polygonStockService");

class HybridStockService {
  constructor() {
    this.yahooScraper = new YahooFinanceScraper();
    this.freeApiService = new FreeApiService();
    this.polygonService = new PolygonStockService();
    console.log("🚀 Stock API Configuration: Polygon primary, Yahoo Finance fallback (no mock data)");
  }

  async searchStocks(query) {
    // Use only Polygon for stock search
    return await this.polygonService.searchStocks(query);
  }

  async getStockQuote(symbol) {
    // Try Polygon first for reliable real-time data
    let quote = null;
    try {
      quote = await this.polygonService.getStockQuote(symbol);
      console.log(`📈 Polygon quote for ${symbol}:`, quote);
      // Accept Polygon quote only if price > 0
      if (quote && quote.price && quote.price > 0) {
        console.log(`✅ [BRANCH: POLYGON price] Using Polygon quote for ${symbol}`);
        return quote;
      } else if (quote && quote.previousClose && quote.previousClose > 0) {
        // If price is 0 but previousClose > 0, use previousClose as price
        console.log(`⚠️ [BRANCH: POLYGON previousClose] Polygon price is 0, using previousClose for ${symbol}`);
        return {
          ...quote,
          price: quote.previousClose,
        };
      } else {
        console.log(`⚠️ [BRANCH: POLYGON fallback] Polygon quote for ${symbol} has no valid price, trying fallback`);
      }
    } catch (err) {
      console.warn(`❌ [BRANCH: POLYGON error] Polygon quote failed for ${symbol}, trying Yahoo Finance:`, err.message);
    }
    // Fallback to Yahoo Finance
    try {
      quote = await this.yahooScraper.getStockQuote(symbol);
      if (quote && quote.price && quote.price > 0) {
        console.log(`✅ [BRANCH: YAHOO] Using Yahoo Finance quote for ${symbol}`);
        return quote;
      }
    } catch (err) {
      console.warn(`❌ [BRANCH: YAHOO error] Yahoo Finance quote failed for ${symbol}, trying free API:`, err.message);
    }
    // Fallback to free API
    try {
      quote = await this.freeApiService.getStockQuote(symbol);
      if (quote && quote.price && quote.price > 0) {
        console.log(`✅ [BRANCH: FREE API] Using Free API quote for ${symbol}`);
        return quote;
      }
    } catch (err) {
      console.warn(`❌ [BRANCH: FREE API error] Free API quote failed for ${symbol}:`, err.message);
    }
    // If all fail, return a default object
    console.log(`[BRANCH: DEFAULT] All APIs failed for ${symbol}, returning default`);
    return {
      symbol,
      price: 0,
      change: 0,
      changePercent: 0,
      previousClose: 0,
      open: 0,
      high: 0,
      low: 0,
      volume: 0,
      marketCap: 0,
    };
  }

  async getCompanyOverview(symbol) {
    try {
      // Try Polygon first for reliable dividend data
      return await this.polygonService.getCompanyOverview(symbol);
    } catch (err) {
      console.warn("Polygon overview failed, trying Yahoo Finance:", err.message);
      try {
        return await this.yahooScraper.getCompanyOverview(symbol);
      } catch (yahooErr) {
        console.warn("Yahoo Finance failed, using free APIs:", yahooErr.message);
        return await this.freeApiService.getCompanyOverview(symbol);
      }
    }
  }

  async getDividendHistory(symbol) {
    try {
      return await this.polygonService.getDividendHistory(symbol);
    } catch (err) {
      console.warn("Polygon dividend history failed, trying Yahoo Finance:", err.message);
      try {
        return await this.yahooScraper.getDividendHistory(symbol);
      } catch (yahooErr) {
        console.warn("Yahoo Finance failed, using free APIs:", yahooErr.message);
        return await this.freeApiService.getDividendHistory(symbol);
      }
    }
  }

  async getStockData(symbol) {
    try {
      return await this.polygonService.getStockData(symbol);
    } catch (err) {
      console.warn("Polygon stock data failed, trying Yahoo Finance:", err.message);
      try {
        return await this.yahooScraper.getStockData(symbol);
      } catch (yahooErr) {
        console.warn("Yahoo Finance failed, using free APIs:", yahooErr.message);
        return await this.freeApiService.getStockData(symbol);
      }
    }
  }

  async getFullStockData(symbol) {
    try {
      const [quote, overview] = await Promise.all([this.getStockQuote(symbol), this.getCompanyOverview(symbol)]);

      return {
        symbol: symbol,
        // Quote data
        price: quote?.price || 0,
        change: quote?.change || 0,
        changePercent: quote?.changePercent || 0,
        previousClose: quote?.previousClose || 0,
        open: quote?.open || 0,
        high: quote?.high || 0,
        low: quote?.low || 0,
        volume: quote?.volume || 0,
        marketCap: quote?.marketCap || 0,
        // Overview data
        companyName: overview?.companyName || "Unknown Company",
        sector: overview?.sector || "Unknown Sector",
        industry: overview?.industry || "Unknown Industry",
        description: overview?.description || "No description available",
        peRatio: overview?.peRatio || 0,
        dividendYield: overview?.dividendYield || 0,
        dividendPerShare: overview?.dividendPerShare || 0,
        payoutRatio: overview?.payoutRatio || 0,
        payoutFrequency: overview?.payoutFrequency || "quarterly",
        beta: overview?.beta || 0,
        website: overview?.website || "",
        employees: overview?.employees || 0,
      };
    } catch (error) {
      throw new Error(`Failed to get full stock data: ${error.message}`);
    }
  }

  async getPriceHistory(symbol, timeframe = "1m") {
    console.log(`🔍 HybridStockService: getPriceHistory called for ${symbol} with timeframe ${timeframe}`);

    try {
      // Try Polygon first for historical data
      console.log(`🔍 HybridStockService: Trying Polygon service for ${symbol} with timeframe ${timeframe}`);
      const result = await this.polygonService.getPriceHistory(symbol, timeframe);
      console.log(`✅ HybridStockService: Polygon service returned ${result.data?.length || 0} data points for ${symbol} with timeframe ${timeframe}`);
      return result;
    } catch (err) {
      console.warn(`❌ HybridStockService: Polygon price history failed for ${symbol} with timeframe ${timeframe}, trying Yahoo Finance:`, err.message);
      try {
        console.log(`🔍 HybridStockService: Trying Yahoo Finance for ${symbol} with timeframe ${timeframe}`);
        const result = await this.yahooScraper.getPriceHistory(symbol, timeframe);
        console.log(`✅ HybridStockService: Yahoo Finance returned ${result.data?.length || 0} data points for ${symbol} with timeframe ${timeframe}`);
        return result;
      } catch (yahooErr) {
        console.warn(`❌ HybridStockService: Yahoo Finance price history failed for ${symbol} with timeframe ${timeframe}, using free APIs:`, yahooErr.message);
        const result = await this.freeApiService.getPriceHistory(symbol, timeframe);
        console.log(`✅ HybridStockService: Free API returned ${result.data?.length || 0} data points for ${symbol} with timeframe ${timeframe}`);
        return result;
      }
    }
  }
}

module.exports = HybridStockService;

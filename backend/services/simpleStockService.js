const axios = require("axios");

class SimpleStockService {
  constructor() {
    // Use only reliable, free APIs
    this.iexApiKey = "Tpk_18dfe6cebb4f41ffb219b9680f9acaf2"; // Free demo key
    this.finnhubApiKey = "cn7v9tpr01qjq8v9tpr0"; // Your working Finnhub key
    console.log("🚀 Simple Stock Service: Using IEX and Finnhub APIs");
  }

  async searchStocks(query) {
    try {
      // Try IEX first (most reliable)
      const iexResults = await this.searchWithIEX(query);
      if (iexResults && iexResults.results && iexResults.results.length > 0) {
        return iexResults;
      }

      // Fallback to Finnhub
      const finnhubResults = await this.searchWithFinnhub(query);
      if (finnhubResults && finnhubResults.results && finnhubResults.results.length > 0) {
        return finnhubResults;
      }

      return { count: 0, results: [] };
    } catch (error) {
      console.error("Search failed:", error.message);
      return { count: 0, results: [] };
    }
  }

  async searchWithIEX(query) {
    try {
      const response = await axios.get(`https://cloud.iexapis.com/stable/search/${query}`, {
        params: { token: this.iexApiKey },
        timeout: 10000,
      });

      if (response.data && Array.isArray(response.data)) {
        const results = response.data.slice(0, 10).map((item) => ({
          symbol: item.symbol,
          companyName: item.securityName || item.name || "Unknown Company",
          sector: item.sector || "Unknown Sector",
          type: item.type || "Equity",
          region: item.region || "US",
          currentPrice: 0,
          dividendYield: 0,
          dividendPerShare: 0,
          payoutRatio: 0,
          frequency: "quarterly",
          exDividendDate: null,
        }));
        return { count: results.length, results };
      }
      return { count: 0, results: [] };
    } catch (error) {
      console.warn("IEX search failed:", error.message);
      return { count: 0, results: [] };
    }
  }

  async searchWithFinnhub(query) {
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/search`, {
        params: { q: query, token: this.finnhubApiKey },
        timeout: 10000,
      });

      if (response.data && response.data.result) {
        const results = response.data.result.slice(0, 10).map((item) => ({
          symbol: item.symbol,
          companyName: item.description || item.name || "Unknown Company",
          sector: item.finnhubIndustry || "Unknown Sector",
          type: item.type || "Equity",
          region: item.region || "US",
          currentPrice: 0,
          dividendYield: 0,
          dividendPerShare: 0,
          payoutRatio: 0,
          frequency: "quarterly",
          exDividendDate: null,
        }));
        return { count: results.length, results };
      }
      return { count: 0, results: [] };
    } catch (error) {
      console.warn("Finnhub search failed:", error.message);
      return { count: 0, results: [] };
    }
  }

  async getStockQuote(symbol) {
    try {
      // Try IEX first
      const iexQuote = await this.getQuoteWithIEX(symbol);
      if (iexQuote) {
        return iexQuote;
      }

      // Fallback to Finnhub
      const finnhubQuote = await this.getQuoteWithFinnhub(symbol);
      if (finnhubQuote) {
        return finnhubQuote;
      }

      // Return basic data if all APIs fail
      return {
        symbol: symbol,
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
    } catch (error) {
      console.error("Quote failed:", error.message);
      return {
        symbol: symbol,
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
  }

  async getQuoteWithIEX(symbol) {
    try {
      const response = await axios.get(`https://cloud.iexapis.com/stable/stock/${symbol}/quote`, {
        params: { token: this.iexApiKey },
        timeout: 10000,
      });

      if (response.data) {
        const q = response.data;
        return {
          symbol: q.symbol,
          price: q.latestPrice || 0,
          change: q.change || 0,
          changePercent: (q.changePercent || 0) * 100,
          previousClose: q.previousClose || 0,
          open: q.open || 0,
          high: q.high || 0,
          low: q.low || 0,
          volume: q.latestVolume || 0,
          marketCap: q.marketCap || 0,
        };
      }
      return null;
    } catch (error) {
      console.warn("IEX quote failed:", error.message);
      return null;
    }
  }

  async getQuoteWithFinnhub(symbol) {
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
        params: { symbol, token: this.finnhubApiKey },
        timeout: 10000,
      });

      if (response.data) {
        const q = response.data;
        return {
          symbol: symbol,
          price: q.c || 0,
          change: q.d || 0,
          changePercent: q.dp || 0,
          previousClose: q.pc || 0,
          high: q.h || 0,
          low: q.l || 0,
          open: q.o || 0,
          volume: 0,
          marketCap: 0,
        };
      }
      return null;
    } catch (error) {
      console.warn("Finnhub quote failed:", error.message);
      return null;
    }
  }

  async getCompanyOverview(symbol) {
    try {
      // Try IEX first
      const iexOverview = await this.getOverviewWithIEX(symbol);
      if (iexOverview) {
        return iexOverview;
      }

      // Fallback to Finnhub
      const finnhubOverview = await this.getOverviewWithFinnhub(symbol);
      if (finnhubOverview) {
        return finnhubOverview;
      }

      // Return basic data if all APIs fail
      return {
        symbol: symbol,
        companyName: "Unknown Company",
        sector: "Unknown Sector",
        industry: "Unknown Industry",
        description: "No description available",
        marketCap: 0,
        peRatio: 0,
        dividendYield: 0,
        dividendPerShare: 0,
        payoutRatio: 0,
        beta: 0,
        website: "",
        employees: 0,
      };
    } catch (error) {
      console.error("Overview failed:", error.message);
      return {
        symbol: symbol,
        companyName: "Unknown Company",
        sector: "Unknown Sector",
        industry: "Unknown Industry",
        description: "No description available",
        marketCap: 0,
        peRatio: 0,
        dividendYield: 0,
        dividendPerShare: 0,
        payoutRatio: 0,
        beta: 0,
        website: "",
        employees: 0,
      };
    }
  }

  async getOverviewWithIEX(symbol) {
    try {
      const response = await axios.get(`https://cloud.iexapis.com/stable/stock/${symbol}/company`, {
        params: { token: this.iexApiKey },
        timeout: 10000,
      });

      if (response.data) {
        const c = response.data;
        return {
          symbol: symbol,
          companyName: c.companyName || "Unknown Company",
          sector: c.sector || "Unknown Sector",
          industry: c.industry || "Unknown Industry",
          description: c.description || "No description available",
          marketCap: c.marketCap || 0,
          peRatio: 0,
          dividendYield: 0,
          dividendPerShare: 0,
          payoutRatio: 0,
          beta: 0,
          website: c.website || "",
          employees: c.employees || 0,
        };
      }
      return null;
    } catch (error) {
      console.warn("IEX overview failed:", error.message);
      return null;
    }
  }

  async getOverviewWithFinnhub(symbol) {
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/stock/profile2`, {
        params: { symbol, token: this.finnhubApiKey },
        timeout: 10000,
      });

      if (response.data) {
        const p = response.data;
        return {
          symbol: symbol,
          companyName: p.name || "Unknown Company",
          sector: p.finnhubIndustry || "Unknown Sector",
          industry: p.finnhubIndustry || "Unknown Industry",
          description: "No description available",
          marketCap: p.marketCapitalization || 0,
          peRatio: 0,
          dividendYield: 0,
          dividendPerShare: 0,
          payoutRatio: 0,
          beta: 0,
          website: p.weburl || "",
          employees: p.shareOutstanding || 0,
        };
      }
      return null;
    } catch (error) {
      console.warn("Finnhub overview failed:", error.message);
      return null;
    }
  }

  async getDividendHistory(symbol) {
    // For now, return empty dividend history since free APIs have limited dividend data
    return {
      symbol: symbol,
      dividends: [],
      totalDividends: 0,
      averageDividend: 0,
    };
  }

  async getStockData(symbol) {
    try {
      const [quote, overview] = await Promise.all([this.getStockQuote(symbol), this.getCompanyOverview(symbol)]);

      return {
        symbol: symbol,
        quote: quote,
        overview: overview,
        dividendHistory: await this.getDividendHistory(symbol),
      };
    } catch (error) {
      console.error("Stock data failed:", error.message);
      return {
        symbol: symbol,
        quote: {
          symbol: symbol,
          price: 0,
          change: 0,
          changePercent: 0,
          previousClose: 0,
          open: 0,
          high: 0,
          low: 0,
          volume: 0,
          marketCap: 0,
        },
        overview: {
          symbol: symbol,
          companyName: "Unknown Company",
          sector: "Unknown Sector",
          industry: "Unknown Industry",
          description: "No description available",
          marketCap: 0,
          peRatio: 0,
          dividendYield: 0,
          dividendPerShare: 0,
          payoutRatio: 0,
          beta: 0,
          website: "",
          employees: 0,
        },
        dividendHistory: {
          symbol: symbol,
          dividends: [],
          totalDividends: 0,
          averageDividend: 0,
        },
      };
    }
  }
}

module.exports = SimpleStockService;

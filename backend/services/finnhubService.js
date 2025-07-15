// Finnhub API Service - Free alternative to Alpha Vantage
const axios = require("axios");

class FinnhubService {
  constructor() {
    // Free API key - you can get your own at https://finnhub.io/
    this.apiKey = "cn7a9qpr01qjq8b9u8tgcn7a9qpr01qjq8b9u8t0";
    this.baseURL = "https://finnhub.io/api/v1";
    this.timeout = 10000;
  }

  // Search for stocks
  async searchStocks(keywords) {
    console.log("🔍 FinnhubService.searchStocks called with:", keywords);

    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          q: keywords,
          token: this.apiKey,
        },
        timeout: this.timeout,
      });

      console.log("📦 Finnhub search response:", {
        status: response.status,
        resultsCount: response.data?.result?.length || 0,
      });

      if (!response.data?.result) {
        console.log("❌ No results found in response");
        return [];
      }

      const formattedResults = response.data.result
        .filter((item) => (item.type === "Common Stock" && item.primaryExchange === "US NASDAQ") || item.primaryExchange === "US NYSE")
        .slice(0, 10)
        .map((item) => ({
          symbol: item.symbol,
          companyName: item.description,
          type: "Equity",
          region: "United States",
          marketOpen: "09:30",
          marketClose: "16:00",
          timezone: "UTC-04",
          currency: "USD",
          currentPrice: 0, // Will be fetched separately
          dividendYield: 0, // Will be fetched separately
          dividendPerShare: 0, // Will be fetched separately
          sector: "Unknown", // Will be fetched separately
          payoutRatio: 0,
          frequency: "Quarterly",
          exDividendDate: null,
        }));

      console.log("✅ Formatted search results:", formattedResults.length, "matches found");
      return formattedResults;
    } catch (error) {
      console.error("❌ Finnhub search error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // Get stock quote
  async getStockQuote(symbol) {
    console.log("🔍 FinnhubService.getStockQuote called with:", symbol);

    try {
      const response = await axios.get(`${this.baseURL}/quote`, {
        params: {
          symbol: symbol,
          token: this.apiKey,
        },
        timeout: this.timeout,
      });

      console.log("📦 Finnhub quote response:", {
        status: response.status,
        data: response.data,
      });

      if (!response.data) {
        throw new Error("No data returned");
      }

      const data = response.data;
      return {
        symbol: symbol.toUpperCase(),
        currentPrice: data.c || 0,
        change: data.d || 0,
        changePercent: data.dp || 0,
        volume: data.v || 0,
        previousClose: data.pc || 0,
        open: data.o || 0,
        high: data.h || 0,
        low: data.l || 0,
        lastUpdated: new Date().toISOString().split("T")[0],
      };
    } catch (error) {
      console.error("❌ Finnhub quote error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error(`Quote failed: ${error.message}`);
    }
  }

  // Get company profile
  async getCompanyProfile(symbol) {
    console.log("🔍 FinnhubService.getCompanyProfile called with:", symbol);

    try {
      const response = await axios.get(`${this.baseURL}/stock/profile2`, {
        params: {
          symbol: symbol,
          token: this.apiKey,
        },
        timeout: this.timeout,
      });

      console.log("📦 Finnhub profile response:", {
        status: response.status,
        data: response.data,
      });

      if (!response.data) {
        throw new Error("No data returned");
      }

      const data = response.data;
      return {
        symbol: symbol.toUpperCase(),
        companyName: data.name || "Unknown",
        description: data.finnhubIndustry || "No description available",
        sector: data.finnhubIndustry || "Unknown",
        industry: data.finnhubIndustry || "Unknown",
        marketCap: data.marketCapitalization || 0,
        peRatio: 0, // Not available in profile
        dividendYield: 0, // Will be fetched separately
        dividendPerShare: 0, // Will be fetched separately
        payoutRatio: 0,
        exDividendDate: null,
        website: data.weburl || "",
        address: data.address || "",
        country: data.country || "Unknown",
      };
    } catch (error) {
      console.error("❌ Finnhub profile error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error(`Profile failed: ${error.message}`);
    }
  }

  // Get company overview (quote + profile)
  async getCompanyOverview(symbol) {
    console.log("🔍 FinnhubService.getCompanyOverview called with:", symbol);

    try {
      const [quote, profile] = await Promise.all([this.getStockQuote(symbol), this.getCompanyProfile(symbol)]);

      return {
        ...profile,
        ...quote,
      };
    } catch (error) {
      console.error("❌ Finnhub overview error:", error.message);
      throw error;
    }
  }

  // Get full stock data
  async getFullStockData(symbol) {
    console.log("🔍 FinnhubService.getFullStockData called with:", symbol);

    try {
      const overview = await this.getCompanyOverview(symbol);
      return overview;
    } catch (error) {
      console.error("❌ Finnhub full data error:", error.message);
      throw error;
    }
  }

  // Get detailed stock data for portfolio view
  async getStockDetails(symbol) {
    console.log("🔍 FinnhubService.getStockDetails called with:", symbol);

    try {
      const overview = await this.getCompanyOverview(symbol);
      return {
        ...overview,
        beta: 0, // Not available
        fiftyTwoWeekHigh: 0, // Not available
        fiftyTwoWeekLow: 0, // Not available
        avgVolume: overview.volume || 0,
        dividendGrowthRate: 0, // Not available
        nextDividendDate: null, // Not available
        dividendGrowthYears: 0, // Not available
        employees: 0, // Not available
        ceo: "Unknown", // Not available
        founded: 0, // Not available
      };
    } catch (error) {
      console.error("❌ Finnhub details error:", error.message);
      throw error;
    }
  }

  // Get dividend history
  async getDividendHistory(symbol) {
    console.log("🔍 FinnhubService.getDividendHistory called with:", symbol);

    try {
      const response = await axios.get(`${this.baseURL}/stock/dividend`, {
        params: {
          symbol: symbol,
          from: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          to: new Date().toISOString().split("T")[0],
          token: this.apiKey,
        },
        timeout: this.timeout,
      });

      console.log("📦 Finnhub dividend response:", {
        status: response.status,
        resultsCount: response.data?.length || 0,
      });

      if (!response.data) {
        return [];
      }

      const history = response.data.map((div) => ({
        date: div.date,
        amount: div.amount,
        type: "Dividend",
        frequency: "Quarterly", // Default
      }));

      return history.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error("❌ Finnhub dividend history error:", error.message);
      return []; // Return empty array if no dividend history
    }
  }

  // Get top movers
  async getTopMovers() {
    console.log("🔍 FinnhubService.getTopMovers called");

    try {
      // Get popular stocks for top movers
      const popularSymbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX"];
      const movers = [];

      for (const symbol of popularSymbols) {
        try {
          const quote = await this.getStockQuote(symbol);
          movers.push({
            ticker: symbol,
            price: quote.currentPrice,
            change_amount: quote.change,
            change_percentage: quote.changePercent,
          });
        } catch (error) {
          console.log(`Skipping ${symbol}: ${error.message}`);
        }
      }

      // Sort by change percentage
      movers.sort((a, b) => Math.abs(b.change_percentage) - Math.abs(a.change_percentage));

      return {
        topGainers: movers.filter((m) => m.change_percentage > 0).slice(0, 3),
        topLosers: movers.filter((m) => m.change_percentage < 0).slice(0, 3),
      };
    } catch (error) {
      console.error("❌ Finnhub top movers error:", error.message);
      throw error;
    }
  }

  // Get dividend calendar
  async getDividendCalendar() {
    console.log("🔍 FinnhubService.getDividendCalendar called");

    try {
      // Get popular dividend stocks
      const dividendSymbols = ["AAPL", "MSFT", "JNJ", "PG", "KO", "PEP", "VZ", "T", "XOM", "CVX"];
      const calendar = [];

      for (const symbol of dividendSymbols) {
        try {
          const profile = await this.getCompanyProfile(symbol);
          calendar.push({
            symbol: symbol,
            company: profile.companyName,
            ex_dividend_date: "Unknown", // Not available
            dividend_amount: 0, // Not available
            payment_date: "Unknown", // Not available
          });
        } catch (error) {
          console.log(`Skipping ${symbol}: ${error.message}`);
        }
      }

      return calendar;
    } catch (error) {
      console.error("❌ Finnhub dividend calendar error:", error.message);
      throw error;
    }
  }
}

module.exports = FinnhubService;

// Yahoo Finance API Service - Free alternative to Alpha Vantage
const axios = require("axios");

class YahooFinanceService {
  constructor() {
    this.baseURL = "https://query1.finance.yahoo.com";
    this.timeout = 10000;
  }

  // Search for stocks
  async searchStocks(keywords) {
    console.log("🔍 YahooFinanceService.searchStocks called with:", keywords);

    try {
      const response = await axios.get(`${this.baseURL}/v1/finance/search`, {
        params: {
          query: keywords,
          quotesCount: 10,
          newsCount: 0,
          enableFuzzyQuery: true,
        },
        timeout: this.timeout,
      });

      console.log("📦 Yahoo Finance search response:", {
        status: response.status,
        dataKeys: Object.keys(response.data || {}),
        resultsCount: response.data?.quotes?.length || 0,
      });

      if (!response.data?.quotes) {
        console.log("❌ No quotes found in response");
        return [];
      }

      const formattedResults = response.data.quotes.map((quote) => ({
        symbol: quote.symbol,
        companyName: quote.shortname || quote.longname || quote.displayName,
        type: quote.quoteType || "Equity",
        region: quote.market || "US",
        marketOpen: "09:30",
        marketClose: "16:00",
        timezone: "UTC-04",
        currency: quote.currency || "USD",
        currentPrice: quote.regularMarketPrice || 0,
        dividendYield: quote.trailingAnnualDividendYield || 0,
        dividendPerShare: quote.trailingAnnualDividendRate || 0,
        sector: quote.sector || "Unknown",
        payoutRatio: 0, // Not available in search
        frequency: "Quarterly", // Default
        exDividendDate: null, // Not available in search
      }));

      console.log("✅ Formatted search results:", formattedResults.length, "matches found");
      return formattedResults;
    } catch (error) {
      console.error("❌ Yahoo Finance search error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // Get stock quote
  async getStockQuote(symbol) {
    console.log("🔍 YahooFinanceService.getStockQuote called with:", symbol);

    try {
      const response = await axios.get(`${this.baseURL}/v8/finance/chart/${symbol}`, {
        params: {
          range: "1d",
          interval: "1m",
          includePrePost: false,
        },
        timeout: this.timeout,
      });

      console.log("📦 Yahoo Finance quote response:", {
        status: response.status,
        dataKeys: Object.keys(response.data?.chart?.result?.[0] || {}),
      });

      const result = response.data?.chart?.result?.[0];
      if (!result) {
        throw new Error("No data returned");
      }

      const meta = result.meta;
      const quote = result.indicators.quote[0];
      const timestamp = result.timestamp[result.timestamp.length - 1];

      return {
        symbol: symbol.toUpperCase(),
        currentPrice: meta.regularMarketPrice || 0,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: (((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100).toFixed(2),
        volume: quote.volume[quote.volume.length - 1] || 0,
        previousClose: meta.previousClose || 0,
        open: meta.regularMarketOpen || 0,
        high: meta.regularMarketDayHigh || 0,
        low: meta.regularMarketDayLow || 0,
        lastUpdated: new Date(timestamp * 1000).toISOString().split("T")[0],
      };
    } catch (error) {
      console.error("❌ Yahoo Finance quote error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error(`Quote failed: ${error.message}`);
    }
  }

  // Get company overview
  async getCompanyOverview(symbol) {
    console.log("🔍 YahooFinanceService.getCompanyOverview called with:", symbol);

    try {
      const response = await axios.get(`${this.baseURL}/v10/finance/quoteSummary/${symbol}`, {
        params: {
          modules: "summaryDetail,assetProfile,defaultKeyStatistics",
        },
        timeout: this.timeout,
      });

      console.log("📦 Yahoo Finance overview response:", {
        status: response.status,
        dataKeys: Object.keys(response.data?.quoteSummary?.result?.[0] || {}),
      });

      const result = response.data?.quoteSummary?.result?.[0];
      if (!result) {
        throw new Error("No data returned");
      }

      const summaryDetail = result.summaryDetail || {};
      const assetProfile = result.assetProfile || {};
      const defaultKeyStatistics = result.defaultKeyStatistics || {};

      return {
        symbol: symbol.toUpperCase(),
        companyName: assetProfile.longBusinessSummary || "Unknown",
        description: assetProfile.longBusinessSummary || "No description available",
        sector: assetProfile.sector || "Unknown",
        industry: assetProfile.industry || "Unknown",
        marketCap: summaryDetail.marketCap || 0,
        peRatio: summaryDetail.trailingPE || 0,
        dividendYield: summaryDetail.dividendYield ? summaryDetail.dividendYield * 100 : 0,
        dividendPerShare: summaryDetail.dividendRate || 0,
        payoutRatio: summaryDetail.payoutRatio ? summaryDetail.payoutRatio * 100 : 0,
        exDividendDate: summaryDetail.exDividendDate ? new Date(summaryDetail.exDividendDate * 1000).toISOString().split("T")[0] : null,
        website: assetProfile.website || "",
        address: assetProfile.address1 || "",
        country: assetProfile.country || "Unknown",
      };
    } catch (error) {
      console.error("❌ Yahoo Finance overview error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error(`Overview failed: ${error.message}`);
    }
  }

  // Get full stock data (quote + overview)
  async getFullStockData(symbol) {
    console.log("🔍 YahooFinanceService.getFullStockData called with:", symbol);

    try {
      const [quote, overview] = await Promise.all([this.getStockQuote(symbol), this.getCompanyOverview(symbol)]);

      return {
        ...overview,
        ...quote,
      };
    } catch (error) {
      console.error("❌ Yahoo Finance full data error:", error.message);
      throw error;
    }
  }

  // Get detailed stock data for portfolio view
  async getStockDetails(symbol) {
    console.log("🔍 YahooFinanceService.getStockDetails called with:", symbol);

    try {
      const response = await axios.get(`${this.baseURL}/v10/finance/quoteSummary/${symbol}`, {
        params: {
          modules: "summaryDetail,assetProfile,defaultKeyStatistics,financialData,calendarEvents",
        },
        timeout: this.timeout,
      });

      const result = response.data?.quoteSummary?.result?.[0];
      if (!result) {
        throw new Error("No data returned");
      }

      const summaryDetail = result.summaryDetail || {};
      const assetProfile = result.assetProfile || {};
      const defaultKeyStatistics = result.defaultKeyStatistics || {};
      const financialData = result.financialData || {};
      const calendarEvents = result.calendarEvents || {};

      return {
        symbol: symbol.toUpperCase(),
        companyName: assetProfile.longBusinessSummary || "Unknown",
        currentPrice: summaryDetail.previousClose || 0,
        dividendYield: summaryDetail.dividendYield ? summaryDetail.dividendYield * 100 : 0,
        dividendPerShare: summaryDetail.dividendRate || 0,
        sector: assetProfile.sector || "Unknown",
        payoutRatio: summaryDetail.payoutRatio ? summaryDetail.payoutRatio * 100 : 0,
        frequency: "Quarterly", // Default
        exDividendDate: summaryDetail.exDividendDate ? new Date(summaryDetail.exDividendDate * 1000).toISOString().split("T")[0] : null,
        marketCap: summaryDetail.marketCap || 0,
        peRatio: summaryDetail.trailingPE || 0,
        beta: defaultKeyStatistics.beta || 0,
        fiftyTwoWeekHigh: summaryDetail.fiftyTwoWeekHigh || 0,
        fiftyTwoWeekLow: summaryDetail.fiftyTwoWeekLow || 0,
        avgVolume: summaryDetail.averageVolume || 0,
        dividendGrowthRate: 0, // Not available
        nextDividendDate: null, // Not available
        dividendGrowthYears: 0, // Not available
        industry: assetProfile.industry || "Unknown",
        employees: assetProfile.fullTimeEmployees || 0,
        website: assetProfile.website || "",
        ceo: assetProfile.companyOfficers?.[0]?.name || "Unknown",
        founded: assetProfile.founded || 0,
      };
    } catch (error) {
      console.error("❌ Yahoo Finance details error:", error.message);
      throw error;
    }
  }

  // Get dividend history
  async getDividendHistory(symbol) {
    console.log("🔍 YahooFinanceService.getDividendHistory called with:", symbol);

    try {
      const response = await axios.get(`${this.baseURL}/v8/finance/chart/${symbol}`, {
        params: {
          range: "2y",
          interval: "1d",
          includePrePost: false,
          events: "div",
        },
        timeout: this.timeout,
      });

      const result = response.data?.chart?.result?.[0];
      if (!result || !result.events?.dividends) {
        return [];
      }

      const dividends = Object.values(result.events.dividends);
      const history = dividends.map((div) => ({
        date: new Date(div.date * 1000).toISOString().split("T")[0],
        amount: div.amount,
        type: "Dividend",
        frequency: "Quarterly", // Default
      }));

      return history.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error("❌ Yahoo Finance dividend history error:", error.message);
      return []; // Return empty array if no dividend history
    }
  }

  // Get top movers
  async getTopMovers() {
    console.log("🔍 YahooFinanceService.getTopMovers called");

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
      movers.sort((a, b) => Math.abs(parseFloat(b.change_percentage)) - Math.abs(parseFloat(a.change_percentage)));

      return {
        topGainers: movers.filter((m) => parseFloat(m.change_percentage) > 0).slice(0, 3),
        topLosers: movers.filter((m) => parseFloat(m.change_percentage) < 0).slice(0, 3),
      };
    } catch (error) {
      console.error("❌ Yahoo Finance top movers error:", error.message);
      throw error;
    }
  }

  // Get dividend calendar
  async getDividendCalendar() {
    console.log("🔍 YahooFinanceService.getDividendCalendar called");

    try {
      // Get popular dividend stocks
      const dividendSymbols = ["AAPL", "MSFT", "JNJ", "PG", "KO", "PEP", "VZ", "T", "XOM", "CVX"];
      const calendar = [];

      for (const symbol of dividendSymbols) {
        try {
          const overview = await this.getCompanyOverview(symbol);
          if (overview.dividendYield > 0) {
            calendar.push({
              symbol: symbol,
              company: overview.companyName,
              ex_dividend_date: overview.exDividendDate || "Unknown",
              dividend_amount: overview.dividendPerShare,
              payment_date: overview.exDividendDate ? new Date(new Date(overview.exDividendDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : "Unknown",
            });
          }
        } catch (error) {
          console.log(`Skipping ${symbol}: ${error.message}`);
        }
      }

      return calendar;
    } catch (error) {
      console.error("❌ Yahoo Finance dividend calendar error:", error.message);
      throw error;
    }
  }
}

module.exports = YahooFinanceService;

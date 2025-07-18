const axios = require("axios");

// Alpha Vantage API - Free tier with 5 API calls per minute
const ALPHA_VANTAGE_API_KEY = "85Z2PRWBZG3W3SST"; // You can get a free key from https://www.alphavantage.co/support/#api-key
const BASE_URL = "https://www.alphavantage.co/query";

class StockDataService {
  constructor() {
    this.apiKey = ALPHA_VANTAGE_API_KEY;
  }

  // Get real-time stock quote
  async getStockQuote(symbol) {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: "GLOBAL_QUOTE",
          symbol: symbol.toUpperCase(),
          apikey: this.apiKey,
        },
      });

      const data = response.data["Global Quote"];
      if (!data || Object.keys(data).length === 0) {
        throw new Error("Stock not found");
      }

      return {
        symbol: data["01. symbol"],
        currentPrice: parseFloat(data["05. price"]),
        change: parseFloat(data["09. change"]),
        changePercent: data["10. change percent"].replace("%", ""),
        volume: parseInt(data["06. volume"]),
        previousClose: parseFloat(data["08. previous close"]),
        open: parseFloat(data["02. open"]),
        high: parseFloat(data["03. high"]),
        low: parseFloat(data["04. low"]),
        lastUpdated: data["07. latest trading day"],
      };
    } catch (error) {
      console.error(`Error fetching stock quote for ${symbol}:`, error.message);
      throw error;
    }
  }

  // Get company overview
  async getCompanyOverview(symbol) {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: "OVERVIEW",
          symbol: symbol.toUpperCase(),
          apikey: this.apiKey,
        },
      });

      const data = response.data;
      if (!data.Symbol) {
        throw new Error("Company not found");
      }

      return {
        symbol: data.Symbol,
        companyName: data.Name,
        description: data.Description,
        sector: data.Sector,
        industry: data.Industry,
        marketCap: data.MarketCapitalization,
        peRatio: data.PERatio,
        dividendYield: data.DividendYield ? parseFloat(data.DividendYield) : 0,
        dividendPerShare: data.DividendPerShare ? parseFloat(data.DividendPerShare) : 0,
        payoutRatio: data.PayoutRatio ? parseFloat(data.PayoutRatio) : 0,
        exDividendDate: data.ExDividendDate,
        website: data.Website,
        address: data.Address,
        country: data.Country,
      };
    } catch (error) {
      console.error(`Error fetching company overview for ${symbol}:`, error.message);
      throw error;
    }
  }

  // Search for stocks
  async searchStocks(keywords) {
    console.log("🔍 StockDataService.searchStocks called with:", keywords);

    try {
      const requestParams = {
        function: "SYMBOL_SEARCH",
        keywords: keywords,
        apikey: this.apiKey,
      };

      console.log("📡 Making Alpha Vantage API request:", {
        url: BASE_URL,
        params: requestParams,
      });

      const response = await axios.get(BASE_URL, {
        params: requestParams,
      });

      console.log("📦 Alpha Vantage response received:", {
        status: response.status,
        statusText: response.statusText,
        dataKeys: Object.keys(response.data),
        bestMatchesCount: response.data.bestMatches?.length,
      });

      const matches = response.data.bestMatches || [];
      console.log("🔍 Raw matches from Alpha Vantage:", matches);

      const formattedMatches = matches.map((match) => ({
        symbol: match["1. symbol"],
        companyName: match["2. name"],
        type: match["3. type"],
        region: match["4. region"],
        marketOpen: match["5. marketOpen"],
        marketClose: match["6. marketClose"],
        timezone: match["7. timezone"],
        currency: match["8. currency"],
      }));

      console.log("✅ Formatted matches:", formattedMatches);
      return formattedMatches;
    } catch (error) {
      console.error("❌ Alpha Vantage API error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });
      throw error;
    }
  }

  // Get top gainers and losers
  async getTopMovers() {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: "TOP_GAINERS_LOSERS",
          apikey: this.apiKey,
        },
      });

      return {
        topGainers: response.data.top_gainers || [],
        topLosers: response.data.top_losers || [],
      };
    } catch (error) {
      console.error("Error fetching top movers:", error.message);
      throw error;
    }
  }

  // Get dividend calendar
  async getDividendCalendar() {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: "EARNINGS_CALENDAR",
          apikey: this.apiKey,
        },
      });

      // Parse CSV response
      const lines = response.data.split("\n");
      const headers = lines[0].split(",");
      const dividends = lines.slice(1).map((line) => {
        const values = line.split(",");
        const dividend = {};
        headers.forEach((header, index) => {
          dividend[header.trim()] = values[index] ? values[index].trim() : "";
        });
        return dividend;
      });
      console.log(dividends);
      return dividends.filter((d) => d.symbol && d.symbol !== "");
    } catch (error) {
      console.error("Error fetching dividend calendar:", error.message);
      throw error;
    }
  }

  // Get comprehensive stock data (quote + overview)
  async getFullStockData(symbol) {
    try {
      const [quote, overview] = await Promise.all([this.getStockQuote(symbol), this.getCompanyOverview(symbol)]);

      return {
        ...overview,
        ...quote,
        dividendYield: overview.dividendYield || 0,
        dividendPerShare: overview.dividendPerShare || 0,
        payoutRatio: overview.payoutRatio || 0,
      };
    } catch (error) {
      console.error(`Error fetching full stock data for ${symbol}:`, error.message);
      throw error;
    }
  }
}

module.exports = new StockDataService();

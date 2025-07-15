const axios = require("axios");

class AlphaVantageService {
  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.baseUrl = "https://www.alphavantage.co/query";
  }

  async searchStocks(query) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: "SYMBOL_SEARCH",
          keywords: query,
          apikey: this.apiKey,
        },
      });
      if (response.data && response.data.bestMatches) {
        const results = response.data.bestMatches.map((match) => ({
          symbol: match["1. symbol"],
          name: match["2. name"],
          type: match["3. type"],
          region: match["4. region"],
          currency: match["8. currency"],
        }));
        return { count: results.length, results };
      }
      return { count: 0, results: [] };
    } catch (error) {
      throw new Error("Alpha Vantage search error: " + error.message);
    }
  }

  async getStockQuote(symbol) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: "GLOBAL_QUOTE",
          symbol,
          apikey: this.apiKey,
        },
      });
      if (response.data && response.data["Global Quote"]) {
        const q = response.data["Global Quote"];
        return {
          symbol: q["01. symbol"],
          price: parseFloat(q["05. price"]),
          change: parseFloat(q["09. change"]),
          changePercent: parseFloat(q["10. change percent"]),
          previousClose: parseFloat(q["08. previous close"]),
          open: parseFloat(q["02. open"]),
          high: parseFloat(q["03. high"]),
          low: parseFloat(q["04. low"]),
          volume: parseInt(q["06. volume"]),
        };
      }
      return null;
    } catch (error) {
      throw new Error("Alpha Vantage quote error: " + error.message);
    }
  }

  async getCompanyOverview(symbol) {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: "OVERVIEW",
          symbol,
          apikey: this.apiKey,
        },
      });
      if (response.data && response.data.Symbol) {
        const d = response.data;
        return {
          symbol: d.Symbol,
          name: d.Name,
          sector: d.Sector,
          industry: d.Industry,
          employees: d.FullTimeEmployees,
          website: d.Website,
          description: d.Description,
          marketCap: d.MarketCapitalization,
          peRatio: d.PERatio,
          dividendYield: d.DividendYield,
          beta: d.Beta,
          priceToBook: d.PriceToBookRatio,
          returnOnEquity: d.ReturnOnEquityTTM,
        };
      }
      return null;
    } catch (error) {
      throw new Error("Alpha Vantage overview error: " + error.message);
    }
  }

  async getDividendHistory(symbol) {
    // Alpha Vantage does not provide dividend history in free tier
    return [];
  }

  async getStockData(symbol) {
    const [quote, overview, dividendHistory] = await Promise.allSettled([this.getStockQuote(symbol), this.getCompanyOverview(symbol), this.getDividendHistory(symbol)]);
    return {
      symbol,
      quote: quote.status === "fulfilled" ? quote.value : null,
      overview: overview.status === "fulfilled" ? overview.value : null,
      dividendHistory: dividendHistory.status === "fulfilled" ? dividendHistory.value : [],
    };
  }
}

module.exports = AlphaVantageService;

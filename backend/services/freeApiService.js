const axios = require("axios");

class FreeApiService {
  constructor() {
    this.iexApiKey = process.env.IEX_API_KEY || "Tpk_18dfe6cebb4f41ffb219b9680f9acaf2"; // Free demo key
    this.finnhubApiKey = process.env.FINNHUB_API_KEY || "demo"; // Free demo key
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY;
  }

  async searchStocks(query) {
    // Try Polygon first, then other APIs
    const apis = [() => this.searchWithPolygon(query), () => this.searchWithIEX(query), () => this.searchWithFinnhub(query), () => this.searchWithAlphaVantage(query)];

    for (const api of apis) {
      try {
        const result = await api();
        if (result && result.results && result.results.length > 0) {
          return result;
        }
      } catch (error) {
        console.warn("API search failed, trying next:", error.message);
      }
    }

    return { count: 0, results: [] };
  }

  async searchWithPolygon(query) {
    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) throw new Error("Polygon API key not configured");
    try {
      const response = await axios.get("https://api.polygon.io/v3/reference/tickers", {
        params: {
          search: query,
          active: true,
          limit: 10,
          apiKey,
        },
        timeout: 5000,
      });
      if (response.data && response.data.results) {
        const results = response.data.results.map((item) => ({
          symbol: item.ticker,
          companyName: item.name || "Unknown Company",
          sector: item.market || "Unknown Sector",
          type: item.type || "Equity",
          region: "US",
          // Add default values for frontend compatibility
          currentPrice: 0,
          dividendYield: 0,
          dividendPerShare: 0,
          payoutRatio: 0,
          frequency: "quarterly",
          exDividendDate: null,
        }));
        console.log("Polygon search results:", results);
        return { count: results.length, results };
      }
      return { count: 0, results: [] };
    } catch (error) {
      throw new Error(`Polygon search failed: ${error.message}`);
    }
  }

  async searchWithIEX(query) {
    try {
      const response = await axios.get(`https://cloud.iexapis.com/stable/search/${query}`, {
        params: { token: this.iexApiKey },
        timeout: 5000,
      });

      if (response.data && Array.isArray(response.data)) {
        const results = response.data.slice(0, 10).map((item) => ({
          symbol: item.symbol,
          companyName: item.securityName || item.name || "Unknown Company",
          sector: item.sector || "Unknown Sector",
          type: item.type || "Equity",
          region: item.region || "US",
          // Add default values for frontend compatibility
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
      throw new Error(`IEX search failed: ${error.message}`);
    }
  }

  async searchWithFinnhub(query) {
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/search`, {
        params: { q: query, token: this.finnhubApiKey },
        timeout: 5000,
      });

      if (response.data && response.data.result) {
        const results = response.data.result.slice(0, 10).map((item) => ({
          symbol: item.symbol,
          companyName: item.description || item.name || "Unknown Company",
          sector: item.finnhubIndustry || "Unknown Sector",
          type: item.type || "Equity",
          region: item.region || "US",
          // Add default values for frontend compatibility
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
      throw new Error(`Finnhub search failed: ${error.message}`);
    }
  }

  async searchWithAlphaVantage(query) {
    if (!this.alphaVantageApiKey) {
      throw new Error("Alpha Vantage API key not configured");
    }

    try {
      const response = await axios.get("https://www.alphavantage.co/query", {
        params: {
          function: "SYMBOL_SEARCH",
          keywords: query,
          apikey: this.alphaVantageApiKey,
        },
        timeout: 5000,
      });

      if (response.data && response.data.bestMatches) {
        const results = response.data.bestMatches.map((match) => ({
          symbol: match["1. symbol"],
          companyName: match["2. name"] || "Unknown Company",
          sector: "Unknown Sector",
          type: match["3. type"] || "Equity",
          region: match["4. region"] || "US",
          currency: match["8. currency"] || "USD",
          // Add default values for frontend compatibility
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
      throw new Error(`Alpha Vantage search failed: ${error.message}`);
    }
  }

  async getStockQuote(symbol) {
    const apis = [() => this.getQuoteWithIEX(symbol), () => this.getQuoteWithFinnhub(symbol), () => this.getQuoteWithAlphaVantage(symbol)];

    for (const api of apis) {
      try {
        const result = await api();
        if (result) {
          return result;
        }
      } catch (error) {
        console.warn("API quote failed, trying next:", error.message);
      }
    }

    throw new Error("All quote APIs failed");
  }

  async getQuoteWithIEX(symbol) {
    try {
      const response = await axios.get(`https://cloud.iexapis.com/stable/stock/${symbol}/quote`, {
        params: { token: this.iexApiKey },
        timeout: 5000,
      });

      if (response.data) {
        const q = response.data;
        return {
          symbol: q.symbol,
          price: q.latestPrice,
          change: q.change,
          changePercent: q.changePercent * 100,
          previousClose: q.previousClose,
          open: q.open,
          high: q.high,
          low: q.low,
          volume: q.latestVolume,
          marketCap: q.marketCap,
        };
      }
      return null;
    } catch (error) {
      throw new Error(`IEX quote failed: ${error.message}`);
    }
  }

  async getQuoteWithFinnhub(symbol) {
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
        params: { symbol, token: this.finnhubApiKey },
        timeout: 5000,
      });

      if (response.data) {
        const q = response.data;
        return {
          symbol: symbol,
          price: q.c,
          change: q.d,
          changePercent: q.dp,
          previousClose: q.pc,
          high: q.h,
          low: q.l,
          open: q.o,
        };
      }
      return null;
    } catch (error) {
      throw new Error(`Finnhub quote failed: ${error.message}`);
    }
  }

  async getQuoteWithAlphaVantage(symbol) {
    if (!this.alphaVantageApiKey) {
      throw new Error("Alpha Vantage API key not configured");
    }

    try {
      const response = await axios.get("https://www.alphavantage.co/query", {
        params: {
          function: "GLOBAL_QUOTE",
          symbol,
          apikey: this.alphaVantageApiKey,
        },
        timeout: 5000,
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
      throw new Error(`Alpha Vantage quote failed: ${error.message}`);
    }
  }

  async getCompanyOverview(symbol) {
    const apis = [() => this.getOverviewWithIEX(symbol), () => this.getOverviewWithFinnhub(symbol), () => this.getOverviewWithAlphaVantage(symbol)];

    for (const api of apis) {
      try {
        const result = await api();
        if (result) {
          return result;
        }
      } catch (error) {
        console.warn("API overview failed, trying next:", error.message);
      }
    }

    return null;
  }

  async getOverviewWithIEX(symbol) {
    try {
      const [company, financials] = await Promise.all([
        axios.get(`https://cloud.iexapis.com/stable/stock/${symbol}/company`, {
          params: { token: this.iexApiKey },
          timeout: 5000,
        }),
        axios.get(`https://cloud.iexapis.com/stable/stock/${symbol}/financials`, {
          params: { token: this.iexApiKey },
          timeout: 5000,
        }),
      ]);

      if (company.data) {
        const c = company.data;
        const f = financials.data && financials.data.financials ? financials.data.financials[0] : {};

        return {
          symbol: c.symbol,
          name: c.companyName,
          sector: c.sector,
          industry: c.industry,
          employees: c.employees,
          website: c.website,
          description: c.description,
          marketCap: c.marketcap,
          peRatio: f.priceToEarningsRatio,
          dividendYield: c.dividendYield ? c.dividendYield * 100 : 0,
        };
      }
      return null;
    } catch (error) {
      throw new Error(`IEX overview failed: ${error.message}`);
    }
  }

  async getOverviewWithFinnhub(symbol) {
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/stock/profile2`, {
        params: { symbol, token: this.finnhubApiKey },
        timeout: 5000,
      });

      if (response.data) {
        const p = response.data;
        return {
          symbol: p.ticker,
          name: p.name,
          sector: p.finnhubIndustry,
          industry: p.finnhubIndustry,
          employees: p.employeeTotal,
          website: p.weburl,
          description: p.finnhubIndustry,
          marketCap: p.marketCapitalization,
        };
      }
      return null;
    } catch (error) {
      throw new Error(`Finnhub overview failed: ${error.message}`);
    }
  }

  async getOverviewWithAlphaVantage(symbol) {
    if (!this.alphaVantageApiKey) {
      throw new Error("Alpha Vantage API key not configured");
    }

    try {
      const response = await axios.get("https://www.alphavantage.co/query", {
        params: {
          function: "OVERVIEW",
          symbol,
          apikey: this.alphaVantageApiKey,
        },
        timeout: 5000,
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
      throw new Error(`Alpha Vantage overview failed: ${error.message}`);
    }
  }

  async getDividendHistory(symbol) {
    // Most free APIs don't provide dividend history
    // IEX provides some dividend data
    try {
      const response = await axios.get(`https://cloud.iexapis.com/stable/stock/${symbol}/dividends/1y`, {
        params: { token: this.iexApiKey },
        timeout: 5000,
      });

      if (response.data && Array.isArray(response.data)) {
        return response.data.map((d) => ({
          date: d.paymentDate,
          amount: d.amount,
          timestamp: new Date(d.paymentDate).getTime(),
        }));
      }
      return [];
    } catch (error) {
      console.warn("Dividend history not available:", error.message);
      return [];
    }
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

module.exports = FreeApiService;

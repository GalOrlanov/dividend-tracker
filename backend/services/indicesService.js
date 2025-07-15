const axios = require("axios");

class IndicesService {
  constructor() {
    console.log("📊 Indices Service: Using free APIs for market indices");
  }

  async getIndexQuote(symbol) {
    const apis = [this.tryYahooFinance, this.tryAlphaVantage, this.tryFinnhub, this.tryIEXCloud];

    for (const api of apis) {
      try {
        const result = await api(symbol);
        if (result && result.price > 0) {
          return result;
        }
      } catch (error) {
        console.log(`❌ ${api.name} failed for ${symbol}:`, error.message);
        continue;
      }
    }

    console.log(`❌ All APIs failed for ${symbol}`);
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

  async tryYahooFinance(symbol) {
    try {
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
        timeout: 5000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (response.data && response.data.chart && response.data.chart.result) {
        const result = response.data.chart.result[0];
        const meta = result.meta;
        const indicators = result.indicators.quote[0];

        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.previousClose;
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        return {
          symbol: symbol,
          price: currentPrice,
          change: change,
          changePercent: changePercent,
          previousClose: previousClose,
          open: meta.regularMarketOpen || currentPrice,
          high: meta.regularMarketDayHigh || currentPrice,
          low: meta.regularMarketDayLow || currentPrice,
          volume: meta.regularMarketVolume || 0,
          marketCap: 0,
        };
      }
      throw new Error("Invalid response format");
    } catch (error) {
      throw error;
    }
  }

  async tryAlphaVantage(symbol) {
    try {
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY || "demo";
      const response = await axios.get(`https://www.alphavantage.co/query`, {
        params: {
          function: "GLOBAL_QUOTE",
          symbol: symbol,
          apikey: apiKey,
        },
        timeout: 5000,
      });

      if (response.data && response.data["Global Quote"]) {
        const quote = response.data["Global Quote"];
        const currentPrice = parseFloat(quote["05. price"]);
        const previousClose = parseFloat(quote["08. previous close"]);
        const change = parseFloat(quote["09. change"]);
        const changePercent = parseFloat(quote["10. change percent"].replace("%", ""));

        return {
          symbol: symbol,
          price: currentPrice,
          change: change,
          changePercent: changePercent,
          previousClose: previousClose,
          open: parseFloat(quote["02. open"]) || currentPrice,
          high: parseFloat(quote["03. high"]) || currentPrice,
          low: parseFloat(quote["04. low"]) || currentPrice,
          volume: parseInt(quote["06. volume"]) || 0,
          marketCap: 0,
        };
      }
      throw new Error("Invalid response format");
    } catch (error) {
      throw error;
    }
  }

  async tryFinnhub(symbol) {
    try {
      const apiKey = process.env.FINNHUB_API_KEY || "demo";
      const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
        params: {
          symbol: symbol,
          token: apiKey,
        },
        timeout: 5000,
      });

      if (response.data) {
        const data = response.data;
        const currentPrice = data.c;
        const previousClose = data.pc;
        const change = data.d;
        const changePercent = data.dp;

        return {
          symbol: symbol,
          price: currentPrice,
          change: change,
          changePercent: changePercent,
          previousClose: previousClose,
          open: data.o || currentPrice,
          high: data.h || currentPrice,
          low: data.l || currentPrice,
          volume: 0,
          marketCap: 0,
        };
      }
      throw new Error("Invalid response format");
    } catch (error) {
      throw error;
    }
  }

  async tryIEXCloud(symbol) {
    try {
      const apiKey = process.env.IEX_API_KEY || "demo";
      const response = await axios.get(`https://cloud.iexapis.com/stable/stock/${symbol}/quote`, {
        params: {
          token: apiKey,
        },
        timeout: 5000,
      });

      if (response.data) {
        const data = response.data;
        const currentPrice = data.latestPrice;
        const previousClose = data.previousClose;
        const change = data.change;
        const changePercent = data.changePercent * 100;

        return {
          symbol: symbol,
          price: currentPrice,
          change: change,
          changePercent: changePercent,
          previousClose: previousClose,
          open: data.open || currentPrice,
          high: data.high || currentPrice,
          low: data.low || currentPrice,
          volume: data.latestVolume || 0,
          marketCap: data.marketCap || 0,
        };
      }
      throw new Error("Invalid response format");
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new IndicesService();

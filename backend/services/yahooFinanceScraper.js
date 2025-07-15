const axios = require("axios");

class YahooFinanceScraper {
  constructor() {
    this.baseUrl = "https://query1.finance.yahoo.com";
    this.userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
  }

  async searchStocks(query) {
    try {
      console.log(`🔍 Yahoo Finance searching for: ${query}`);

      // Use Yahoo Finance search API
      const searchUrl = `${this.baseUrl}/v1/finance/search`;
      const params = {
        query: query,
        quotesCount: 10,
        newsCount: 0,
        enableFuzzyQuery: false,
        quotesQueryId: "tss_match_phrase_query",
        multiQuoteQueryId: "multi_quote_single_token_query",
        enableCb: true,
        enableNavLinks: true,
        enableEnhancedTrivialQuery: true,
        enableResearchReports: true,
        enableCulturalAssets: true,
        researchReportsCount: 2,
      };

      const response = await axios.get(searchUrl, {
        params,
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
          Referer: "https://finance.yahoo.com/",
        },
        timeout: 10000,
      });

      if (response.data && response.data.quotes) {
        const results = response.data.quotes.map((quote) => ({
          symbol: quote.symbol,
          name: quote.shortname || quote.longname,
          exchange: quote.exchange,
          type: quote.quoteType,
          market: quote.market,
        }));

        console.log(`✅ Yahoo Finance found ${results.length} results for: ${query}`);
        return {
          count: results.length,
          results: results,
        };
      }

      console.log(`❌ No results found for: ${query}`);
      return { count: 0, results: [] };
    } catch (error) {
      console.error(`❌ Yahoo Finance search error for ${query}:`, error.message);
      throw new Error(`Failed to search stocks: ${error.message}`);
    }
  }

  async getStockQuote(symbol) {
    try {
      console.log(`📈 Yahoo Finance getting quote for: ${symbol}`);

      // Use Yahoo Finance quote API
      const quoteUrl = `${this.baseUrl}/v8/finance/chart/${symbol}`;
      const params = {
        interval: "1d",
        range: "1d",
        includePrePost: false,
        events: "div,split",
        useYfid: true,
        includeAdjustedClose: true,
        tsMs: Date.now(),
      };

      const response = await axios.get(quoteUrl, {
        params,
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
          Referer: "https://finance.yahoo.com/",
        },
        timeout: 10000,
      });

      if (response.data && response.data.chart && response.data.chart.result) {
        const result = response.data.chart.result[0];
        const meta = result.meta;
        const indicators = result.indicators.quote[0];
        const timestamp = result.timestamp[0];

        const quote = {
          symbol: symbol,
          price: meta.regularMarketPrice,
          change: meta.regularMarketPrice - meta.previousClose,
          changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
          previousClose: meta.previousClose,
          open: meta.regularMarketOpen,
          high: meta.regularMarketDayHigh,
          low: meta.regularMarketDayLow,
          volume: meta.regularMarketVolume,
          marketCap: meta.marketCap,
          timestamp: timestamp * 1000,
        };

        console.log(`✅ Yahoo Finance quote for ${symbol}: $${quote.price}`);
        return quote;
      }

      throw new Error("Invalid response format");
    } catch (error) {
      console.error(`❌ Yahoo Finance quote error for ${symbol}:`, error.message);
      throw new Error(`Failed to get stock quote: ${error.message}`);
    }
  }

  async getCompanyOverview(symbol) {
    try {
      console.log(`🏢 Yahoo Finance getting overview for: ${symbol}`);

      // Use Yahoo Finance asset profile API
      const overviewUrl = `${this.baseUrl}/v10/finance/quoteSummary/${symbol}`;
      const params = {
        modules: "assetProfile,financialData,defaultKeyStatistics",
        lang: "en-US",
        region: "US",
        includeAdjustedClose: true,
        interval: "1d",
        range: "1d",
        tsMs: Date.now(),
      };

      const response = await axios.get(overviewUrl, {
        params,
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
          Referer: "https://finance.yahoo.com/",
        },
        timeout: 10000,
      });

      if (response.data && response.data.quoteSummary && response.data.quoteSummary.result) {
        const result = response.data.quoteSummary.result[0];
        const assetProfile = result.assetProfile || {};
        const financialData = result.financialData || {};
        const defaultKeyStatistics = result.defaultKeyStatistics || {};

        const overview = {
          symbol: symbol,
          name: assetProfile.longBusinessSummary || assetProfile.shortBusinessSummary || "",
          sector: assetProfile.sector || "",
          industry: assetProfile.industry || "",
          employees: assetProfile.fullTimeEmployees || 0,
          website: assetProfile.website || "",
          description: assetProfile.longBusinessSummary || "",
          marketCap: financialData.marketCap || 0,
          peRatio: financialData.forwardPE || 0,
          dividendYield: financialData.dividendYield ? financialData.dividendYield * 100 : 0,
          beta: defaultKeyStatistics.beta || 0,
          priceToBook: financialData.priceToBook || 0,
          returnOnEquity: financialData.returnOnEquity ? financialData.returnOnEquity * 100 : 0,
        };

        console.log(`✅ Yahoo Finance overview for ${symbol}: ${overview.name}`);
        return overview;
      }

      throw new Error("Invalid response format");
    } catch (error) {
      console.error(`❌ Yahoo Finance overview error for ${symbol}:`, error.message);
      throw new Error(`Failed to get company overview: ${error.message}`);
    }
  }

  async getDividendHistory(symbol) {
    try {
      console.log(`💰 Yahoo Finance getting dividend history for: ${symbol}`);

      // Use Yahoo Finance dividend history API
      const dividendUrl = `${this.baseUrl}/v8/finance/chart/${symbol}`;
      const params = {
        interval: "1d",
        range: "2y",
        includePrePost: false,
        events: "div",
        useYfid: true,
        includeAdjustedClose: true,
        tsMs: Date.now(),
      };

      const response = await axios.get(dividendUrl, {
        params,
        headers: {
          "User-Agent": this.userAgent,
          Accept: "application/json",
          Referer: "https://finance.yahoo.com/",
        },
        timeout: 10000,
      });

      if (response.data && response.data.chart && response.data.chart.result) {
        const result = response.data.chart.result[0];
        const events = result.events || {};
        const dividends = events.divs || {};

        const dividendHistory = Object.keys(dividends)
          .map((timestamp) => {
            const dividend = dividends[timestamp];
            return {
              date: new Date(parseInt(timestamp) * 1000).toISOString().split("T")[0],
              amount: dividend.amount,
              timestamp: parseInt(timestamp) * 1000,
            };
          })
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log(`✅ Yahoo Finance dividend history for ${symbol}: ${dividendHistory.length} payments`);
        return dividendHistory;
      }

      console.log(`✅ No dividend history found for ${symbol}`);
      return [];
    } catch (error) {
      console.error(`❌ Yahoo Finance dividend error for ${symbol}:`, error.message);
      return [];
    }
  }

  async getStockData(symbol) {
    try {
      console.log(`📊 Yahoo Finance getting complete data for: ${symbol}`);

      // Get all data in parallel
      const [quote, overview, dividendHistory] = await Promise.allSettled([this.getStockQuote(symbol), this.getCompanyOverview(symbol), this.getDividendHistory(symbol)]);

      const stockData = {
        symbol: symbol,
        quote: quote.status === "fulfilled" ? quote.value : null,
        overview: overview.status === "fulfilled" ? overview.value : null,
        dividendHistory: dividendHistory.status === "fulfilled" ? dividendHistory.value : [],
      };

      console.log(`✅ Yahoo Finance complete data for ${symbol}`);
      return stockData;
    } catch (error) {
      console.error(`❌ Yahoo Finance complete data error for ${symbol}:`, error.message);
      throw new Error(`Failed to get complete stock data: ${error.message}`);
    }
  }
}

module.exports = YahooFinanceScraper;

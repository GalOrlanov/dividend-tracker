const axios = require("axios");

class PolygonStockService {
  constructor() {
    this.apiKey = process.env.POLYGON_API_KEY || "bAPTz_El3ihlbFHkJ1mmuLEgoHb4zcz6";
    this.baseUrl = "https://api.polygon.io";
    console.log("🚀 Polygon Stock Service: Using Polygon API for reliable stock data");
  }

  async searchStocks(query) {
    try {
      const response = await axios.get(`${this.baseUrl}/v3/reference/tickers`, {
        params: {
          search: query,
          active: true,
          sort: "name",
          order: "asc",
          limit: 10, // Increased to 10 results
          apiKey: this.apiKey,
        },
        timeout: 5000, // Reduced timeout for faster response
      });

      if (response.data && response.data.results) {
        console.log("🚀 Polygon Stock Service: Search results:", response.data.results);
        // Get basic search results
        const basicResults = response.data.results.map((item) => ({
          symbol: item.ticker,
          companyName: item.name || "Unknown Company",
          sector: item.sic_description || "Unknown Sector",
          type: item.type || "Equity",
          region: item.locale || "US",
          currentPrice: 0, // Will be fetched separately
          dividendYield: 0,
          dividendPerShare: 0,
          payoutRatio: 0,
          exDividendDate: null,
        }));

        // Fetch prices and basic dividend data for all results (now limited to 5)
        const resultsWithPrices = [];
        for (let i = 0; i < basicResults.length; i++) {
          const result = basicResults[i];
          try {
            // Fetch both quote and basic dividend data in parallel for speed
            const [quote, dividendHistory] = await Promise.all([this.getStockQuote(result.symbol), this.getDividendHistory(result.symbol)]);

            if (quote && quote.price > 0) {
              result.currentPrice = quote.price;
              result.change = quote.change;
              result.changePercent = quote.changePercent;
            } else if (quote && quote.previousClose > 0) {
              // Use previous close if current price is not available
              result.currentPrice = quote.previousClose;
              result.change = quote.change || 0;
              result.changePercent = quote.changePercent || 0;
              result.isPreviousClose = true; // Flag to indicate this is previous close
            }

            // Calculate basic dividend data from history
            if (dividendHistory && dividendHistory.dividends && dividendHistory.dividends.length > 0) {
              const latestDividend = dividendHistory.dividends[0];
              result.dividendPerShare = latestDividend.amount || 0;

              // Calculate annual dividend based on frequency
              let annualDividend = result.dividendPerShare * 4; // Default quarterly
              if (dividendHistory.dividends.length >= 2) {
                const date1 = new Date(dividendHistory.dividends[0].date);
                const date2 = new Date(dividendHistory.dividends[1].date);
                const daysDiff = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);

                if (daysDiff <= 35) {
                  result.frequency = "monthly";
                  annualDividend = result.dividendPerShare * 12;
                } else if (daysDiff <= 95) {
                  result.frequency = "quarterly";
                  annualDividend = result.dividendPerShare * 4;
                } else if (daysDiff <= 185) {
                  result.frequency = "semi-annual";
                  annualDividend = result.dividendPerShare * 2;
                } else {
                  result.frequency = "annual";
                  annualDividend = result.dividendPerShare;
                }
              } else {
                // If only one dividend, default to quarterly
                result.frequency = "quarterly";
              }

              // Calculate dividend yield if we have price
              if (result.currentPrice > 0) {
                result.dividendYield = (annualDividend / result.currentPrice) * 100;
              }

              // Only keep frequency if there's actually a dividend yield
              if (result.dividendYield <= 0) {
                delete result.frequency;
                result.dividendPerShare = 0; // Reset dividend per share if no yield
              }
            }
          } catch (error) {
            console.log(`Failed to get data for ${result.symbol}:`, error.message);
          }
          // FINAL CHECK: Remove frequency if no yield
          if (!result.dividendYield || result.dividendYield <= 0) {
            delete result.frequency;
          }
          resultsWithPrices.push(result);
        }

        // No need to add remaining results since we're limited to 5 total

        // FINAL CLEANUP: Remove frequency if no yield for all results
        for (const result of resultsWithPrices) {
          if (!result.dividendYield || result.dividendYield <= 0) {
            delete result.frequency;
          }
        }

        return { count: resultsWithPrices.length, results: resultsWithPrices };
      }
      return { count: 0, results: [] };
    } catch (error) {
      console.error("Polygon search failed:", error.message);
      return { count: 0, results: [] };
    }
  }

  async getStockQuote(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}`, {
        params: {
          apiKey: this.apiKey,
        },
        timeout: 3000, // Reduced timeout for faster response
      });

      if (response.data && response.data.ticker) {
        const ticker = response.data.ticker;
        const day = ticker.day;
        const prevDay = ticker.prevDay;

        return {
          symbol: ticker.ticker,
          price: day?.c || 0,
          change: ticker.todaysChange || 0,
          changePercent: ticker.todaysChangePerc || 0,
          previousClose: prevDay?.c || 0,
          open: day?.o || 0,
          high: day?.h || 0,
          low: day?.l || 0,
          volume: day?.v || 0,
          marketCap: 0, // Polygon doesn't provide this in basic tier
        };
      }
      return null;
    } catch (error) {
      console.warn("Polygon quote failed:", error.message);
      // Return basic data if API fails
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

  async getCompanyOverview(symbol) {
    try {
      const [tickerResponse, dividendResponse] = await Promise.all([
        axios.get(`${this.baseUrl}/v3/reference/tickers/${symbol}`, {
          params: {
            apiKey: this.apiKey,
          },
          timeout: 10000,
        }),
        axios.get(`${this.baseUrl}/v3/reference/dividends`, {
          params: {
            ticker: symbol,
            limit: 4, // Get last 4 dividends
            apiKey: this.apiKey,
          },
          timeout: 10000,
        }),
      ]);

      if (tickerResponse.data && tickerResponse.data.results) {
        const result = tickerResponse.data.results;

        // Calculate dividend data
        let dividendPerShare = 0;
        let dividendYield = 0;
        let payoutFrequency = "quarterly";
        let annualDividend = 0;

        if (dividendResponse.data && dividendResponse.data.results && dividendResponse.data.results.length > 0) {
          const dividends = dividendResponse.data.results;
          const latestDividend = dividends[0]; // Most recent dividend
          dividendPerShare = latestDividend.cash_amount || 0;

          // Determine frequency based on dividend dates
          if (dividends.length >= 2) {
            const date1 = new Date(dividends[0].pay_date);
            const date2 = new Date(dividends[1].pay_date);
            const daysDiff = Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);

            if (daysDiff <= 35) {
              payoutFrequency = "monthly";
              annualDividend = dividendPerShare * 12;
            } else if (daysDiff <= 95) {
              payoutFrequency = "quarterly";
              annualDividend = dividendPerShare * 4;
            } else if (daysDiff <= 185) {
              payoutFrequency = "semi-annual";
              annualDividend = dividendPerShare * 2;
            } else {
              payoutFrequency = "annual";
              annualDividend = dividendPerShare;
            }
          } else {
            // Default to quarterly if we only have one dividend
            annualDividend = dividendPerShare * 4;
          }

          // Get current price to calculate yield
          try {
            const quote = await this.getStockQuote(symbol);
            const currentPrice = quote?.price > 0 ? quote.price : quote?.previousClose || 0;
            if (currentPrice > 0) {
              dividendYield = (annualDividend / currentPrice) * 100;
            }
          } catch (error) {
            console.log(`Could not get price for dividend yield calculation: ${error.message}`);
          }
        }

        return {
          symbol: result.ticker,
          companyName: result.name || "Unknown Company",
          sector: result.sic_description || "Unknown Sector",
          industry: result.sic_description || "Unknown Industry",
          description: result.description || "No description available",
          marketCap: result.market_cap || 0,
          peRatio: 0, // Polygon doesn't provide this in basic tier
          dividendYield: dividendYield,
          dividendPerShare: dividendPerShare,
          payoutRatio: 0,
          payoutFrequency: payoutFrequency,
          beta: 0,
          website: result.homepage_url || "",
          employees: result.total_employees || 0,
        };
      }
      return null;
    } catch (error) {
      console.warn("Polygon overview failed:", error.message);
      return null;
    }
  }

  async getDividendHistory(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/v3/reference/dividends`, {
        params: {
          ticker: symbol,
          limit: 4, // Limit to 4 most recent dividends for faster response
          apiKey: this.apiKey,
        },
        timeout: 3000, // Reduced timeout for faster response
      });

      if (response.data && response.data.results) {
        const dividends = response.data.results.map((div) => ({
          date: div.pay_date,
          amount: div.cash_amount,
          exDate: div.ex_dividend_date,
          recordDate: div.record_date,
          declarationDate: div.declaration_date,
        }));

        const totalDividends = dividends.reduce((sum, div) => sum + div.amount, 0);
        const averageDividend = dividends.length > 0 ? totalDividends / dividends.length : 0;

        return {
          symbol: symbol,
          dividends: dividends,
          totalDividends: totalDividends,
          averageDividend: averageDividend,
        };
      }
      return {
        symbol: symbol,
        dividends: [],
        totalDividends: 0,
        averageDividend: 0,
      };
    } catch (error) {
      console.warn("Polygon dividend history failed:", error.message);
      return {
        symbol: symbol,
        dividends: [],
        totalDividends: 0,
        averageDividend: 0,
      };
    }
  }

  async getStockData(symbol) {
    try {
      const [quote, overview, dividendHistory] = await Promise.all([this.getStockQuote(symbol), this.getCompanyOverview(symbol), this.getDividendHistory(symbol)]);

      return {
        symbol: symbol,
        quote: quote,
        overview: overview,
        dividendHistory: dividendHistory,
      };
    } catch (error) {
      console.error("Polygon stock data failed:", error.message);
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

  async getPriceHistory(symbol, timeframe = "1m") {
    try {
      // Calculate date range based on timeframe
      const now = new Date();
      let from, to, multiplier, timespan;

      switch (timeframe) {
        case "7d":
          from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          to = now;
          multiplier = 1;
          timespan = "day";
          break;
        case "1m":
          from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          to = now;
          multiplier = 1;
          timespan = "day";
          break;
        case "3m":
          from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          to = now;
          multiplier = 1;
          timespan = "day";
          break;
        case "6m":
          from = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          to = now;
          multiplier = 1;
          timespan = "day";
          break;
        case "1y":
          from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          to = now;
          multiplier = 1;
          timespan = "day";
          break;
        case "5y":
          from = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
          to = now;
          multiplier = 7;
          timespan = "week";
          break;
        case "all":
          from = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
          to = now;
          multiplier = 30;
          timespan = "month";
          break;
        default:
          from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          to = now;
          multiplier = 1;
          timespan = "day";
      }

      const response = await axios.get(`${this.baseUrl}/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from.toISOString().split("T")[0]}/${to.toISOString().split("T")[0]}`, {
        params: {
          adjusted: true,
          sort: "asc",
          limit: 5000,
          apiKey: this.apiKey,
        },
        timeout: 10000,
      });

      if (response.data && response.data.results) {
        const priceData = response.data.results.map((item) => ({
          date: new Date(item.t).toISOString().split("T")[0],
          price: parseFloat(item.c.toFixed(2)), // Close price
          open: parseFloat(item.o.toFixed(2)),
          high: parseFloat(item.h.toFixed(2)),
          low: parseFloat(item.l.toFixed(2)),
          volume: item.v,
        }));

        return {
          symbol: symbol,
          timeframe: timeframe,
          data: priceData,
          count: priceData.length,
        };
      }

      return {
        symbol: symbol,
        timeframe: timeframe,
        data: [],
        count: 0,
      };
    } catch (error) {
      console.warn("Polygon price history failed:", error.message);
      // Return empty data if API fails
      return {
        symbol: symbol,
        timeframe: timeframe,
        data: [],
        count: 0,
      };
    }
  }
}

module.exports = PolygonStockService;

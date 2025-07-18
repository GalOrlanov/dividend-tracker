// API Configuration for Stock Data Services
module.exports = {
  // Environment configuration
  environment: {
    useMockData: false, // Disable mock data
    useRealApis: true, // Use real APIs
  },

  // Alpha Vantage API (Rate limited - 25 requests/day free)
  alphaVantage: {
    enabled: false, // Disabled due to rate limits
    apiKey: process.env.ALPHA_VANTAGE_API_KEY || "85Z2PRWBZG3W3SST",
    baseURL: "https://www.alphavantage.co/query",
    rateLimit: 25, // requests per day
  },

  // Yahoo Finance API (Free, but rate limited)
  yahooFinance: {
    enabled: false, // Disabled due to rate limits
    baseURL: "https://query1.finance.yahoo.com",
    rateLimit: 2000, // requests per hour
    timeout: 10000,
  },

  // Finnhub API (Free - 60 requests/minute)
  finnhub: {
    enabled: false, // Disabled - need valid API key
    apiKey: process.env.FINNHUB_API_KEY || "YOUR_FINNHUB_API_KEY",
    baseURL: "https://finnhub.io/api/v1",
    rateLimit: 60, // requests per minute
    timeout: 10000,
  },

  // Polygon.io API (Free - 5 requests/minute)
  polygon: {
    enabled: true, // Enable Polygon API
    apiKey: process.env.POLYGON_API_KEY || "bAPTz_El3ihlbFHkJ1mmuLEgoHb4zcz6",
    baseURL: "https://api.polygon.io",
    rateLimit: 5, // requests per minute
    timeout: 10000,
  },

  // IEX Cloud API (Free - 50,000 messages/month)
  iexCloud: {
    enabled: false, // Disabled - need valid API key
    apiKey: process.env.IEX_CLOUD_API_KEY || "YOUR_IEX_CLOUD_API_KEY",
    baseURL: "https://cloud.iexapis.com/stable",
    rateLimit: 50000, // messages per month
    timeout: 10000,
  },

  // Mock data configuration
  mockData: {
    enabled: false, // Disable mock data
    realisticData: true,
    includeDividendHistory: true,
  },

  // How to get your own API keys:
  instructions: {
    alphaVantage: "https://www.alphavantage.co/support/#api-key",
    finnhub: "https://finnhub.io/register",
    polygon: "https://polygon.io/",
    iexCloud: "https://iexcloud.io/cloud-login#/register",
  },
};

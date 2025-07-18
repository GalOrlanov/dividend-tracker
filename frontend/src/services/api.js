import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiConfig from "../config/api";

const API_BASE_URL = `${apiConfig.API_BASE_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Initialize auth token
const initializeAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Error loading auth token:", error);
  }
};

// Initialize token on startup
initializeAuthToken();

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Ensure token is loaded for each request
    try {
      const token = await AsyncStorage.getItem("token");
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error loading token in interceptor:", error);
    }

    console.log("🚀 API Request:", {
      method: config.method?.toUpperCase(),
      url: config.url,
      params: config.params,
      data: config.data,
      headers: config.headers,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
    });
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", {
      status: response.status,
      url: response.config.url,
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  async (error) => {
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log("🔐 Authentication error, clearing token");
      try {
        await AsyncStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
      } catch (storageError) {
        console.error("Error clearing token:", storageError);
      }
    }

    console.error("❌ API Error:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    return Promise.reject(error);
  }
);

// Dividend API calls
export const dividendAPI = {
  // Get all dividends
  getDividends: (params = {}) => api.get("/dividends", { params }),

  // Get monthly dividend summary
  getMonthlyDividends: (year) => api.get("/dividends/monthly", { params: { year } }),

  // Get dividend by ID
  getDividend: (id) => api.get(`/dividends/${id}`),

  // Create new dividend
  createDividend: (data) => api.post("/dividends", data),

  // Update dividend
  updateDividend: (id, data) => api.put(`/dividends/${id}`, data),

  // Delete dividend
  deleteDividend: (id) => api.delete(`/dividends/${id}`),

  // Get upcoming dividends
  getUpcomingDividends: () => api.get("/dividends/upcoming/next"),
};

// Stock API calls
export const stockAPI = {
  // Search stocks
  searchStocks: (params = {}) => api.get("/stocks/search", { params }),

  // Get all stocks
  getStocks: (params = {}) => api.get("/stocks", { params }),

  // Get stock by symbol
  getStock: (symbol) => api.get(`/stocks/${symbol}`),

  // Create new stock
  createStock: (data) => api.post("/stocks", data),

  // Update stock
  updateStock: (symbol, data) => api.put(`/stocks/${symbol}`, data),

  // Delete stock
  deleteStock: (symbol) => api.delete(`/stocks/${symbol}`),

  // Get sectors
  getSectors: () => api.get("/stocks/sectors/list"),

  // Get top dividend yield stocks
  getTopYieldStocks: (limit = 10) => api.get("/stocks/top/yield", { params: { limit } }),
};

// Market Data API calls (Real-time data)
export const marketDataAPI = {
  // Get real-time stock quote
  getStockQuote: (symbol) => api.get(`/market/quote/${symbol}`),

  // Get company overview
  getCompanyOverview: (symbol) => api.get(`/market/overview/${symbol}`),

  // Search stocks
  searchStocks: (query) => api.get("/market/search", { params: { q: query } }),

  // Get detailed stock data (price, dividend yield, frequency)
  getStockDetails: (symbol) => api.get(`/market/stock-details/${symbol}`),

  // Get full stock data (quote + overview + dividend history)
  getFullStockData: (symbol) => api.get(`/market/full-stock-data/${symbol}`),

  // Get dividend history for a stock
  getDividendHistory: (symbol) => api.get(`/market/dividend-history/${symbol}`),

  // Get historical price data for charts
  getPriceHistory: (symbol, timeframe = "1m") => api.get(`/market/price-history/${symbol}`, { params: { timeframe } }),

  // Get top gainers and losers
  getTopMovers: () => api.get("/market/top-movers"),

  // Get dividend calendar
  getDividendCalendar: () => api.get("/market/dividend-calendar"),

  // Get popular dividend stocks
  getPopularDividends: () => api.get("/market/popular-dividends"),
};

// Portfolio API calls
export const portfolioAPI = {
  // Get portfolio
  getPortfolio: () => api.get("/portfolio"),

  // Add stock to portfolio
  addStock: (data) => api.post("/portfolio", data),

  // Update stock in portfolio
  updateStock: (id, data) => api.put(`/portfolio/${id}`, data),

  // Delete stock from portfolio
  deleteStock: (id) => api.delete(`/portfolio/${id}`),

  // Refresh stock data
  refreshStock: (id) => api.post(`/portfolio/refresh/${id}`),

  // Get individual purchases for a stock
  getStockPurchases: (symbol) => api.get(`/portfolio/purchases/${symbol}`),

  // Get dividend history
  getDividendHistory: () => api.get("/portfolio/dividend-history"),

  // Get dividend chart data (aggregated by month)
  getDividendChartData: (year) => api.get("/portfolio/dividend-chart-data", { params: { year } }),

  // Get dividend data for specific month (for bar press)
  getDividendMonthData: (year, month) => api.get("/portfolio/dividend-month-data", { params: { year, month } }),

  // Get upcoming dividend payouts
  getUpcomingPayouts: async () => {
    return await api.get("/portfolio/upcoming-payouts");
  },

  // Generate future dividends
  generateFutureDividends: async () => {
    return await api.post("/portfolio/generate-future-dividends");
  },

  // Regenerate all dividend data
  regenerateDividends: async () => {
    return await api.post("/portfolio/regenerate-dividends");
  },

  // Refresh all portfolio data (prices, dividend yields, etc.)
  refreshAll: async () => {
    return await api.post("/portfolio/refresh-all");
  },
};

// Health check
export const healthCheck = () => api.get("/health");

export default api;

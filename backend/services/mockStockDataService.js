// Mock Stock Data Service for testing when Alpha Vantage API is rate limited
class MockStockDataService {
  constructor() {
    this.mockStocks = [
      {
        symbol: "AAPL",
        companyName: "Apple Inc.",
        type: "Equity",
        region: "United States",
        marketOpen: "09:30",
        marketClose: "16:00",
        timezone: "UTC-04",
        currency: "USD",
        currentPrice: 175.43,
        dividendYield: 0.52,
        dividendPerShare: 0.92,
        sector: "Technology",
        payoutRatio: 15.8,
        frequency: "Quarterly",
        exDividendDate: "2024-02-09",
      },
      {
        symbol: "MSFT",
        companyName: "Microsoft Corporation",
        type: "Equity",
        region: "United States",
        marketOpen: "09:30",
        marketClose: "16:00",
        timezone: "UTC-04",
        currency: "USD",
        currentPrice: 378.85,
        dividendYield: 0.78,
        dividendPerShare: 2.96,
        sector: "Technology",
        payoutRatio: 28.5,
        frequency: "Quarterly",
        exDividendDate: "2024-02-14",
      },
      {
        symbol: "O",
        companyName: "Realty Income Corp",
        type: "Equity",
        region: "United States",
        marketOpen: "09:30",
        marketClose: "16:00",
        timezone: "UTC-04",
        currency: "USD",
        currentPrice: 56.78,
        dividendYield: 5.23,
        dividendPerShare: 2.97,
        sector: "Real Estate",
        payoutRatio: 75.2,
        frequency: "Monthly",
        exDividendDate: "2024-02-12",
      },
      {
        symbol: "JNJ",
        companyName: "Johnson & Johnson",
        type: "Equity",
        region: "United States",
        marketOpen: "09:30",
        marketClose: "16:00",
        timezone: "UTC-04",
        currency: "USD",
        currentPrice: 162.34,
        dividendYield: 2.98,
        dividendPerShare: 4.84,
        sector: "Healthcare",
        payoutRatio: 43.7,
        frequency: "Quarterly",
        exDividendDate: "2024-02-15",
      },
      {
        symbol: "PG",
        companyName: "Procter & Gamble Co",
        type: "Equity",
        region: "United States",
        marketOpen: "09:30",
        marketClose: "16:00",
        timezone: "UTC-04",
        currency: "USD",
        currentPrice: 158.92,
        dividendYield: 2.45,
        dividendPerShare: 3.89,
        sector: "Consumer Defensive",
        payoutRatio: 58.9,
        frequency: "Quarterly",
        exDividendDate: "2024-02-20",
      },
      {
        symbol: "KO",
        companyName: "Coca-Cola Co",
        type: "Equity",
        region: "United States",
        marketOpen: "09:30",
        marketClose: "16:00",
        timezone: "UTC-04",
        currency: "USD",
        currentPrice: 59.87,
        dividendYield: 3.12,
        dividendPerShare: 1.86,
        sector: "Consumer Defensive",
        payoutRatio: 67.3,
        frequency: "Quarterly",
        exDividendDate: "2024-02-22",
      },
      {
        symbol: "PEP",
        companyName: "PepsiCo Inc",
        type: "Equity",
        region: "United States",
        marketOpen: "09:30",
        marketClose: "16:00",
        timezone: "UTC-04",
        currency: "USD",
        currentPrice: 168.45,
        dividendYield: 2.89,
        dividendPerShare: 4.87,
        sector: "Consumer Defensive",
        payoutRatio: 62.1,
        frequency: "Quarterly",
        exDividendDate: "2024-02-25",
      },
      {
        symbol: "VZ",
        companyName: "Verizon Communications Inc",
        type: "Equity",
        region: "United States",
        marketOpen: "09:30",
        marketClose: "16:00",
        timezone: "UTC-04",
        currency: "USD",
        currentPrice: 42.18,
        dividendYield: 6.78,
        dividendPerShare: 2.86,
        sector: "Communication Services",
        payoutRatio: 52.4,
        frequency: "Quarterly",
        exDividendDate: "2024-02-28",
      },
    ];
  }

  // Mock search for stocks
  async searchStocks(keywords) {
    console.log("🔍 MockStockDataService.searchStocks called with:", keywords);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const searchTerm = keywords.toLowerCase();
    const matches = this.mockStocks.filter(
      (stock) => stock.symbol.toLowerCase().includes(searchTerm) || stock.companyName.toLowerCase().includes(searchTerm) || stock.sector.toLowerCase().includes(searchTerm)
    );

    console.log("✅ Mock search results:", matches.length, "matches found");
    return matches;
  }

  // Mock stock quote
  async getStockQuote(symbol) {
    console.log("🔍 MockStockDataService.getStockQuote called with:", symbol);

    await new Promise((resolve) => setTimeout(resolve, 300));

    const stock = this.mockStocks.find((s) => s.symbol === symbol.toUpperCase());
    if (!stock) {
      throw new Error("Stock not found");
    }

    return {
      symbol: stock.symbol,
      currentPrice: stock.currentPrice,
      change: (Math.random() - 0.5) * 2, // Random change
      changePercent: ((Math.random() - 0.5) * 2).toFixed(2),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      previousClose: stock.currentPrice - (Math.random() - 0.5) * 2,
      open: stock.currentPrice - (Math.random() - 0.5) * 1,
      high: stock.currentPrice + Math.random() * 2,
      low: stock.currentPrice - Math.random() * 2,
      lastUpdated: new Date().toISOString().split("T")[0],
    };
  }

  // Mock company overview
  async getCompanyOverview(symbol) {
    console.log("🔍 MockStockDataService.getCompanyOverview called with:", symbol);

    await new Promise((resolve) => setTimeout(resolve, 400));

    const stock = this.mockStocks.find((s) => s.symbol === symbol.toUpperCase());
    if (!stock) {
      throw new Error("Company not found");
    }

    return {
      symbol: stock.symbol,
      companyName: stock.companyName,
      description: `${stock.companyName} is a leading company in the ${stock.sector} sector.`,
      sector: stock.sector,
      industry: `${stock.sector} Industry`,
      marketCap: Math.floor(Math.random() * 1000000000000) + 10000000000,
      peRatio: (Math.random() * 30 + 10).toFixed(2),
      dividendYield: stock.dividendYield,
      dividendPerShare: stock.dividendPerShare,
      payoutRatio: stock.payoutRatio,
      exDividendDate: stock.exDividendDate,
      website: `https://www.${stock.symbol.toLowerCase()}.com`,
      address: "123 Main St, New York, NY 10001",
      country: "United States",
    };
  }

  // Mock full stock data
  async getFullStockData(symbol) {
    console.log("🔍 MockStockDataService.getFullStockData called with:", symbol);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const stock = this.mockStocks.find((s) => s.symbol === symbol.toUpperCase());
    if (!stock) {
      throw new Error("Stock not found");
    }

    return {
      ...stock,
      change: (Math.random() - 0.5) * 2,
      changePercent: ((Math.random() - 0.5) * 2).toFixed(2),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      previousClose: stock.currentPrice - (Math.random() - 0.5) * 2,
      open: stock.currentPrice - (Math.random() - 0.5) * 1,
      high: stock.currentPrice + Math.random() * 2,
      low: stock.currentPrice - Math.random() * 2,
      lastUpdated: new Date().toISOString().split("T")[0],
      description: `${stock.companyName} is a leading company in the ${stock.sector} sector.`,
      industry: `${stock.sector} Industry`,
      marketCap: Math.floor(Math.random() * 1000000000000) + 10000000000,
      peRatio: (Math.random() * 30 + 10).toFixed(2),
      website: `https://www.${stock.symbol.toLowerCase()}.com`,
      address: "123 Main St, New York, NY 10001",
      country: "United States",
    };
  }

  // Mock top movers
  async getTopMovers() {
    console.log("🔍 MockStockDataService.getTopMovers called");

    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      topGainers: this.mockStocks.slice(0, 3).map((stock) => ({
        ticker: stock.symbol,
        price: stock.currentPrice,
        change_amount: (Math.random() * 5).toFixed(2),
        change_percentage: (Math.random() * 10).toFixed(2),
      })),
      topLosers: this.mockStocks.slice(3, 6).map((stock) => ({
        ticker: stock.symbol,
        price: stock.currentPrice,
        change_amount: (-Math.random() * 5).toFixed(2),
        change_percentage: (-Math.random() * 10).toFixed(2),
      })),
    };
  }

  // Mock dividend calendar
  async getDividendCalendar() {
    console.log("🔍 MockStockDataService.getDividendCalendar called");

    await new Promise((resolve) => setTimeout(resolve, 300));

    return this.mockStocks.map((stock) => ({
      symbol: stock.symbol,
      company: stock.companyName,
      ex_dividend_date: stock.exDividendDate,
      dividend_amount: stock.dividendPerShare,
      payment_date: new Date(new Date(stock.exDividendDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    }));
  }

  // Mock detailed stock data for portfolio view
  async getStockDetails(symbol) {
    console.log("🔍 MockStockDataService.getStockDetails called with:", symbol);

    await new Promise((resolve) => setTimeout(resolve, 400));

    const stock = this.mockStocks.find((s) => s.symbol === symbol.toUpperCase());
    if (!stock) {
      throw new Error("Stock not found");
    }

    return {
      ...stock,
      marketCap: Math.floor(Math.random() * 1000000000000) + 10000000000,
      peRatio: (Math.random() * 30 + 10).toFixed(2),
      beta: (Math.random() * 2 + 0.5).toFixed(2),
      fiftyTwoWeekHigh: stock.currentPrice * (1 + Math.random() * 0.3),
      fiftyTwoWeekLow: stock.currentPrice * (1 - Math.random() * 0.3),
      avgVolume: Math.floor(Math.random() * 10000000) + 1000000,
      dividendGrowthRate: (Math.random() * 10 + 2).toFixed(2),
      payoutRatio: stock.payoutRatio,
      nextDividendDate: this.getNextDividendDate(stock.exDividendDate, stock.frequency),
      dividendGrowthYears: Math.floor(Math.random() * 20) + 5,
      sector: stock.sector,
      industry: this.getIndustry(stock.sector),
      employees: Math.floor(Math.random() * 100000) + 1000,
      website: `https://www.${stock.symbol.toLowerCase()}.com`,
      ceo: this.getRandomCEO(),
      founded: Math.floor(Math.random() * 100) + 1900,
    };
  }

  // Mock dividend history
  async getDividendHistory(symbol) {
    console.log("🔍 MockStockDataService.getDividendHistory called with:", symbol);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const stock = this.mockStocks.find((s) => s.symbol === symbol.toUpperCase());
    if (!stock) {
      throw new Error("Stock not found");
    }

    const history = [];
    const today = new Date();
    const baseAmount = stock.dividendPerShare;
    const frequency = stock.frequency;
    const monthsPerPayment = frequency === "Monthly" ? 1 : frequency === "Quarterly" ? 3 : 6;

    // Generate 2 years of dividend history
    for (let i = 24; i >= 0; i--) {
      const paymentDate = new Date(today);
      paymentDate.setMonth(paymentDate.getMonth() - i * monthsPerPayment);

      // Add some variation to dividend amounts
      const variation = 1 + (Math.random() - 0.5) * 0.1; // ±5% variation
      const amount = baseAmount * variation;

      history.push({
        date: paymentDate.toISOString().split("T")[0],
        amount: parseFloat(amount.toFixed(2)),
        type: "Dividend",
        frequency: frequency,
      });
    }

    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  // Helper methods
  getNextDividendDate(exDate, frequency) {
    const lastExDate = new Date(exDate);
    const monthsPerPayment = frequency === "Monthly" ? 1 : frequency === "Quarterly" ? 3 : 6;
    const nextDate = new Date(lastExDate);
    nextDate.setMonth(nextDate.getMonth() + monthsPerPayment);
    return nextDate.toISOString().split("T")[0];
  }

  getIndustry(sector) {
    const industries = {
      Technology: "Software & IT Services",
      Healthcare: "Pharmaceuticals",
      "Consumer Defensive": "Consumer Goods",
      "Real Estate": "REITs",
      "Communication Services": "Telecommunications",
      "Financial Services": "Banking",
      Energy: "Oil & Gas",
      Industrials: "Manufacturing",
    };
    return industries[sector] || "General";
  }

  getRandomCEO() {
    const ceos = ["Tim Cook", "Satya Nadella", "Jamie Dimon", "Warren Buffett", "Elon Musk", "Jeff Bezos", "Mark Zuckerberg", "Sundar Pichai"];
    return ceos[Math.floor(Math.random() * ceos.length)];
  }
}

module.exports = MockStockDataService;

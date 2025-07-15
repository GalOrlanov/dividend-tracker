const mongoose = require("mongoose");
const Dividend = require("./models/Dividend");
const Stock = require("./models/Stock");

const uri = "mongodb+srv://gal:12321@cluster0-7hpz1.gcp.mongodb.net/DividendTracker?retryWrites=true&w=majority";

// Sample stock data
const sampleStocks = [
  {
    symbol: "AAPL",
    companyName: "Apple Inc.",
    sector: "Technology",
    industry: "Consumer Electronics",
    currentPrice: 150.0,
    dividendYield: 0.5,
    dividendPerShare: 0.24,
    payoutRatio: 15.8,
    frequency: "quarterly",
    description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.",
    website: "https://www.apple.com",
  },
  {
    symbol: "MSFT",
    companyName: "Microsoft Corporation",
    sector: "Technology",
    industry: "Software",
    currentPrice: 300.0,
    dividendYield: 0.8,
    dividendPerShare: 0.75,
    payoutRatio: 25.2,
    frequency: "quarterly",
    description: "Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.",
    website: "https://www.microsoft.com",
  },
  {
    symbol: "JNJ",
    companyName: "Johnson & Johnson",
    sector: "Healthcare",
    industry: "Pharmaceuticals",
    currentPrice: 160.0,
    dividendYield: 2.8,
    dividendPerShare: 1.19,
    payoutRatio: 43.5,
    frequency: "quarterly",
    description: "Johnson & Johnson researches, develops, manufactures, and sells various products in the healthcare field worldwide.",
    website: "https://www.jnj.com",
  },
  {
    symbol: "PG",
    companyName: "Procter & Gamble Co.",
    sector: "Consumer Defensive",
    industry: "Household & Personal Products",
    currentPrice: 140.0,
    dividendYield: 2.4,
    dividendPerShare: 0.94,
    payoutRatio: 58.2,
    frequency: "quarterly",
    description:
      "The Procter & Gamble Company provides branded consumer packaged goods to consumers in North and Latin America, Europe, the Asia Pacific, Greater China, India, the Middle East, and Africa.",
    website: "https://www.pg.com",
  },
  {
    symbol: "KO",
    companyName: "Coca-Cola Company",
    sector: "Consumer Defensive",
    industry: "Beverages",
    currentPrice: 55.0,
    dividendYield: 3.1,
    dividendPerShare: 0.44,
    payoutRatio: 65.8,
    frequency: "quarterly",
    description: "The Coca-Cola Company is a beverage company that manufactures and distributes various nonalcoholic beverages worldwide.",
    website: "https://www.coca-cola.com",
  },
  {
    symbol: "PEP",
    companyName: "PepsiCo Inc.",
    sector: "Consumer Defensive",
    industry: "Beverages",
    currentPrice: 170.0,
    dividendYield: 2.9,
    dividendPerShare: 1.15,
    payoutRatio: 55.3,
    frequency: "quarterly",
    description: "PepsiCo, Inc. manufactures, markets, distributes, and sells various beverages and convenient foods worldwide.",
    website: "https://www.pepsico.com",
  },
  {
    symbol: "VZ",
    companyName: "Verizon Communications",
    sector: "Communication Services",
    industry: "Telecom Services",
    currentPrice: 40.0,
    dividendYield: 6.8,
    dividendPerShare: 0.65,
    payoutRatio: 52.4,
    frequency: "quarterly",
    description: "Verizon Communications Inc. offers communications, information, and entertainment products and services to consumers, businesses, and governmental entities worldwide.",
    website: "https://www.verizon.com",
  },
  {
    symbol: "T",
    companyName: "AT&T Inc.",
    sector: "Communication Services",
    industry: "Telecom Services",
    currentPrice: 15.0,
    dividendYield: 7.2,
    dividendPerShare: 0.28,
    payoutRatio: 45.6,
    frequency: "quarterly",
    description: "AT&T Inc. provides telecommunications, media, and technology services worldwide.",
    website: "https://www.att.com",
  },
];

// Sample dividend data
const sampleDividends = [
  {
    symbol: "AAPL",
    companyName: "Apple Inc.",
    shares: 100,
    dividendPerShare: 0.24,
    totalDividend: 24.0,
    exDate: new Date("2024-02-09"),
    paymentDate: new Date("2024-02-15"),
    frequency: "quarterly",
    sector: "Technology",
    notes: "Q1 2024 dividend payment",
  },
  {
    symbol: "MSFT",
    companyName: "Microsoft Corporation",
    shares: 50,
    dividendPerShare: 0.75,
    totalDividend: 37.5,
    exDate: new Date("2024-02-14"),
    paymentDate: new Date("2024-03-14"),
    frequency: "quarterly",
    sector: "Technology",
    notes: "Q1 2024 dividend payment",
  },
  {
    symbol: "JNJ",
    companyName: "Johnson & Johnson",
    shares: 75,
    dividendPerShare: 1.19,
    totalDividend: 89.25,
    exDate: new Date("2024-02-20"),
    paymentDate: new Date("2024-03-05"),
    frequency: "quarterly",
    sector: "Healthcare",
    notes: "Q1 2024 dividend payment",
  },
  {
    symbol: "PG",
    companyName: "Procter & Gamble Co.",
    shares: 60,
    dividendPerShare: 0.94,
    totalDividend: 56.4,
    exDate: new Date("2024-01-18"),
    paymentDate: new Date("2024-02-15"),
    frequency: "quarterly",
    sector: "Consumer Defensive",
    notes: "Q2 2024 dividend payment",
  },
  {
    symbol: "KO",
    companyName: "Coca-Cola Company",
    shares: 120,
    dividendPerShare: 0.44,
    totalDividend: 52.8,
    exDate: new Date("2024-02-15"),
    paymentDate: new Date("2024-04-01"),
    frequency: "quarterly",
    sector: "Consumer Defensive",
    notes: "Q1 2024 dividend payment",
  },
  {
    symbol: "VZ",
    companyName: "Verizon Communications",
    shares: 200,
    dividendPerShare: 0.65,
    totalDividend: 130.0,
    exDate: new Date("2024-01-09"),
    paymentDate: new Date("2024-02-01"),
    frequency: "quarterly",
    sector: "Communication Services",
    notes: "Q4 2023 dividend payment",
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Clear existing data
    await Dividend.deleteMany({});
    await Stock.deleteMany({});
    console.log("Cleared existing data");

    // Insert sample stocks
    //const stocks = await Stock.insertMany(sampleStocks);
    console.log(`Inserted ${stocks.length} stocks`);

    // Insert sample dividends
    //const dividends = await Dividend.insertMany(sampleDividends);
    console.log(`Inserted ${dividends.length} dividends`);

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();

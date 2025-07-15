const mongoose = require("mongoose");
const Portfolio = require("./models/Portfolio");
const DividendHistory = require("./models/DividendHistory");
require("dotenv").config();

async function cleanupOrphanedDividends() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://gal:12321@cluster0-7hpz1.gcp.mongodb.net/DividendTracker?retryWrites=true&w=majority");
    console.log("✅ Connected to MongoDB");

    // Get all portfolio symbols
    const portfolioStocks = await Portfolio.find({}, "symbol");
    const portfolioSymbols = portfolioStocks.map((stock) => stock.symbol);

    console.log(`📊 Found ${portfolioSymbols.length} stocks in portfolio:`, portfolioSymbols);

    // Find dividend entries for stocks not in portfolio
    const orphanedDividends = await DividendHistory.find({
      symbol: { $nin: portfolioSymbols },
    });

    console.log(`🔍 Found ${orphanedDividends.length} orphaned dividend entries`);

    if (orphanedDividends.length > 0) {
      // Group by symbol for better reporting
      const groupedOrphans = {};
      orphanedDividends.forEach((dividend) => {
        if (!groupedOrphans[dividend.symbol]) {
          groupedOrphans[dividend.symbol] = [];
        }
        groupedOrphans[dividend.symbol].push(dividend);
      });

      console.log("🗑️  Orphaned dividend entries by symbol:");
      Object.keys(groupedOrphans).forEach((symbol) => {
        console.log(`   ${symbol}: ${groupedOrphans[symbol].length} entries`);
      });

      // Delete orphaned dividend entries
      const result = await DividendHistory.deleteMany({
        symbol: { $nin: portfolioSymbols },
      });

      console.log(`✅ Deleted ${result.deletedCount} orphaned dividend entries`);
    } else {
      console.log("✅ No orphaned dividend entries found");
    }

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error cleaning up orphaned dividends:", error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupOrphanedDividends();

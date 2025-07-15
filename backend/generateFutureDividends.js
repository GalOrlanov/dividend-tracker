const mongoose = require("mongoose");
const Portfolio = require("./models/Portfolio");
const DividendHistory = require("./models/DividendHistory");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/dividend-tracker", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
  generateFutureDividends();
});

async function generateFutureDividends() {
  try {
    console.log("🚀 Starting future dividend generation...");

    // Get all stocks from portfolio
    const portfolio = await Portfolio.find({});
    console.log(`📊 Found ${portfolio.length} stocks in portfolio`);

    if (portfolio.length === 0) {
      console.log("❌ No stocks found in portfolio");
      return;
    }

    const currentYear = new Date().getFullYear();
    const yearsToGenerate = [currentYear, currentYear + 1]; // 2025, 2026
    let totalGenerated = 0;
    let totalSkipped = 0;

    for (const stock of portfolio) {
      console.log(`\n📈 Processing ${stock.symbol} (${stock.companyName})...`);

      // Skip if no dividend data
      if (!stock.dividendPerShare || stock.dividendPerShare <= 0) {
        console.log(`   ⚠️  No dividend data for ${stock.symbol}, skipping`);
        continue;
      }

      const purchaseDate = new Date(stock.purchaseDate);
      const shares = stock.shares;
      const dividendPerShare = stock.dividendPerShare;
      const payoutFrequency = stock.payoutFrequency || "quarterly"; // Default to quarterly

      console.log(`   💰 Dividend: $${dividendPerShare}/share, ${payoutFrequency}, ${shares} shares`);

      // Generate dividend dates based on frequency
      const dividendDates = getDividendDates(payoutFrequency, yearsToGenerate, purchaseDate);

      for (const dividendDate of dividendDates) {
        const year = dividendDate.getFullYear();
        const month = dividendDate.getMonth() + 1; // Convert to 1-based month

        // Check if dividend entry already exists
        const existingEntry = await DividendHistory.findOne({
          symbol: stock.symbol,
          year: year,
          month: month,
        });

        if (existingEntry) {
          console.log(`   ⏭️  Skipping ${year}-${month.toString().padStart(2, "0")} (already exists)`);
          totalSkipped++;
          continue;
        }

        // Calculate payment date (typically 2-4 weeks after ex-dividend)
        const paymentDate = new Date(dividendDate);
        paymentDate.setDate(paymentDate.getDate() + 21); // 3 weeks after ex-dividend

        // Calculate total amount
        const totalAmount = dividendPerShare * shares;

        // Determine quarter
        const quarter = Math.ceil(month / 3);

        // Create dividend history entry
        const dividendEntry = new DividendHistory({
          symbol: stock.symbol,
          companyName: stock.companyName,
          shares: shares,
          dividendPerShare: dividendPerShare,
          totalAmount: totalAmount,
          year: year,
          month: month,
          quarter: quarter,
          payoutFrequency: payoutFrequency,
          exDividendDate: dividendDate,
          paymentDate: paymentDate,
        });

        await dividendEntry.save();
        console.log(`   ✅ Generated ${year}-${month.toString().padStart(2, "0")}: $${totalAmount.toFixed(2)}`);
        totalGenerated++;
      }
    }

    console.log(`\n🎉 Future dividend generation complete!`);
    console.log(`   ✅ Generated: ${totalGenerated} entries`);
    console.log(`   ⏭️  Skipped: ${totalSkipped} entries (already existed)`);
    console.log(`   📅 Years: ${yearsToGenerate.join(", ")}`);
  } catch (error) {
    console.error("❌ Error generating future dividends:", error);
  } finally {
    mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

function getDividendDates(frequency, years, purchaseDate) {
  const dates = [];
  const currentDate = new Date();

  for (const year of years) {
    let months = [];

    switch (frequency.toLowerCase()) {
      case "monthly":
        months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        break;
      case "quarterly":
        months = [3, 6, 9, 12]; // March, June, September, December
        break;
      case "semi-annually":
        months = [6, 12]; // June, December
        break;
      case "annually":
        months = [12]; // December
        break;
      default:
        months = [3, 6, 9, 12]; // Default to quarterly
    }

    for (const month of months) {
      // Create ex-dividend date (typically 1-2 weeks before payment)
      const exDividendDate = new Date(year, month - 1, 15); // 15th of each month

      // Only include if after purchase date and not in the past
      if (exDividendDate > purchaseDate && exDividendDate > currentDate) {
        dates.push(exDividendDate);
      }
    }
  }

  return dates.sort((a, b) => a - b);
}

// Handle script termination
process.on("SIGINT", () => {
  console.log("\n🛑 Script interrupted by user");
  mongoose.connection.close();
  process.exit(0);
});

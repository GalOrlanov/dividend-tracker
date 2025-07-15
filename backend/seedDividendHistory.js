const mongoose = require("mongoose");
const DividendHistory = require("./models/DividendHistory");

const uri = "mongodb+srv://gal:12321@cluster0-7hpz1.gcp.mongodb.net/DividendTracker?retryWrites=true&w=majority";

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const sampleDividendHistory = [
  {
    symbol: "AAPL",
    companyName: "Apple Inc.",
    shares: 10,
    dividendPerShare: 0.24,
    totalAmount: 2.4,
    exDividendDate: new Date("2024-02-09"),
    paymentDate: new Date("2024-02-15"),
    payoutFrequency: "quarterly",
    year: 2024,
    quarter: 1,
    month: 2,
  },
  {
    symbol: "MSFT",
    companyName: "Microsoft Corporation",
    shares: 5,
    dividendPerShare: 0.75,
    totalAmount: 3.75,
    exDividendDate: new Date("2024-02-14"),
    paymentDate: new Date("2024-03-14"),
    payoutFrequency: "quarterly",
    year: 2024,
    quarter: 1,
    month: 3,
  },
  {
    symbol: "JNJ",
    companyName: "Johnson & Johnson",
    shares: 8,
    dividendPerShare: 1.19,
    totalAmount: 9.52,
    exDividendDate: new Date("2024-02-20"),
    paymentDate: new Date("2024-03-26"),
    payoutFrequency: "quarterly",
    year: 2024,
    quarter: 1,
    month: 3,
  },
  {
    symbol: "AAPL",
    companyName: "Apple Inc.",
    shares: 10,
    dividendPerShare: 0.24,
    totalAmount: 2.4,
    exDividendDate: new Date("2024-05-10"),
    paymentDate: new Date("2024-05-16"),
    payoutFrequency: "quarterly",
    year: 2024,
    quarter: 2,
    month: 5,
  },
  {
    symbol: "MSFT",
    companyName: "Microsoft Corporation",
    shares: 5,
    dividendPerShare: 0.75,
    totalAmount: 3.75,
    exDividendDate: new Date("2024-05-15"),
    paymentDate: new Date("2024-06-13"),
    payoutFrequency: "quarterly",
    year: 2024,
    quarter: 2,
    month: 6,
  },
  {
    symbol: "JNJ",
    companyName: "Johnson & Johnson",
    shares: 8,
    dividendPerShare: 1.19,
    totalAmount: 9.52,
    exDividendDate: new Date("2024-05-21"),
    paymentDate: new Date("2024-06-25"),
    payoutFrequency: "quarterly",
    year: 2024,
    quarter: 2,
    month: 6,
  },
  {
    symbol: "AAPL",
    companyName: "Apple Inc.",
    shares: 10,
    dividendPerShare: 0.24,
    totalAmount: 2.4,
    exDividendDate: new Date("2024-08-09"),
    paymentDate: new Date("2024-08-15"),
    payoutFrequency: "quarterly",
    year: 2024,
    quarter: 3,
    month: 8,
  },
  {
    symbol: "MSFT",
    companyName: "Microsoft Corporation",
    shares: 5,
    dividendPerShare: 0.75,
    totalAmount: 3.75,
    exDividendDate: new Date("2024-08-14"),
    paymentDate: new Date("2024-09-12"),
    payoutFrequency: "quarterly",
    year: 2024,
    quarter: 3,
    month: 9,
  },
  {
    symbol: "JNJ",
    companyName: "Johnson & Johnson",
    shares: 8,
    dividendPerShare: 1.19,
    totalAmount: 9.52,
    exDividendDate: new Date("2024-08-20"),
    paymentDate: new Date("2024-09-24"),
    payoutFrequency: "quarterly",
    year: 2024,
    quarter: 3,
    month: 9,
  },
  {
    symbol: "AAPL",
    companyName: "Apple Inc.",
    shares: 10,
    dividendPerShare: 0.24,
    totalAmount: 2.4,
    exDividendDate: new Date("2024-11-08"),
    paymentDate: new Date("2024-11-14"),
    payoutFrequency: "quarterly",
    year: 2024,
    quarter: 4,
    month: 11,
  },
  {
    symbol: "MSFT",
    companyName: "Microsoft Corporation",
    shares: 5,
    dividendPerShare: 0.75,
    totalAmount: 3.75,
    exDividendDate: new Date("2024-11-13"),
    paymentDate: new Date("2024-12-12"),
    payoutFrequency: "quarterly",
    year: 2024,
    quarter: 4,
    month: 12,
  },
  {
    symbol: "JNJ",
    companyName: "Johnson & Johnson",
    shares: 8,
    dividendPerShare: 1.19,
    totalAmount: 9.52,
    exDividendDate: new Date("2024-11-19"),
    paymentDate: new Date("2024-12-24"),
    payoutFrequency: "quarterly",
    year: 2024,
    quarter: 4,
    month: 12,
  },
];

async function seedDividendHistory() {
  try {
    // Clear existing data
    await DividendHistory.deleteMany({});
    console.log("Cleared existing dividend history");

    // Insert sample data
    await DividendHistory.insertMany(sampleDividendHistory);
    console.log("Added sample dividend history data");

    // Verify the data
    const count = await DividendHistory.countDocuments();
    console.log(`Total dividend history records: ${count}`);

    mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error seeding dividend history:", error);
    mongoose.connection.close();
  }
}

seedDividendHistory();

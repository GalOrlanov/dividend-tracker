const mongoose = require("mongoose");

const portfolioSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    shares: {
      type: Number,
      required: true,
      min: 0,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
    },
    currentPrice: {
      type: Number,
      default: 0,
    },
    priceChange: {
      type: Number,
      default: 0,
    },
    priceChangePercent: {
      type: Number,
      default: 0,
    },
    dividendPerShare: {
      type: Number,
      default: 0,
    },
    dividendYield: {
      type: Number,
      default: 0,
    },
    exDividendDate: {
      type: Date,
    },
    payoutFrequency: {
      type: String,
      enum: ["monthly", "quarterly", "semi-annually", "annually"],
      default: "quarterly",
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for total investment
portfolioSchema.virtual("totalInvestment").get(function () {
  return this.shares * this.purchasePrice;
});

// Virtual for current value
portfolioSchema.virtual("currentValue").get(function () {
  return this.shares * this.currentPrice;
});

// Virtual for total dividend income
portfolioSchema.virtual("totalDividendIncome").get(function () {
  // Calculate annual dividend based on payout frequency
  let annualDividendPerShare = this.dividendPerShare;

  switch (this.payoutFrequency) {
    case "monthly":
      annualDividendPerShare = this.dividendPerShare * 12;
      break;
    case "quarterly":
      annualDividendPerShare = this.dividendPerShare * 4;
      break;
    case "semi-annually":
      annualDividendPerShare = this.dividendPerShare * 2;
      break;
    case "annually":
      annualDividendPerShare = this.dividendPerShare;
      break;
    default:
      annualDividendPerShare = this.dividendPerShare * 4; // Default to quarterly
  }

  return this.shares * annualDividendPerShare;
});

// Virtual for dividend yield on cost
portfolioSchema.virtual("yieldOnCost").get(function () {
  if (this.totalInvestment === 0) return 0;
  return (this.totalDividendIncome / this.totalInvestment) * 100;
});

// Virtual for capital gain/loss
portfolioSchema.virtual("capitalGainLoss").get(function () {
  return this.currentValue - this.totalInvestment;
});

// Virtual for total return
portfolioSchema.virtual("totalReturn").get(function () {
  return this.capitalGainLoss + this.totalDividendIncome;
});

// Ensure virtuals are included when converting to JSON
portfolioSchema.set("toJSON", { virtuals: true });
portfolioSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Portfolio", portfolioSchema);

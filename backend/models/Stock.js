const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    sector: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    currentPrice: {
      type: Number,
      min: 0,
    },
    dividendYield: {
      type: Number,
      min: 0,
    },
    dividendPerShare: {
      type: Number,
      min: 0,
    },
    payoutRatio: {
      type: Number,
      min: 0,
    },
    exDividendDate: {
      type: Date,
    },
    paymentDate: {
      type: Date,
    },
    frequency: {
      type: String,
      enum: ["monthly", "quarterly", "semi-annual", "annual"],
      default: "quarterly",
    },
    description: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient search
stockSchema.index({ symbol: 1 }, { unique: true });
stockSchema.index({ companyName: "text", sector: "text" });
stockSchema.index({ dividendYield: -1 });
stockSchema.index({ isActive: 1 });

module.exports = mongoose.model("Stock", stockSchema);

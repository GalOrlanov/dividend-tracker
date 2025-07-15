const mongoose = require("mongoose");

const dividendHistorySchema = new mongoose.Schema(
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
    dividendPerShare: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    exDividendDate: {
      type: Date,
      required: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    payoutFrequency: {
      type: String,
      enum: ["monthly", "quarterly", "semi-annually", "annually"],
      default: "quarterly",
    },
    year: {
      type: Number,
      required: true,
    },
    quarter: {
      type: Number,
      min: 1,
      max: 4,
    },
    month: {
      type: Number,
      min: 1,
      max: 12,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
dividendHistorySchema.index({ symbol: 1, paymentDate: -1 });
dividendHistorySchema.index({ year: 1, month: 1 });
dividendHistorySchema.index({ paymentDate: -1 });

module.exports = mongoose.model("DividendHistory", dividendHistorySchema);

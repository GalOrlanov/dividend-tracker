const mongoose = require("mongoose");

const dividendSchema = new mongoose.Schema(
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
    totalDividend: {
      type: Number,
      required: true,
      min: 0,
    },
    exDate: {
      type: Date,
      required: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    frequency: {
      type: String,
      enum: ["monthly", "quarterly", "semi-annual", "annual"],
      default: "quarterly",
    },
    sector: {
      type: String,
      trim: true,
    },
    notes: {
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

// Calculate total dividend before saving
dividendSchema.pre("save", function (next) {
  if (this.shares && this.dividendPerShare) {
    this.totalDividend = this.shares * this.dividendPerShare;
  }
  next();
});

// Index for efficient queries
dividendSchema.index({ symbol: 1, exDate: 1 });
dividendSchema.index({ paymentDate: 1 });
dividendSchema.index({ isActive: 1 });

module.exports = mongoose.model("Dividend", dividendSchema);

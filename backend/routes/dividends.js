const express = require("express");
const router = express.Router();
const Dividend = require("../models/Dividend");
const Joi = require("joi");

// Validation schemas
const dividendSchema = Joi.object({
  symbol: Joi.string().required().max(10),
  companyName: Joi.string().required().max(100),
  shares: Joi.number().positive().required(),
  dividendPerShare: Joi.number().positive().required(),
  exDate: Joi.date().required(),
  paymentDate: Joi.date().required(),
  frequency: Joi.string().valid("monthly", "quarterly", "semi-annual", "annual"),
  sector: Joi.string().max(50),
  notes: Joi.string().max(500),
});

// Get all dividends
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, symbol, year, month } = req.query;

    let query = { isActive: true };

    if (symbol) {
      query.symbol = new RegExp(symbol, "i");
    }

    if (year) {
      query.paymentDate = {
        $gte: new Date(year, 0, 1),
        $lt: new Date(parseInt(year) + 1, 0, 1),
      };
    }

    if (month && year) {
      query.paymentDate = {
        $gte: new Date(year, month - 1, 1),
        $lt: new Date(year, month, 1),
      };
    }

    const dividends = await Dividend.find(query)
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Dividend.countDocuments(query);

    res.json({
      dividends,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly dividend summary
router.get("/monthly", async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const monthlyData = await Dividend.aggregate([
      {
        $match: {
          isActive: true,
          paymentDate: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$paymentDate" },
          totalDividend: { $sum: "$totalDividend" },
          count: { $sum: 1 },
          dividends: { $push: "$$ROOT" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Fill in missing months with zero values
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const result = months.map((month) => {
      const monthData = monthlyData.find((m) => m._id === month);
      return {
        month,
        monthName: new Date(currentYear, month - 1, 1).toLocaleString("default", { month: "long" }),
        totalDividend: monthData ? monthData.totalDividend : 0,
        count: monthData ? monthData.count : 0,
        dividends: monthData ? monthData.dividends : [],
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dividend by ID
router.get("/:id", async (req, res) => {
  try {
    const dividend = await Dividend.findById(req.params.id);
    if (!dividend) {
      return res.status(404).json({ error: "Dividend not found" });
    }
    res.json(dividend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new dividend
router.post("/", async (req, res) => {
  try {
    const { error } = dividendSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const dividend = new Dividend(req.body);
    await dividend.save();
    res.status(201).json(dividend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update dividend
router.put("/:id", async (req, res) => {
  try {
    const { error } = dividendSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const dividend = await Dividend.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    if (!dividend) {
      return res.status(404).json({ error: "Dividend not found" });
    }

    res.json(dividend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete dividend (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const dividend = await Dividend.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

    if (!dividend) {
      return res.status(404).json({ error: "Dividend not found" });
    }

    res.json({ message: "Dividend deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming dividends
router.get("/upcoming/next", async (req, res) => {
  try {
    const upcoming = await Dividend.find({
      isActive: true,
      paymentDate: { $gte: new Date() },
    })
      .sort({ paymentDate: 1 })
      .limit(10);

    res.json(upcoming);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const Stock = require("../models/Stock");
const Joi = require("joi");

// Validation schemas
const stockSchema = Joi.object({
  symbol: Joi.string().required().max(10),
  companyName: Joi.string().required().max(100),
  sector: Joi.string().max(50),
  industry: Joi.string().max(50),
  currentPrice: Joi.number().positive(),
  dividendYield: Joi.number().positive(),
  dividendPerShare: Joi.number().positive(),
  payoutRatio: Joi.number().positive(),
  exDividendDate: Joi.date(),
  paymentDate: Joi.date(),
  frequency: Joi.string().valid("monthly", "quarterly", "semi-annual", "annual"),
  description: Joi.string().max(1000),
  website: Joi.string().uri(),
});

// Search stocks
router.get("/search", async (req, res) => {
  try {
    const { q, sector, minYield, maxYield, limit = 20 } = req.query;

    let query = { isActive: true };

    if (q) {
      query.$or = [{ symbol: new RegExp(q, "i") }, { companyName: new RegExp(q, "i") }, { sector: new RegExp(q, "i") }];
    }

    if (sector) {
      query.sector = new RegExp(sector, "i");
    }

    if (minYield || maxYield) {
      query.dividendYield = {};
      if (minYield) query.dividendYield.$gte = parseFloat(minYield);
      if (maxYield) query.dividendYield.$lte = parseFloat(maxYield);
    }

    const stocks = await Stock.find(query).sort({ dividendYield: -1 }).limit(parseInt(limit));

    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all stocks
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, sector, sortBy = "symbol" } = req.query;

    let query = { isActive: true };

    if (sector) {
      query.sector = new RegExp(sector, "i");
    }

    let sortOptions = {};
    if (sortBy === "yield") {
      sortOptions.dividendYield = -1;
    } else if (sortBy === "price") {
      sortOptions.currentPrice = 1;
    } else {
      sortOptions.symbol = 1;
    }

    const stocks = await Stock.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Stock.countDocuments(query);

    res.json({
      stocks,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock by symbol
router.get("/:symbol", async (req, res) => {
  try {
    const stock = await Stock.findOne({
      symbol: req.params.symbol.toUpperCase(),
      isActive: true,
    });

    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new stock
router.post("/", async (req, res) => {
  try {
    const { error } = stockSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const stock = new Stock(req.body);
    await stock.save();
    res.status(201).json(stock);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: "Stock symbol already exists" });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update stock
router.put("/:symbol", async (req, res) => {
  try {
    const { error } = stockSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const stock = await Stock.findOneAndUpdate({ symbol: req.params.symbol.toUpperCase() }, req.body, { new: true, runValidators: true });

    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    res.json(stock);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete stock (soft delete)
router.delete("/:symbol", async (req, res) => {
  try {
    const stock = await Stock.findOneAndUpdate({ symbol: req.params.symbol.toUpperCase() }, { isActive: false }, { new: true });

    if (!stock) {
      return res.status(404).json({ error: "Stock not found" });
    }

    res.json({ message: "Stock deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sectors
router.get("/sectors/list", async (req, res) => {
  try {
    const sectors = await Stock.distinct("sector", { isActive: true });
    res.json(sectors.filter((sector) => sector));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top dividend yield stocks
router.get("/top/yield", async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topStocks = await Stock.find({
      isActive: true,
      dividendYield: { $gt: 0 },
    })
      .sort({ dividendYield: -1 })
      .limit(parseInt(limit));

    res.json(topStocks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

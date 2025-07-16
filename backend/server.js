require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
const session = require("express-session");
const morgan = require("morgan");
const config = require("./config");
const oauthConfig = require("./config/oauth");

const dividendRoutes = require("./routes/dividends");
const stockRoutes = require("./routes/stocks");
const marketDataRoutes = require("./routes/marketData");
const portfolioRoutes = require("./routes/portfolio");
const authRoutes = require("./routes/auth");

const app = express();
const PORT = config.port;

// Trust proxy for rate limiting behind load balancers/proxies
app.set("trust proxy", 1);

// Custom Morgan token for response time in milliseconds
morgan.token("response-time-ms", (req, res) => {
  if (!res._header || !req._startAt) return "";
  const diff = process.hrtime(req._startAt);
  const ms = diff[0] * 1e3 + diff[1] * 1e-6;
  return ms.toFixed(2);
});

// Custom Morgan token for request size
morgan.token("req-size", (req) => {
  const size = req.headers["content-length"];
  return size ? `${size} bytes` : "0 bytes";
});

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Morgan logging middleware
if (config.nodeEnv === "production") {
  // Production: Use combined format with more details
  app.use(
    morgan("combined", {
      skip: (req, res) => res.statusCode < 400, // Only log errors in production
      stream: {
        write: (message) => {
          console.log(`[${new Date().toISOString()}] ${message.trim()}`);
        },
      },
    })
  );
} else {
  // Development: Use custom format with response time and request size
  app.use(morgan(":method :url :status :response-time-ms ms - :req-size - :user-agent"));
}

// Session configuration for Passport
app.use(
  session({
    secret: oauthConfig.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === "production", // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting - Enable in production
if (config.nodeEnv === "production") {
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    message: "Too many requests from this IP, please try again later.",
  });
  app.use(limiter);
}

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// MongoDB connection
mongoose
  .connect(config.mongodbUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dividends", dividendRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/market", marketDataRoutes);
app.use("/api/portfolio", portfolioRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Dividend Tracker API is running",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Dividend Tracker API",
    version: "1.0.0",
    environment: config.nodeEnv,
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      dividends: "/api/dividends",
      stocks: "/api/stocks",
      market: "/api/market",
      portfolio: "/api/portfolio",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: config.nodeEnv === "development" ? err.message : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 Morgan logging: ${config.nodeEnv === "production" ? "combined (errors only)" : "dev (all requests)"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  process.exit(0);
});

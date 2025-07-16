module.exports = {
  port: process.env.PORT || 5001,
  mongodbUri: process.env.MONGODB_URI || "mongodb+srv://gal:12321@cluster0-7hpz1.gcp.mongodb.net/DividendTracker?retryWrites=true&w=majority",
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMax: 100, // limit each IP to 100 requests per windowMs
  jwtSecret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
};

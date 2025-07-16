// OAuth Configuration
// Copy this to your .env file or set these environment variables

module.exports = {
  // Google OAuth Configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,

  // Session Configuration
  SESSION_SECRET: process.env.SESSION_SECRET,

  // OAuth Callback URL
  GOOGLE_CALLBACK_URL: process.env.NODE_ENV === "development" || !process.env.NODE_ENV ? "http://localhost:5001/api/auth/google/callback" : "https://dividend.share-it-up.com/api/auth/google/callback",

  // Frontend success URL (for web-based OAuth)
  FRONTEND_SUCCESS_URL: process.env.NODE_ENV === "development" || !process.env.NODE_ENV ? "http://localhost:3000/auth-success" : "https://your-frontend-domain.com/auth-success",
};

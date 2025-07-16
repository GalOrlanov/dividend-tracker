// API base URL for backend requests
// Update this based on your deployment environment

// Development - Local server
const LOCAL_API_URL = "http://localhost:5001";

// Production - VPS deployment with custom domain
const PRODUCTION_API_URL = "https://dividend.share-it-up.com";

// ngrok - For testing (update this when you run ngrok)
const NGROK_API_URL = "https://your-ngrok-url.ngrok.io";

// Choose which API URL to use
const getApiUrl = () => {
  // You can change this to switch between environments
  const environment = process.env.NODE_ENV || "production"; // Default to production now

  switch (environment) {
    case "production":
      return PRODUCTION_API_URL;
    case "ngrok":
      return NGROK_API_URL;
    case "development":
      return LOCAL_API_URL;
    default:
      return PRODUCTION_API_URL;
  }
};

export const API_BASE_URL = getApiUrl();

// Helper function to update API URL dynamically
export const updateApiUrl = (newUrl) => {
  console.log(`🔄 Updating API URL to: ${newUrl}`);
  // In a real app, you might want to store this in AsyncStorage
  // For now, you'll need to restart the app after changing this
};

export default {
  API_BASE_URL,
  LOCAL_API_URL,
  PRODUCTION_API_URL,
  NGROK_API_URL,
  updateApiUrl,
};

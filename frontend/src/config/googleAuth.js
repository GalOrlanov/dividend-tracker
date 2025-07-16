// Google OAuth Configuration
// You'll need to create a Google Cloud Console project and get these credentials

export const GOOGLE_CONFIG = {
  // Replace with your actual Google OAuth client ID
  // Get this from Google Cloud Console: https://console.cloud.google.com/
  clientId: "338573289308-k28e00uvf51nmkhrqudfjdc2g06ja1gk.apps.googleusercontent.com",

  // Scopes for Google OAuth
  scopes: ["openid", "profile", "email"],

  // Redirect URI (this should match what you configure in Google Cloud Console)
  redirectUri: "dividendtracker://oauth2redirect",

  // Additional configuration
  responseType: "token",
  prompt: "select_account",
};

// Google OAuth endpoints
export const GOOGLE_ENDPOINTS = {
  authorization: "https://accounts.google.com/o/oauth2/v2/auth",
  token: "https://oauth2.googleapis.com/token",
  userInfo: "https://www.googleapis.com/oauth2/v2/userinfo",
};

// Instructions for setup:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select existing one
// 3. Enable Google+ API and Google OAuth2 API
// 4. Go to Credentials > Create Credentials > OAuth 2.0 Client IDs
// 5. Choose "Mobile application" for iOS/Android
// 6. Add your bundle ID: com.galorlanov.dividendtracker
// 7. Copy the client ID and replace YOUR_GOOGLE_CLIENT_ID above
// 8. Add authorized redirect URIs: dividendtracker://oauth2redirect

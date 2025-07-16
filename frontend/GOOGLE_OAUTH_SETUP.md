# Google OAuth Setup Guide

This guide will help you set up Google OAuth for your Dividend Tracker app.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top
3. Click "New Project"
4. Enter a project name (e.g., "Dividend Tracker")
5. Click "Create"

### 2. Enable Required APIs

1. In your project, go to "APIs & Services" > "Library"
2. Search for and enable these APIs:
   - Google+ API
   - Google OAuth2 API

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen first:
   - User Type: External
   - App name: "Dividend Tracker"
   - User support email: Your email
   - Developer contact information: Your email
   - Save and continue through the rest

### 4. Create OAuth 2.0 Client ID

1. Application type: **Mobile application**
2. Name: "Dividend Tracker Mobile"
3. Package name: `com.galorlanov.dividendtracker`
4. Click "Create"

### 5. Configure Authorized Redirect URIs

1. After creating the client ID, click on it to edit
2. Add these redirect URIs:
   - `dividendtracker://oauth2redirect`
   - `com.galorlanov.dividendtracker://oauth2redirect`

### 6. Update Your App Configuration

1. Copy the Client ID from Google Cloud Console
2. Open `frontend/src/config/googleAuth.js`
3. Replace `YOUR_GOOGLE_CLIENT_ID` with your actual client ID:

```javascript
clientId: "123456789-abcdefghijklmnop.apps.googleusercontent.com",
```

### 7. Test the Setup

1. Run your app: `npx expo start`
2. Try logging in with Google
3. You should see the Google sign-in popup

## Troubleshooting

### Common Issues

1. **"Invalid client" error**

   - Make sure you're using the correct client ID
   - Verify the package name matches your app.json

2. **"Redirect URI mismatch" error**

   - Check that the redirect URI in Google Cloud Console matches your app scheme
   - Make sure you've added both redirect URIs

3. **"OAuth consent screen not configured"**

   - Complete the OAuth consent screen setup in Google Cloud Console

4. **App not opening after Google sign-in**
   - Verify your app scheme is correctly configured in app.json
   - Check that expo-auth-session plugin is properly configured

### Testing on Different Platforms

- **iOS Simulator**: Should work with Google sign-in
- **Android Emulator**: Should work with Google sign-in
- **Physical Device**: Should work with Google sign-in
- **Expo Go**: May have limitations with custom schemes

## Security Notes

- Never commit your client ID to public repositories
- Consider using environment variables for production
- Regularly review your OAuth consent screen settings
- Monitor your Google Cloud Console for any security alerts

## Production Considerations

1. **OAuth Consent Screen**: Set to "In production" when ready
2. **Scopes**: Only request the scopes you actually need
3. **User Data**: Handle user data according to privacy laws
4. **Token Storage**: Securely store and refresh tokens
5. **Error Handling**: Implement proper error handling for OAuth failures

## Support

If you encounter issues:

1. Check the Google Cloud Console logs
2. Verify your configuration matches this guide
3. Test with a simple OAuth flow first
4. Check Expo documentation for auth-session updates

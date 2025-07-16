# Google Sign-In Setup Guide

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sign-In API

## Step 2: Configure OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted

### For iOS:

1. Choose "iOS" as application type
2. Enter your bundle identifier: `com.yourcompany.dividendtrackerapp`
3. Copy the iOS Client ID

### For Android:

1. Choose "Android" as application type
2. Enter your package name: `com.yourcompany.dividendtrackerapp`
3. Generate and add your SHA-1 fingerprint
4. Copy the Android Client ID

### For Web (if needed):

1. Choose "Web application" as application type
2. Add authorized JavaScript origins: `https://auth.expo.io`
3. Add authorized redirect URIs: `https://auth.expo.io/@your-expo-username/dividend-tracker-app`
4. Copy the Web Client ID

## Step 3: Update Configuration Files

### Update `frontend/src/services/googleAuth.js`:

Replace the placeholder client IDs with your actual ones:

```javascript
await GoogleSignin.configure({
  webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com", // Replace with your actual web client ID
  iosClientId: "YOUR_IOS_CLIENT_ID.apps.googleusercontent.com", // Replace with your actual iOS client ID
  offlineAccess: true,
});
```

### Update `backend/config/oauth.js`:

Make sure your Google OAuth configuration is correct:

```javascript
GOOGLE_CLIENT_ID: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
GOOGLE_CLIENT_SECRET: 'YOUR_CLIENT_SECRET', // Optional for mobile apps
```

## Step 4: Build and Test

1. For development with Expo Go:

   - Use the web client ID only
   - Google Sign-In will work but with limited functionality

2. For production with development builds:
   - Use both iOS and Android client IDs
   - Build with `expo run:ios` or `expo run:android`
   - Full Google Sign-In functionality will be available

## Troubleshooting

- If you get "RNGoogleSignin could not be found" error, you're using Expo Go. Switch to development builds.
- If authentication fails, check that your client IDs match your app's bundle identifier/package name.
- Make sure your Google Cloud project has the Google Sign-In API enabled.

## Security Notes

- In production, verify ID tokens on the backend with Google's servers
- Keep your client secrets secure
- Use environment variables for sensitive configuration

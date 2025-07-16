# Google OAuth Setup for Backend

## 1. Create .env file

Create a `.env` file in the backend directory with the following variables:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_random

# Session Configuration
SESSION_SECRET=your_session_secret_here_make_it_long_and_random

# Server Configuration
PORT=5001
```

## 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" > "Credentials"
4. Edit your OAuth 2.0 Client ID
5. Add these **Authorized redirect URIs**:
   - `https://dividend.share-it-up.com/api/auth/google/callback`

## 3. Backend Endpoints

The following OAuth endpoints are now available:

- `GET /api/auth/google` - Initiates Google OAuth flow
- `GET /api/auth/google/callback` - Google OAuth callback (handles redirect)
- `GET /api/auth/validate` - Validates JWT token
- `POST /api/auth/logout` - Logs out user

## 4. OAuth Flow

1. Frontend opens `https://dividend.share-it-up.com/api/auth/google`
2. User authenticates with Google
3. Google redirects to `/api/auth/google/callback`
4. Backend creates/updates user and generates JWT token
5. Backend redirects to `dividendtrackerapp://auth?token=...&user=...`
6. Frontend receives the deep link and extracts token

## 5. Testing

To test the OAuth flow:

1. Start the backend server: `npm run dev`
2. Visit `https://dividend.share-it-up.com/api/auth/google` in a browser
3. Complete Google authentication
4. You should be redirected to the app with a token

## 6. Security Notes

- Use strong, random secrets for JWT_SECRET and SESSION_SECRET
- In production, set `secure: true` for session cookies
- Consider implementing token blacklisting for logout
- Use HTTPS in production

# API Deployment Guide

## Option 1: Deploy to Railway (Recommended - Free)

### Step 1: Prepare for Deployment

1. Make sure your code is committed to a Git repository
2. Ensure all environment variables are properly configured

### Step 2: Deploy to Railway

1. Go to [Railway.app](https://railway.app) and sign up/login
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will automatically detect it's a Node.js app
5. Add environment variables in Railway dashboard:
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secure-jwt-secret`
   - `MONGODB_URI=your-mongodb-connection-string`
   - `CORS_ORIGIN=*` (or your frontend URL)

### Step 3: Get Your API URL

- Railway will provide a URL like: `https://your-app-name.railway.app`
- Update your frontend config to use this URL

## Option 2: Deploy to Render (Free Tier)

### Step 1: Prepare for Deployment

1. Create a `render.yaml` file in your backend directory:

```yaml
services:
  - type: web
    name: dividend-tracker-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
```

### Step 2: Deploy to Render

1. Go to [Render.com](https://render.com) and sign up
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Render will auto-detect the configuration
5. Add your environment variables

## Option 3: Use ngrok for Local Development

### Step 1: Install ngrok

```bash
npm install -g ngrok
```

### Step 2: Start your backend

```bash
cd backend
npm start
```

### Step 3: Expose with ngrok

```bash
ngrok http 5001
```

### Step 4: Use the ngrok URL

- ngrok will provide a URL like: `https://abc123.ngrok.io`
- Update your frontend config to use this URL

## Environment Variables for Production

Make sure to set these in your deployment platform:

```env
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret-key
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
CORS_ORIGIN=https://your-frontend-domain.com
```

## Update Frontend Configuration

After deployment, update `frontend/src/config/api.js`:

```javascript
// For Railway/Render deployment
export const API_BASE_URL = "https://your-app-name.railway.app";

// For ngrok
export const API_BASE_URL = "https://abc123.ngrok.io";
```

## Testing the Deployment

1. Test the health endpoint: `GET /api/health`
2. Test authentication: `POST /api/auth/login`
3. Test protected routes with valid JWT token

## Troubleshooting

### Common Issues:

1. **CORS errors**: Make sure `CORS_ORIGIN` is set correctly
2. **Database connection**: Verify `MONGODB_URI` is correct
3. **JWT errors**: Ensure `JWT_SECRET` is set and consistent
4. **Port issues**: Most platforms set `PORT` automatically

### Logs:

- Check deployment platform logs for errors
- Use `console.log()` for debugging (remove in production)

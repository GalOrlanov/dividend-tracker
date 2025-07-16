# Quick Deployment Guide

## Option 1: Quick Test with ngrok (Immediate)

### Step 1: Install ngrok

```bash
npm install -g ngrok
```

### Step 2: Start your backend

```bash
cd backend
npm start
```

### Step 3: In a new terminal, expose with ngrok

```bash
ngrok http 5001
```

### Step 4: Copy the ngrok URL and update frontend

- Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`)
- Update `frontend/src/config/api.js`:

```javascript
export const API_BASE_URL = "https://abc123.ngrok.io";
```

### Step 5: Test your app

- Restart your frontend app
- Test the connection

## Option 2: Deploy to Railway (Recommended)

### Step 1: Prepare your code

```bash
cd backend
./deploy.sh
```

### Step 2: Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables:
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secure-secret-key`
   - `MONGODB_URI=mongodb+srv://gal:12321@cluster0-7hpz1.gcp.mongodb.net/DividendTracker?retryWrites=true&w=majority`
   - `CORS_ORIGIN=*`

### Step 3: Get your API URL

- Railway will provide a URL like: `https://your-app-name.railway.app`
- Update `frontend/src/config/api.js`:

```javascript
export const API_BASE_URL = "https://your-app-name.railway.app";
```

## Option 3: Deploy to Render

### Step 1: Create render.yaml

Create `backend/render.yaml`:

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
      - key: MONGODB_URI
        value: mongodb+srv://gal:12321@cluster0-7hpz1.gcp.mongodb.net/DividendTracker?retryWrites=true&w=majority
      - key: CORS_ORIGIN
        value: "*"
```

### Step 2: Deploy

1. Go to [Render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your repository
5. Render will auto-detect the configuration

## Testing Your Deployment

### Test the API directly:

```bash
# Health check
curl https://your-api-url/api/health

# Test authentication
curl -X POST https://your-api-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### Test from your app:

1. Update the API URL in `frontend/src/config/api.js`
2. Restart your frontend app
3. Try logging in or accessing protected routes

## Troubleshooting

### Common Issues:

1. **CORS errors**: Make sure `CORS_ORIGIN` is set to `*` or your frontend URL
2. **Database connection**: Verify your MongoDB URI is correct
3. **JWT errors**: Ensure `JWT_SECRET` is set
4. **Port issues**: Most platforms set `PORT` automatically

### Check logs:

- Railway: Go to your project → "Deployments" → Click on deployment → "Logs"
- Render: Go to your service → "Logs" tab

## Next Steps

After successful deployment:

1. Update your frontend to use the new API URL
2. Test all functionality
3. Consider setting up a custom domain
4. Set up monitoring and logging
5. Configure proper environment variables for production

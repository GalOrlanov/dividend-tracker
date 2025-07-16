#!/bin/bash

# Dividend Tracker API Deployment Script

echo "🚀 Starting Dividend Tracker API Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the backend directory."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
fi

# Check if all dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Test the build
echo "🧪 Testing the build..."
npm run build

# Check if server starts correctly
echo "🔍 Testing server startup..."
timeout 10s node server.js &
SERVER_PID=$!
sleep 3

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server started successfully"
    kill $SERVER_PID
else
    echo "❌ Server failed to start"
    exit 1
fi

echo ""
echo "🎉 Deployment preparation completed!"
echo ""
echo "Next steps:"
echo "1. Choose your deployment platform:"
echo "   - Railway (recommended): https://railway.app"
echo "   - Render: https://render.com"
echo "   - Heroku: https://heroku.com"
echo ""
echo "2. Follow the instructions in DEPLOYMENT.md"
echo ""
echo "3. After deployment, update frontend/src/config/api.js with your new API URL"
echo ""
echo "4. Test your deployment with: curl https://your-api-url/api/health" 
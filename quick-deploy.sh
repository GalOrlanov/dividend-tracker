#!/bin/bash

# Quick VPS Deployment Script
# This script does a fast deployment without backups
# Domain: https://dividend.share-it-up.com

SERVER_IP="129.212.145.15"
PM2_APP_NAME="dividend-tracker-backend"
DOMAIN="https://dividend.share-it-up.com"

set -e

echo "🚀 Quick deployment to VPS..."

# Create deployment package in /tmp to avoid including itself
cd ..
ARCHIVE_PATH="/tmp/dividend-tracker.tar.gz"
tar -czf "$ARCHIVE_PATH" --exclude='backend/node_modules' --exclude='frontend/node_modules' --exclude='.git' .
cd backend

# Upload and deploy
echo "📤 Uploading to server..."
scp "$ARCHIVE_PATH" root@$SERVER_IP:/tmp/

# Execute quick deployment
ssh root@$SERVER_IP << 'EOF'
set -e
cd /tmp

# Stop current app
pm2 stop dividend-tracker-backend || true

# Remove old files
rm -rf /var/www/dividend-tracker

# Extract new files
tar -xzf dividend-tracker.tar.gz -C /var/www/

# Install dependencies
cd /var/www/dividend-tracker/backend
npm install --production

# Start app
pm2 start server.js --name dividend-tracker-backend --env production
pm2 save

# Clean up
rm -f /tmp/dividend-tracker.tar.gz

echo "✅ Quick deployment completed!"
pm2 show dividend-tracker-backend
EOF

# Clean up local archive
rm -f /tmp/dividend-tracker.tar.gz

echo "🎉 Quick deployment completed!"
echo "🌐 API available at: $DOMAIN"
echo "📊 Health check: $DOMAIN/api/health" 
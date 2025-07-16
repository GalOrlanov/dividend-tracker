#!/bin/bash

# Quick VPS Deployment Script (Git-based, with sshpass for password automation)
# Requires: sshpass installed (brew install hudochenkov/sshpass/sshpass)

SERVER_IP="129.212.145.15"
PM2_APP_NAME="dividend-tracker-backend"
REPO_DIR="/var/www/dividend-tracker"
BRANCH="main"
PASSWORD='wmt$d5y!vY@Y^iR'

# NOTE: For security, do not use this approach in production environments!

echo "🚀 Quick deployment to VPS using git and sshpass..."

sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no root@$SERVER_IP << EOF
set -e

# Clone repo if not present
if [ ! -d "$REPO_DIR/.git" ]; then
  echo "📥 Cloning repository..."
  git clone https://github.com/your-username/your-repo.git $REPO_DIR  # <-- Replace with your repo URL
fi

cd $REPO_DIR

echo "🔄 Pulling latest code..."
git fetch origin $BRANCH
git reset --hard origin/$BRANCH

echo "📦 Installing dependencies..."
cd backend
npm install --production

# Restart app
pm2 stop $PM2_APP_NAME || true
pm2 start server.js --name $PM2_APP_NAME --env production
pm2 save

echo "✅ Quick deployment completed!"
pm2 show $PM2_APP_NAME
EOF

echo "🎉 Quick deployment completed!"
echo "🌐 API available at: http://$SERVER_IP:5001"
echo "📊 Health check: http://$SERVER_IP:5001/api/health" 
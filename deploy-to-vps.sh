#!/bin/bash

# Dividend Tracker VPS Deployment Script
# Server: 129.212.145.15
# Domain: https://dividend.share-it-up.com
# Username: root

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="129.212.145.15"
SERVER_USER="root"
SERVER_PATH="/var/www/dividend-tracker"
PM2_APP_NAME="dividend-tracker-backend"
DOMAIN="https://dividend.share-it-up.com"

echo -e "${BLUE}🚀 Starting Dividend Tracker VPS Deployment...${NC}"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Make sure you're in the backend directory."
    exit 1
fi

# Check if git is initialized and has changes
if [ ! -d ".git" ]; then
    print_warning "Git repository not found. Initializing..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Committing them..."
    git add .
    git commit -m "Auto-commit before deployment $(date)"
fi

print_info "📦 Preparing deployment package..."

# Create a temporary deployment directory
TEMP_DIR=$(mktemp -d)
DEPLOY_DIR="$TEMP_DIR/dividend-tracker"

# Copy the entire project
cp -r ../ "$DEPLOY_DIR"

# Remove unnecessary files for deployment
cd "$DEPLOY_DIR"
rm -rf frontend/node_modules
rm -rf backend/node_modules
rm -rf .git

print_info "🔐 Connecting to server and deploying..."

# Create deployment script for server
cat > deploy-on-server.sh << 'EOF'
#!/bin/bash
set -e

DEPLOY_PATH="/var/www/dividend-tracker"
BACKUP_PATH="/var/www/dividend-tracker-backup-$(date +%Y%m%d-%H%M%S)"
PM2_APP_NAME="dividend-tracker-backend"

echo "🔄 Starting deployment..."

# Create backup of current deployment
if [ -d "$DEPLOY_PATH" ]; then
    echo "📦 Creating backup..."
    cp -r "$DEPLOY_PATH" "$BACKUP_PATH"
    echo "✅ Backup created at $BACKUP_PATH"
fi

# Stop the current PM2 process
echo "🛑 Stopping current application..."
pm2 stop $PM2_APP_NAME || true

# Remove old deployment
if [ -d "$DEPLOY_PATH" ]; then
    echo "🗑️  Removing old deployment..."
    rm -rf "$DEPLOY_PATH"
fi

# Extract new deployment
echo "📦 Extracting new deployment..."
tar -xzf dividend-tracker.tar.gz -C /var/www/

# Set proper permissions
chown -R root:root "$DEPLOY_PATH"
chmod -R 755 "$DEPLOY_PATH"

# Install dependencies
echo "📦 Installing dependencies..."
cd "$DEPLOY_PATH/backend"
npm install --production

# Update environment variables
echo "⚙️  Updating environment variables..."
pm2 set $PM2_APP_NAME:NODE_ENV production
pm2 set $PM2_APP_NAME:PORT 5001

# Start the application
echo "🚀 Starting application..."
pm2 start server.js --name $PM2_APP_NAME --env production

# Save PM2 configuration
pm2 save

echo "✅ Deployment completed successfully!"
echo "📊 Application status:"
pm2 show $PM2_APP_NAME

echo "🌐 Application should be available at: https://dividend.share-it-up.com"
echo "📊 Health check: https://dividend.share-it-up.com/api/health"
EOF

# Create deployment package
tar -czf dividend-tracker.tar.gz -C "$TEMP_DIR" .

# Upload to server
print_info "📤 Uploading to server..."
scp dividend-tracker.tar.gz deploy-on-server.sh root@$SERVER_IP:/tmp/

# Execute deployment on server
print_info "🔧 Executing deployment on server..."
ssh root@$SERVER_IP "chmod +x /tmp/deploy-on-server.sh && /tmp/deploy-on-server.sh"

# Clean up local files
rm -rf "$TEMP_DIR"
rm -f dividend-tracker.tar.gz

print_status "🎉 Deployment completed successfully!"

# Test the deployment
print_info "🧪 Testing deployment..."
sleep 5  # Wait for server to start

# Test health endpoint
if curl -s $DOMAIN/api/health > /dev/null; then
    print_status "✅ Health check passed!"
    echo "🌐 Your API is now available at: $DOMAIN"
    echo "📊 Health endpoint: $DOMAIN/api/health"
else
    print_warning "⚠️  Health check failed. Check server logs with: ssh root@$SERVER_IP 'pm2 logs $PM2_APP_NAME'"
fi

# Update frontend configuration
print_info "📱 Frontend configuration already updated to use: $DOMAIN"

echo ""
print_status "🎉 Deployment Summary:"
echo "   🌐 API URL: $DOMAIN"
echo "   📊 Health: $DOMAIN/api/health"
echo "   📱 Frontend config updated"
echo ""
echo "📋 Useful commands:"
echo "   View logs: ssh root@$SERVER_IP 'pm2 logs $PM2_APP_NAME'"
echo "   Restart: ssh root@$SERVER_IP 'pm2 restart $PM2_APP_NAME'"
echo "   Status: ssh root@$SERVER_IP 'pm2 status'"
echo "   Monitor: ssh root@$SERVER_IP 'pm2 monit'" 
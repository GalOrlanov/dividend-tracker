# VPS Deployment Guide

## Server Information

- **IP Address**: 129.212.145.15
- **Domain**: https://dividend.share-it-up.com
- **Username**: root
- **Password**: wmt$d5y!vY@Y^iR
- **Deployment Path**: `/var/www/dividend-tracker`
- **PM2 App Name**: `dividend-tracker-backend`

## Current Server Status

- ✅ Node.js v20.19.3 installed
- ✅ PM2 v6.0.8 installed
- ✅ Application running on port 5001
- ✅ MongoDB connected
- ✅ Production environment configured
- ✅ Custom domain configured

## Deployment Scripts

### 1. Full Deployment (`deploy-to-vps.sh`)

**Use this for major updates with backup**

```bash
cd backend
./deploy-to-vps.sh
```

**Features:**

- Creates backup of current deployment
- Commits uncommitted changes
- Full deployment with error handling
- Updates frontend configuration
- Health check testing
- Colored output and status messages

### 2. Quick Deployment (`quick-deploy.sh`)

**Use this for fast updates**

```bash
cd backend
./quick-deploy.sh
```

**Features:**

- Fast deployment without backup
- Minimal downtime
- Quick testing of changes

## Manual Deployment Steps

If you prefer to deploy manually:

### 1. Prepare your code

```bash
cd backend
git add .
git commit -m "Deployment update"
```

### 2. Create deployment package

```bash
tar -czf dividend-tracker.tar.gz -C .. .
```

### 3. Upload to server

```bash
scp dividend-tracker.tar.gz root@129.212.145.15:/tmp/
```

### 4. Deploy on server

```bash
ssh root@129.212.145.15
cd /tmp
pm2 stop dividend-tracker-backend
rm -rf /var/www/dividend-tracker
tar -xzf dividend-tracker.tar.gz -C /var/www/
cd /var/www/dividend-tracker/backend
npm install --production
pm2 start server.js --name dividend-tracker-backend --env production
pm2 save
```

## Environment Variables

The server is configured with:

- `NODE_ENV=production`
- `PORT=5001`
- `MONGODB_URI=mongodb+srv://gal:12321@cluster0-7hpz1.gcp.mongodb.net/DividendTracker?retryWrites=true&w=majority`

## Useful Commands

### View Application Status

```bash
ssh root@129.212.145.15 'pm2 status'
```

### View Logs

```bash
ssh root@129.212.145.15 'pm2 logs dividend-tracker-backend'
```

### Restart Application

```bash
ssh root@129.212.145.15 'pm2 restart dividend-tracker-backend'
```

### Monitor Resources

```bash
ssh root@129.212.145.15 'pm2 monit'
```

### View Application Details

```bash
ssh root@129.212.145.15 'pm2 show dividend-tracker-backend'
```

## API Endpoints

After deployment, your API will be available at:

- **Base URL**: https://dividend.share-it-up.com
- **Health Check**: https://dividend.share-it-up.com/api/health
- **API Documentation**: https://dividend.share-it-up.com

### Available Endpoints:

- `GET /api/health` - Health check
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/stocks` - Get stocks
- `GET /api/dividends` - Get dividends
- `GET /api/portfolio` - Get portfolio
- `GET /api/market` - Get market data

## Frontend Configuration

The frontend is configured to use the custom domain:

```javascript
// frontend/src/config/api.js
export const API_BASE_URL = "https://dividend.share-it-up.com";
```

## Domain Configuration

The domain `dividend.share-it-up.com` should be configured to point to your VPS IP `129.212.145.15`. Make sure:

1. **DNS Records**: A record pointing to 129.212.145.15
2. **SSL Certificate**: HTTPS is configured (Let's Encrypt recommended)
3. **Reverse Proxy**: nginx or similar configured to forward requests to port 5001

### SSL Setup (if not already configured):

```bash
# Install certbot
ssh root@129.212.145.15 'apt update && apt install -y certbot'

# Get SSL certificate
ssh root@129.212.145.15 'certbot certonly --standalone -d dividend.share-it-up.com'
```

## Troubleshooting

### Common Issues:

1. **Port already in use**

   ```bash
   ssh root@129.212.145.15 'pm2 stop dividend-tracker-backend'
   ```

2. **Permission denied**

   ```bash
   ssh root@129.212.145.15 'chown -R root:root /var/www/dividend-tracker'
   ```

3. **Dependencies not installed**

   ```bash
   ssh root@129.212.145.15 'cd /var/www/dividend-tracker/backend && npm install --production'
   ```

4. **MongoDB connection issues**

   - Check if MongoDB URI is correct
   - Verify network connectivity

5. **Domain not resolving**
   - Check DNS records
   - Verify domain points to correct IP
   - Check firewall settings

### Check Application Status:

```bash
# Check if app is running
ssh root@129.212.145.15 'pm2 list'

# Check logs for errors
ssh root@129.212.145.15 'pm2 logs dividend-tracker-backend --lines 50'

# Test API endpoint
curl https://dividend.share-it-up.com/api/health
```

## Backup and Restore

### Create Backup:

```bash
ssh root@129.212.145.15 'cp -r /var/www/dividend-tracker /var/www/dividend-tracker-backup-$(date +%Y%m%d-%H%M%S)'
```

### Restore from Backup:

```bash
ssh root@129.212.145.15 'pm2 stop dividend-tracker-backend && rm -rf /var/www/dividend-tracker && cp -r /var/www/dividend-tracker-backup-YYYYMMDD-HHMMSS /var/www/dividend-tracker && pm2 start dividend-tracker-backend'
```

## Security Notes

- The server is running as root (not recommended for production)
- Consider setting up a firewall
- HTTPS is configured with custom domain
- Set up proper environment variables
- Consider using a reverse proxy (nginx)

## Next Steps

1. ✅ SSL certificate configured
2. ✅ Custom domain set up
3. Set up monitoring and alerting
4. Create automated backups
5. Set up CI/CD pipeline
6. Configure nginx as reverse proxy for better performance

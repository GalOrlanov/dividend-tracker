# API Setup Guide for Dividend Tracker

This guide explains how to configure the stock data APIs for the Dividend Tracker app.

## Available Data Sources

The app supports multiple data sources with automatic fallback:

1. **Alpha Vantage API** (Paid/Free tier)
2. **Yahoo Finance API** (Paid)
3. **Finnhub API** (Free tier available)
4. **Yahoo Finance Scraper** (Free - web scraping)
5. **Mock Data** (Fallback - always available)

## Configuration Options

### Option 1: Use Mock Data (Recommended for Development)

Mock data is always available and provides realistic sample data for testing:

```bash
# Enable mock data (default)
USE_MOCK_DATA=true npm run dev

# Or disable to use real APIs
USE_MOCK_DATA=false npm run dev
```

### Option 2: Yahoo Finance Scraper (Free)

The Yahoo Finance scraper extracts real data from Yahoo Finance pages without requiring API keys:

```bash
# No API keys needed - scraper works automatically
USE_MOCK_DATA=false npm run dev
```

**Pros:**

- Completely free
- Real market data
- No API rate limits
- No registration required

**Cons:**

- Slower than APIs
- May break if Yahoo changes their website
- Limited data compared to APIs

### Option 3: Free API Keys

#### Finnhub API (Recommended Free Option)

1. Go to [Finnhub.io](https://finnhub.io/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add to your `.env` file:

```env
FINNHUB_API_KEY=your_finnhub_api_key_here
```

**Free tier limits:**

- 60 API calls per minute
- Real-time stock data
- Company financials
- News data

#### Alpha Vantage API

1. Go to [Alpha Vantage](https://www.alphavantage.co/)
2. Sign up for a free API key
3. Add to your `.env` file:

```env
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
```

**Free tier limits:**

- 5 API calls per minute
- 500 API calls per day

### Option 4: Paid APIs

#### Yahoo Finance API

1. Go to [Yahoo Finance API](https://rapidapi.com/apidojo/api/yahoo-finance1/)
2. Sign up for RapidAPI
3. Subscribe to Yahoo Finance API
4. Add to your `.env` file:

```env
YAHOO_FINANCE_API_KEY=your_yahoo_finance_key_here
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/dividend-tracker

# API Keys (optional - app works without them)
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
YAHOO_FINANCE_API_KEY=your_yahoo_finance_key_here
FINNHUB_API_KEY=your_finnhub_key_here

# Data Source Configuration
USE_MOCK_DATA=true  # Set to false to use real APIs
```

## How It Works

The app uses a hybrid approach:

1. **Priority Order:**

   - Alpha Vantage API (if configured)
   - Yahoo Finance API (if configured)
   - Finnhub API (if configured)
   - Yahoo Finance Scraper (always available)
   - Mock Data (fallback)

2. **Automatic Fallback:**

   - If an API fails or hits rate limits, it automatically tries the next one
   - If all APIs fail, it falls back to mock data
   - This ensures the app always works

3. **Mock Data Mode:**
   - When `USE_MOCK_DATA=true`, the app uses realistic sample data
   - Perfect for development and testing
   - No API calls or rate limits

## Testing Your Setup

1. **Start the backend:**

   ```bash
   cd backend
   npm run dev
   ```

2. **Test search functionality:**

   ```bash
   curl "http://localhost:5001/search?q=AAPL"
   ```

3. **Check which data source is being used:**
   - Look at the console logs to see which API is responding
   - The logs will show: "✅ [API Name] search successful"

## Troubleshooting

### No Search Results

1. **Check API keys:**

   ```bash
   echo $ALPHA_VANTAGE_API_KEY
   echo $FINNHUB_API_KEY
   ```

2. **Test API directly:**

   ```bash
   # Test Finnhub
   curl "https://finnhub.io/api/v1/search?q=AAPL&token=YOUR_KEY"

   # Test Alpha Vantage
   curl "https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=AAPL&apikey=YOUR_KEY"
   ```

3. **Use mock data temporarily:**
   ```bash
   USE_MOCK_DATA=true npm run dev
   ```

### Rate Limit Errors

- APIs have rate limits (especially free tiers)
- The app automatically falls back to other sources
- Consider upgrading to paid plans for higher limits

### Scraper Not Working

- Yahoo Finance may block automated requests
- The scraper includes delays and realistic headers
- If it fails, the app falls back to mock data

## Production Deployment

For production, consider:

1. **Paid API plans** for reliable data
2. **Multiple API keys** for redundancy
3. **Caching** to reduce API calls
4. **Monitoring** API usage and costs

## Current Status

- ✅ Mock data working
- ✅ Yahoo Finance scraper implemented
- ✅ Hybrid service with automatic fallback
- ✅ Multiple API support
- ✅ Rate limit handling

The app is fully functional with mock data and can be upgraded to real APIs as needed.

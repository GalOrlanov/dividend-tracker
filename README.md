# Dividend Tracker App

A professional React Native application for tracking dividend income with a Node.js backend and MongoDB database.

## Features

### 📊 Dashboard

- Monthly dividend income chart
- Summary cards (Total this year, This month, Upcoming, Total dividends)
- Upcoming dividends list
- Quick action buttons

### 💰 Dividend Management

- Add, edit, and delete dividends
- Track shares, dividend per share, and total amounts
- Set ex-dividend and payment dates
- Categorize by sector and frequency
- Add notes for each dividend

### 🔍 Stock Search

- Search stocks by symbol, company name, or sector
- Filter by dividend yield range
- View stock details and metrics
- Add stocks directly to dividend tracker

### 📅 Calendar View

- Interactive calendar showing dividend payment dates
- Monthly summary with totals
- Date-specific dividend details
- Year navigation

### 📱 Professional UI

- Modern Material Design interface
- Responsive layout for all screen sizes
- Intuitive navigation with bottom tabs
- Real-time data updates

## Tech Stack

### Frontend

- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and tools
- **React Navigation** - Navigation between screens
- **React Native Paper** - Material Design components
- **React Native Chart Kit** - Charts and graphs
- **Axios** - HTTP client for API calls

### Backend

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Joi** - Data validation
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## Project Structure

```
dividend-tracker/
├── backend/
│   ├── models/
│   │   ├── Dividend.js
│   │   └── Stock.js
│   ├── routes/
│   │   ├── dividends.js
│   │   └── stocks.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── screens/
│   │   │   ├── DashboardScreen.js
│   │   │   ├── DividendsScreen.js
│   │   │   ├── SearchScreen.js
│   │   │   ├── AddDividendScreen.js
│   │   │   ├── DividendDetailScreen.js
│   │   │   └── CalendarScreen.js
│   │   └── services/
│   │       └── api.js
│   ├── App.js
│   └── package.json
├── package.json
└── README.md
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB Atlas account (or local MongoDB)
- Expo CLI (`npm install -g expo-cli`)

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd dividend-tracker
   ```

2. **Install dependencies**

   ```bash
   npm run install:all
   ```

3. **Configure MongoDB**

   - Update the MongoDB connection string in `backend/server.js`
   - The current connection uses: `mongodb+srv://gal:12321@cluster0-7hpz1.gcp.mongodb.net/DividendTracker?retryWrites=true&w=majority`

4. **Start the backend server**

   ```bash
   npm run dev:backend
   ```

   The API will be available at `http://localhost:5000`

5. **Start the React Native app**

   ```bash
   npm run dev:frontend
   ```

   This will start the Expo development server

6. **Run on device/simulator**
   - Install Expo Go app on your device
   - Scan the QR code from the terminal
   - Or press `i` for iOS simulator or `a` for Android emulator

## API Endpoints

### Dividends

- `GET /api/dividends` - Get all dividends
- `GET /api/dividends/monthly` - Get monthly dividend summary
- `GET /api/dividends/:id` - Get dividend by ID
- `POST /api/dividends` - Create new dividend
- `PUT /api/dividends/:id` - Update dividend
- `DELETE /api/dividends/:id` - Delete dividend
- `GET /api/dividends/upcoming/next` - Get upcoming dividends

### Stocks

- `GET /api/stocks/search` - Search stocks
- `GET /api/stocks` - Get all stocks
- `GET /api/stocks/:symbol` - Get stock by symbol
- `POST /api/stocks` - Create new stock
- `PUT /api/stocks/:symbol` - Update stock
- `DELETE /api/stocks/:symbol` - Delete stock
- `GET /api/stocks/sectors/list` - Get sectors list
- `GET /api/stocks/top/yield` - Get top dividend yield stocks

## Database Schema

### Dividend Model

```javascript
{
  symbol: String,
  companyName: String,
  shares: Number,
  dividendPerShare: Number,
  totalDividend: Number,
  exDate: Date,
  paymentDate: Date,
  frequency: String,
  sector: String,
  notes: String,
  isActive: Boolean
}
```

### Stock Model

```javascript
{
  symbol: String,
  companyName: String,
  sector: String,
  industry: String,
  currentPrice: Number,
  dividendYield: Number,
  dividendPerShare: Number,
  payoutRatio: Number,
  exDividendDate: Date,
  paymentDate: Date,
  frequency: String,
  description: String,
  website: String,
  isActive: Boolean
}
```

## Usage

### Adding Dividends

1. Navigate to the "My Dividends" tab
2. Tap the "+" FAB button
3. Fill in the dividend details
4. Tap "Add Dividend"

### Searching Stocks

1. Go to the "Search Stocks" tab
2. Enter search criteria (symbol, company, sector)
3. Use filters for dividend yield range
4. Tap "Add to Dividends" on desired stocks

### Viewing Calendar

1. Navigate to the "Calendar" tab
2. Select a year using the year selector
3. Tap on dates with dividend payments
4. View detailed information for selected dates

## Development

### Running in Development Mode

```bash
# Start both frontend and backend
npm run dev

# Start only backend
npm run dev:backend

# Start only frontend
npm run dev:frontend
```

### Building for Production

```bash
# Build Android APK
cd frontend
expo build:android

# Build iOS
expo build:ios
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@dividendtracker.com or create an issue in the repository.

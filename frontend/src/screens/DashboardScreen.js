import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, StyleSheet, RefreshControl, Dimensions, TouchableOpacity, Alert } from "react-native";
import { Card, Title, Paragraph, Button, Chip, ActivityIndicator, Text } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { dividendAPI, portfolioAPI, marketDataAPI } from "../services/api";
import { showMessage } from "react-native-flash-message";
import authService from "../services/auth";
import ForecastChart from "../components/ForecastChart";
import ETFCard from "../components/ETFCard";
import StockCard from "../components/StockCard";

const { width } = Dimensions.get("window");

const DashboardScreen = ({ navigation, route }) => {
  const { onLogout } = route.params || {};

  // Add logout function
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await authService.logout();
          // Call the onLogout function to update authentication state
          if (onLogout) {
            onLogout();
          }
        },
      },
    ]);
  };

  // Set up navigation options with logout button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
          <Icon name="logout" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const [portfolioData, setPortfolioData] = useState(null);
  const [etfData, setEtfData] = useState({});
  const [etfLoading, setEtfLoading] = useState({});
  const [stockLoading, setStockLoading] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Popular ETFs to display
  const popularETFs = [
    { symbol: "^GSPC", name: "S&P 500", fullName: "S&P 500 Index" },
    { symbol: "^IXIC", name: "Nasdaq", fullName: "NASDAQ Composite" },
    { symbol: "^DJI", name: "Dow Jones", fullName: "Dow Jones Industrial Average" },
    { symbol: "^NYA", name: "NYSE", fullName: "NYSE Composite" },
  ];

  const fetchETFData = async () => {
    try {
      // Initialize loading state for all ETFs
      const initialLoadingState = {};
      popularETFs.forEach((etf) => {
        initialLoadingState[etf.symbol] = true;
      });
      setEtfLoading(initialLoadingState);

      const etfPromises = popularETFs.map(async (etf) => {
        try {
          setEtfLoading((prev) => ({ ...prev, [etf.symbol]: true }));
          const response = await marketDataAPI.getStockQuote(etf.symbol);
          console.log(`📊 Received quote for ${etf.symbol}:`, response);

          // Extract the actual data from the response
          const quote = response.data || response;
          console.log(`📊 Extracted quote data for ${etf.symbol}:`, quote);

          setEtfLoading((prev) => ({ ...prev, [etf.symbol]: false }));

          return {
            symbol: etf.symbol,
            name: etf.name,
            fullName: etf.fullName,
            price: quote.price || 0,
            change: quote.change || 0,
            changePercent: quote.changePercent || 0,
          };
        } catch (error) {
          console.error(`Error fetching ${etf.symbol}:`, error);
          setEtfLoading((prev) => ({ ...prev, [etf.symbol]: false }));
          return {
            symbol: etf.symbol,
            name: etf.name,
            fullName: etf.fullName,
            price: 0,
            change: 0,
            changePercent: 0,
          };
        }
      });

      const etfResults = await Promise.all(etfPromises);

      // Convert array to object with symbol as key
      const etfDataObject = {};
      etfResults.forEach((etf) => {
        etfDataObject[etf.symbol] = etf;
      });

      console.log("📊 Final ETF data object:", etfDataObject);
      setEtfData(etfDataObject);
    } catch (error) {
      console.error("Error fetching ETF data:", error);
      // Set default data if API fails
      const defaultData = {};
      popularETFs.forEach((etf) => {
        defaultData[etf.symbol] = {
          symbol: etf.symbol,
          name: etf.name,
          fullName: etf.fullName,
          price: 0,
          change: 0,
          changePercent: 0,
        };
      });
      setEtfData(defaultData);
    }
  };

  const fetchStockData = async (portfolio) => {
    if (!portfolio || portfolio.length === 0) return;

    try {
      // Initialize loading state for all stocks
      const initialLoadingState = {};
      portfolio.forEach((stock) => {
        initialLoadingState[stock.symbol] = true;
      });
      setStockLoading(initialLoadingState);

      const stockPromises = portfolio.map(async (stock) => {
        try {
          setStockLoading((prev) => ({ ...prev, [stock.symbol]: true }));
          const response = await marketDataAPI.getStockQuote(stock.symbol);

          // Extract the actual data from the response
          const quote = response.data || response;

          setStockLoading((prev) => ({ ...prev, [stock.symbol]: false }));

          return {
            ...stock,
            currentPrice: quote.price || stock.currentPrice,
            change: quote.change || 0,
            changePercent: quote.changePercent || 0,
          };
        } catch (error) {
          console.error(`Error fetching ${stock.symbol}:`, error);
          setStockLoading((prev) => ({ ...prev, [stock.symbol]: false }));
          return stock;
        }
      });

      const stockResults = await Promise.all(stockPromises);

      // Update portfolio data with current prices
      setPortfolioData((prev) => ({
        ...prev,
        portfolio: stockResults,
      }));
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const portfolioResponse = await portfolioAPI.getPortfolio();
      setPortfolioData(portfolioResponse.data);

      // Fetch current stock prices for portfolio
      if (portfolioResponse.data?.portfolio) {
        await fetchStockData(portfolioResponse.data.portfolio);
      }
    } catch (error) {
      showMessage({
        message: "Error",
        description: "Failed to load dashboard data",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Reset ETF loading states
      const initialLoadingState = {};
      popularETFs.forEach((etf) => {
        initialLoadingState[etf.symbol] = true;
      });
      setEtfLoading(initialLoadingState);

      await Promise.all([fetchDashboardData(), fetchETFData()]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchETFData();
  }, []);

  // Calculate forecast parameters from portfolio data
  const getForecastParameters = () => {
    if (!portfolioData || !portfolioData.portfolio || portfolioData.portfolio.length === 0) {
      return {
        initialInvestment: 10000, // Default value
        annualDividendYield: 3.5, // Default value
      };
    }

    const portfolio = portfolioData.portfolio;
    const totalInvestment = portfolioData.totals.totalInvestment || 0;
    const averageYield = portfolioData.totals.averageYield || 0;

    return {
      initialInvestment: totalInvestment > 0 ? totalInvestment : 10000,
      annualDividendYield: averageYield > 0 ? averageYield : 3.5,
    };
  };

  const forecastParams = getForecastParameters();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2196F3"]} tintColor="#2196F3" />}>
      {/* ETF Cards */}
      <View style={styles.etfContainer}>
        <Title style={styles.sectionTitle}>Market Indices</Title>
        <View style={styles.etfGrid}>
          {popularETFs.map((etf, index) => (
            <View key={etf.symbol} style={styles.etfCardWrapper}>
              <ETFCard
                symbol={etf.symbol}
                name={etf.name}
                fullName={etf.fullName}
                price={etfData[etf.symbol]?.price}
                change={etfData[etf.symbol]?.change}
                changePercent={etfData[etf.symbol]?.changePercent}
                isLoading={etfLoading[etf.symbol]}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Forecast Chart */}
      <ForecastChart initialInvestment={forecastParams.initialInvestment} annualDividendYield={forecastParams.annualDividendYield} years={10} showScenarios={true} />

      {/* Portfolio Stocks */}
      <Card style={styles.stocksCard}>
        <Card.Content>
          <View style={styles.stocksHeader}>
            <Title style={styles.stocksTitle}>Portfolio Stocks</Title>
            <Button mode="text" onPress={() => navigation.navigate("Portfolio")} compact>
              View All
            </Button>
          </View>

          {portfolioData?.portfolio && portfolioData.portfolio.length > 0 ? (
            portfolioData.portfolio.map((stock, index) => <StockCard key={stock._id || stock.symbol || index} stock={stock} isLoading={stockLoading[stock.symbol]} />)
          ) : (
            <View style={styles.emptyState}>
              <Icon name="chart-line" size={48} color="#757575" />
              <Text style={styles.emptyText}>No stocks in portfolio</Text>
              <Button mode="outlined" onPress={() => navigation.navigate("Search")} style={styles.addStockButton}>
                Add Stocks
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
  },
  etfContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    color: "#212121",
  },
  etfGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  etfCardWrapper: {
    width: "48%", // Two columns with some spacing
    marginBottom: 12,
  },
  stocksCard: {
    marginBottom: 16,
  },
  stocksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  stocksTitle: {
    fontSize: 18,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: "#757575",
    marginBottom: 16,
  },
  addStockButton: {
    marginTop: 8,
  },
});

export default DashboardScreen;

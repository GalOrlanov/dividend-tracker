import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { Card, Title, Button } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { portfolioAPI, marketDataAPI } from "../services/api";
import authService from "../services/auth";
import { showMessage } from "react-native-flash-message";
import ETFCard from "../components/ETFCard";
import StockCard from "../components/StockCard";
import ForecastChart from "../components/ForecastChart";

const DashboardScreen = ({ navigation, route }) => {
  const { colors } = useTheme();
  const onLogout = route.params?.onLogout;

  // Add logout function
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await authService.logout();
          // The App.js will automatically detect the logout and show the auth screen
        },
      },
    ]);
  };

  // Set up navigation options with logout button
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
          <MaterialIcons name="logout" size={24} color="white" />
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

  // Separate loading states for each data type
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [etfDataLoading, setEtfDataLoading] = useState(false);
  const [stockDataLoading, setStockDataLoading] = useState(false);

  // Popular ETFs to display
  const popularETFs = [
    { symbol: "^GSPC", name: "S&P 500", fullName: "S&P 500 Index" },
    { symbol: "^IXIC", name: "Nasdaq", fullName: "NASDAQ Composite" },
    { symbol: "^DJI", name: "Dow Jones", fullName: "Dow Jones Industrial Average" },
    { symbol: "^NYA", name: "NYSE", fullName: "NYSE Composite" },
  ];

  const fetchETFData = async () => {
    try {
      setEtfDataLoading(true);
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
    } finally {
      setEtfDataLoading(false);
    }
  };

  const fetchStockData = async (portfolio) => {
    if (!portfolio || portfolio.length === 0) return;

    try {
      setStockDataLoading(true);
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
          console.log(`📈 Received quote for ${stock.symbol}:`, response);

          // Extract the actual data from the response
          const quote = response.data || response;
          console.log(`📈 Extracted quote data for ${stock.symbol}:`, quote);

          setStockLoading((prev) => ({ ...prev, [stock.symbol]: false }));

          return {
            ...stock,
            currentPrice: quote.price || stock.currentPrice || 0,
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

      // Update portfolio data with fresh stock quotes
      setPortfolioData((prev) => ({
        ...prev,
        portfolio: stockResults,
      }));
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setStockDataLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setPortfolioLoading(true);
      const response = await portfolioAPI.getPortfolio();
      console.log("📊 Portfolio data received:", response);

      const portfolioData = response.data;
      setPortfolioData(portfolioData);

      // Fetch fresh stock data independently
      fetchStockData(portfolioData.portfolio);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showMessage({
        message: "Error",
        description: "Failed to load dashboard data",
        type: "danger",
      });
    } finally {
      setPortfolioLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh each data type independently
      await Promise.all([fetchDashboardData(), fetchETFData()]);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Load each data type independently for better UX
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    etfContainer: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
    },
    etfGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    etfCardWrapper: {
      width: "48%",
      marginBottom: 12,
    },
    stocksCard: {
      margin: 16,
      backgroundColor: colors.surface,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    stocksHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    stocksTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    emptyState: {
      alignItems: "center",
      paddingVertical: 32,
    },
    emptyText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
    },
    addStockButton: {
      marginTop: 16,
      borderColor: colors.primary,
    },
    sectionLoading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 20,
    },
    sectionLoadingText: {
      marginLeft: 10,
      fontSize: 14,
      color: colors.textSecondary,
    },
  });

  if (portfolioLoading && !portfolioData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} />}>
      {/* ETF Cards */}
      <View style={styles.etfContainer}>
        <Text style={styles.sectionTitle}>Market Indices</Text>
        {etfDataLoading ? (
          <View style={styles.sectionLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.sectionLoadingText}>Loading market indices...</Text>
          </View>
        ) : (
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
        )}
      </View>

      {/* Forecast Chart */}
      {portfolioLoading ? (
        <Card style={{ margin: 16, backgroundColor: colors.surface }}>
          <Card.Content>
            <View style={styles.sectionLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.sectionLoadingText}>Loading forecast data...</Text>
            </View>
          </Card.Content>
        </Card>
      ) : (
        <ForecastChart initialInvestment={forecastParams.initialInvestment} annualDividendYield={forecastParams.annualDividendYield} years={10} showScenarios={true} />
      )}

      {/* Portfolio Stocks */}
      <Card style={styles.stocksCard}>
        <Card.Content>
          <View style={styles.stocksHeader}>
            <Text style={styles.stocksTitle}>Portfolio Stocks</Text>
            <Button mode="text" onPress={() => navigation.navigate("Portfolio")} compact>
              View All
            </Button>
          </View>

          {portfolioLoading ? (
            <View style={styles.sectionLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.sectionLoadingText}>Loading portfolio...</Text>
            </View>
          ) : portfolioData?.portfolio && portfolioData.portfolio.length > 0 ? (
            portfolioData.portfolio.map((stock, index) => <StockCard key={stock._id || stock.symbol || index} stock={stock} isLoading={stockLoading[stock.symbol]} />)
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="chart-line" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No stocks in portfolio</Text>
              <Button mode="outlined" onPress={() => navigation.navigate("Search")} style={styles.addStockButton} textColor={colors.primary}>
                Add Stocks
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

export default DashboardScreen;

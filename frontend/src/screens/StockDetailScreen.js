import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Modal, Dimensions } from "react-native";
import { Card, Title, Paragraph, Button, ActivityIndicator, Text, FAB, TextInput } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { marketDataAPI } from "../services/api";
import { showMessage } from "react-native-flash-message";
import apiConfig from "../config/api";
import { useTheme } from "../context/ThemeContext";
import PriceChart from "../components/PriceChart";
import TimeframeSelector from "../components/TimeframeSelector";
import ChartCard from "../components/ChartCard";

const { width } = Dimensions.get("window");

const StockDetailScreen = ({ route, navigation }) => {
  let colors;
  try {
    const theme = useTheme();
    colors = theme?.colors;
  } catch (error) {
    console.warn("Theme context not available, using fallback colors");
    colors = {
      background: "#F5F5F5",
      surface: "#FFFFFF",
      primary: "#2196F3",
      text: "#212121",
      textSecondary: "#757575",
      border: "#E0E0E0",
      shadow: "#000000",
    };
  }

  // Ensure all required color properties exist
  colors = {
    background: colors?.background || "#F5F5F5",
    surface: colors?.surface || "#FFFFFF",
    primary: colors?.primary || "#2196F3",
    text: colors?.text || "#212121",
    textSecondary: colors?.textSecondary || "#757575",
    border: colors?.border || "#E0E0E0",
    shadow: colors?.shadow || "#000000",
    success: colors?.success || "#4CAF50",
    error: colors?.error || "#F44336",
  };

  // Basic safety check
  if (!route?.params?.stock) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No stock data provided</Text>
      </View>
    );
  }

  // Safe stock object
  const stock = {
    symbol: route.params.stock?.symbol || "N/A",
    companyName: route.params.stock?.companyName || "Unknown Company",
    currentPrice: route.params.stock?.currentPrice || 0,
  };

  const portfolioData = route.params.portfolioData;
  const isFromPortfolio = !!portfolioData;

  // State
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState(null);
  const [dividendHistory, setDividendHistory] = useState(null);
  const [priceHistory, setPriceHistory] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1m");
  const [chartLoading, setChartLoading] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    price: "",
    date: new Date().toISOString().split("T")[0],
    quantity: "1",
  });
  const [addingToPortfolio, setAddingToPortfolio] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        if (!stock.symbol || stock.symbol === "N/A") {
          throw new Error("Invalid stock symbol");
        }

        const [stockResponse, dividendResponse, priceResponse] = await Promise.all([
          marketDataAPI.getFullStockData(stock.symbol),
          marketDataAPI.getDividendHistory(stock.symbol),
          marketDataAPI.getPriceHistory(stock.symbol, selectedTimeframe),
        ]);

        console.log("📊 StockDetailScreen: Received stock data:", stockResponse.data);
        console.log("📊 StockDetailScreen: Quote data:", stockResponse.data?.quote);
        setStockData(stockResponse.data);
        setDividendHistory(dividendResponse.data);
        setPriceHistory(priceResponse.data);
      } catch (error) {
        console.error("Error loading stock details:", error);
        showMessage({
          message: "Error",
          description: "Failed to load stock details",
          type: "danger",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [stock.symbol]);

  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value) => {
    if (!value || isNaN(value)) return "0.00%";
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const handleTimeframeChange = async (timeframe) => {
    console.log("📊 StockDetailScreen: handleTimeframeChange called", { timeframe, symbol: stock.symbol });

    try {
      setSelectedTimeframe(timeframe);
      setChartLoading(true);

      console.log("📊 StockDetailScreen: Fetching price history for", { symbol: stock.symbol, timeframe });
      const response = await marketDataAPI.getPriceHistory(stock.symbol, timeframe);

      console.log("📊 StockDetailScreen: Price history received", {
        dataLength: response.data?.data?.length || 0,
        timeframe: response.data?.timeframe,
        requestedTimeframe: timeframe,
        symbol: stock.symbol,
        firstDate: response.data?.data?.[0]?.date,
        lastDate: response.data?.data?.[response.data?.data?.length - 1]?.date,
      });

      setPriceHistory(response.data);
    } catch (error) {
      console.error("📊 StockDetailScreen: Error fetching price history:", error);
      showMessage({
        message: "Error",
        description: "Failed to load price history",
        type: "danger",
      });
    } finally {
      setChartLoading(false);
    }
  };

  const getPriceChangeColor = () => {
    console.log("🔍 getPriceChangeColor called:", {
      stockData: stockData,
      quote: stockData?.quote,
      change: stockData?.quote?.change,
      changePercent: stockData?.quote?.changePercent,
      success: colors.success,
      error: colors.error,
      textSecondary: colors.textSecondary,
    });

    // Check if we have change data in the quote object
    if (!stockData?.quote?.change && !stockData?.quote?.changePercent) {
      console.log("🔍 No change data in quote, checking direct properties");
      // Fallback: check if change data is directly on stockData
      if (!stockData?.change && !stockData?.changePercent) {
        console.log("🔍 No change data found anywhere, returning textSecondary");
        return colors.textSecondary;
      }
    }

    // Use changePercent if available, otherwise use change
    const changeValue =
      stockData?.quote?.changePercent !== undefined
        ? stockData.quote.changePercent
        : stockData?.quote?.change !== undefined
        ? stockData.quote.change
        : stockData?.changePercent !== undefined
        ? stockData.changePercent
        : stockData?.change !== undefined
        ? stockData.change
        : 0;
    const isPositive = changeValue >= 0;

    console.log("🔍 Change value:", changeValue, "isPositive:", isPositive);
    return isPositive ? colors.success : colors.error;
  };

  const getPriceChangeIcon = () => {
    console.log("🔍 getPriceChangeIcon called:", {
      stockData: stockData,
      quote: stockData?.quote,
      change: stockData?.quote?.change,
      changePercent: stockData?.quote?.changePercent,
    });

    // Check if we have change data in the quote object
    if (!stockData?.quote?.change && !stockData?.quote?.changePercent) {
      console.log("🔍 No change data in quote, checking direct properties");
      // Fallback: check if change data is directly on stockData
      if (!stockData?.change && !stockData?.changePercent) {
        console.log("🔍 No change data found anywhere, returning minus");
        return "minus";
      }
    }

    // Use changePercent if available, otherwise use change
    const changeValue =
      stockData?.quote?.changePercent !== undefined
        ? stockData.quote.changePercent
        : stockData?.quote?.change !== undefined
        ? stockData.quote.change
        : stockData?.changePercent !== undefined
        ? stockData.changePercent
        : stockData?.change !== undefined
        ? stockData.change
        : 0;
    const isPositive = changeValue >= 0;

    console.log("🔍 Change value:", changeValue, "isPositive:", isPositive);
    return isPositive ? "trending-up" : "trending-down";
  };

  const handleAddToPortfolio = () => {
    const currentPrice = stockData?.quote?.price || stock.currentPrice;
    setPortfolioForm({
      price: currentPrice ? currentPrice.toString() : "",
      date: new Date().toISOString().split("T")[0],
      quantity: "1",
    });
    setShowPortfolioModal(true);
  };

  const handleAddMoreShares = () => {
    const currentPrice = stockData?.quote?.price || stock.currentPrice;
    setPortfolioForm({
      price: currentPrice ? currentPrice.toString() : "",
      date: new Date().toISOString().split("T")[0],
      quantity: "1",
    });
    setShowPortfolioModal(true);
  };

  const handleSubmitPortfolio = async () => {
    if (!portfolioForm.price || !portfolioForm.quantity) {
      showMessage({
        message: "Error",
        description: "Please fill in all required fields",
        type: "danger",
      });
      return;
    }

    const price = parseFloat(portfolioForm.price);
    const quantity = parseInt(portfolioForm.quantity);

    if (isNaN(price) || price <= 0 || isNaN(quantity) || quantity <= 0) {
      showMessage({
        message: "Error",
        description: "Please enter valid values",
        type: "danger",
      });
      return;
    }

    setAddingToPortfolio(true);
    try {
      const portfolioData = {
        symbol: stock.symbol,
        companyName: stock.companyName,
        shares: quantity,
        purchasePrice: price,
        purchaseDate: portfolioForm.date,
      };

      const response = await fetch(`${apiConfig.API_BASE_URL}/api/portfolio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(portfolioData),
      });

      if (response.ok) {
        showMessage({
          message: "Success",
          description: `${stock.symbol} added to portfolio`,
          type: "success",
        });
        setShowPortfolioModal(false);
        setPortfolioForm({ price: "", date: new Date().toISOString().split("T")[0], quantity: "1" });
        navigation.navigate("PortfolioMain");
      } else {
        throw new Error("Failed to add to portfolio");
      }
    } catch (error) {
      showMessage({
        message: "Error",
        description: error.message || "Failed to add stock to portfolio",
        type: "danger",
      });
    } finally {
      setAddingToPortfolio(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading stock details...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {/* Header */}
        <Card style={[styles.headerCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.stockInfo}>
                <Title style={[styles.symbol, { color: colors.text }]}>{stock.symbol}</Title>
                <Paragraph style={[styles.companyName, { color: colors.textSecondary }]}>{stock.companyName}</Paragraph>
              </View>
              <View style={styles.priceInfo}>
                <Text style={[styles.currentPrice, { color: colors.text }]}>{formatCurrency(stockData?.quote?.price || stock.currentPrice)}</Text>
                <View style={styles.changeContainer}>
                  <Icon name={getPriceChangeIcon()} size={16} color={getPriceChangeColor()} />
                  <Text style={[styles.changeText, { color: getPriceChangeColor() }]}>
                    {stockData?.quote?.change !== undefined && stockData.quote.change !== null ? formatCurrency(stockData.quote.change) : "N/A"}
                  </Text>
                  <Text style={[styles.changePercent, { color: getPriceChangeColor() }]}>
                    {stockData?.quote?.changePercent !== undefined && stockData.quote.changePercent !== null ? formatPercentage(stockData.quote.changePercent) : ""}
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isFromPortfolio && (
            <Button mode="contained" onPress={handleAddToPortfolio} style={styles.addButton} icon="plus" loading={addingToPortfolio} disabled={addingToPortfolio}>
              {addingToPortfolio ? "Adding..." : "Add to Portfolio"}
            </Button>
          )}
        </View>

        {/* Stock Information */}
        <Card style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Title style={[styles.infoTitle, { color: colors.text }]}>Stock Information</Title>
            <View style={styles.tableContainer}>
              <View style={[styles.tableHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.tableHeaderText, { color: colors.text }]}>Metric</Text>
                <Text style={[styles.tableHeaderText, { color: colors.text }]}>Value</Text>
              </View>
              <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.tableCell, { color: colors.text }]}>Company</Text>
                <Text style={[styles.tableCell, { color: colors.text }]}>{stockData?.overview?.companyName || stock.companyName}</Text>
              </View>
              <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.tableCell, { color: colors.text }]}>Sector</Text>
                <Text style={[styles.tableCell, { color: colors.text }]}>{stockData?.overview?.sector || "N/A"}</Text>
              </View>
              <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.tableCell, { color: colors.text }]}>Market Cap</Text>
                <Text style={[styles.tableCell, { color: colors.text }]}>{stockData?.overview?.marketCap ? formatCurrency(stockData.overview.marketCap) : "N/A"}</Text>
              </View>
              <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.tableCell, { color: colors.text }]}>P/E Ratio</Text>
                <Text style={[styles.tableCell, { color: colors.text }]}>{stockData?.overview?.peRatio || "N/A"}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Dividend Information */}
        <Card style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <Title style={[styles.infoTitle, { color: colors.text }]}>Dividend Information</Title>
            <View style={styles.tableContainer}>
              <View style={[styles.tableHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                <Text style={[styles.tableHeaderText, { color: colors.text }]}>Metric</Text>
                <Text style={[styles.tableHeaderText, { color: colors.text }]}>Value</Text>
              </View>
              <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.tableCell, { color: colors.text }]}>Dividend Yield</Text>
                <Text style={[styles.tableCell, { color: colors.text }]}>{stockData?.overview?.dividendYield ? `${stockData.overview.dividendYield.toFixed(2)}%` : "N/A"}</Text>
              </View>
              <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.tableCell, { color: colors.text }]}>Dividend Per Share</Text>
                <Text style={[styles.tableCell, { color: colors.text }]}>{stockData?.overview?.dividendPerShare ? formatCurrency(stockData.overview.dividendPerShare) : "N/A"}</Text>
              </View>
              <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.tableCell, { color: colors.text }]}>Frequency</Text>
                <Text style={[styles.tableCell, { color: colors.text }]}>{stockData?.overview?.payoutFrequency || "N/A"}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Price Chart */}
        <ChartCard title="Price Chart" showNoData={!priceHistory?.data || priceHistory.data.length === 0} noDataMessage="Price history data not available for this stock">
          <TimeframeSelector selectedTimeframe={selectedTimeframe} onTimeframeChange={handleTimeframeChange} disabled={chartLoading} />
          <PriceChart
            data={priceHistory?.data || []}
            loading={chartLoading}
            symbol={stock.symbol}
            onPointPress={({ point }) => {
              console.log("Point pressed:", point);
            }}
          />
        </ChartCard>

        {/* Dividend History */}
        {dividendHistory?.dividends && dividendHistory.dividends.length > 0 ? (
          <Card style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Title style={[styles.infoTitle, { color: colors.text }]}>Recent Dividend Payouts</Title>
              <View style={styles.tableContainer}>
                <View style={[styles.tableHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={[styles.tableHeaderText, { color: colors.text }]}>Date</Text>
                  <Text style={[styles.tableHeaderText, { color: colors.text }]}>Amount</Text>
                  <Text style={[styles.tableHeaderText, { color: colors.text }]}>Ex-Date</Text>
                </View>
                {dividendHistory.dividends.slice(0, 10).map((dividend, index) => (
                  <View key={index} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.tableCell, { color: colors.text }]}>{new Date(dividend.date).toLocaleDateString()}</Text>
                    <Text style={[styles.tableCell, { color: colors.text }]}>{formatCurrency(dividend.amount)}</Text>
                    <Text style={[styles.tableCell, { color: colors.text }]}>{dividend.exDate ? new Date(dividend.exDate).toLocaleDateString() : "N/A"}</Text>
                  </View>
                ))}
              </View>
              {dividendHistory.dividends.length > 10 && (
                <View style={styles.moreDividends}>
                  <Text style={[styles.moreDividendsText, { color: colors.textSecondary }]}>+{dividendHistory.dividends.length - 10} more dividend payments</Text>
                </View>
              )}
            </Card.Content>
          </Card>
        ) : (
          <Card style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Title style={[styles.infoTitle, { color: colors.text }]}>Recent Dividend Payouts</Title>
              <Text style={{ color: colors.textSecondary, textAlign: "center", padding: 20 }}>No dividend history available for this stock</Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* FAB for adding more shares */}
      {isFromPortfolio && <FAB style={[styles.fab, { backgroundColor: colors.primary }]} icon="plus" onPress={handleAddMoreShares} label="Add Shares" />}

      {/* Portfolio Modal */}
      <Modal visible={showPortfolioModal} transparent={true} animationType="slide" onRequestClose={() => setShowPortfolioModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Title style={[styles.modalTitle, { color: colors.text }]}>Add More Shares</Title>
              <TouchableOpacity onPress={() => setShowPortfolioModal(false)}>
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formContainer}>
                <TextInput
                  label="Purchase Price ($)"
                  value={portfolioForm.price}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9.]/g, "");
                    const parts = cleaned.split(".");
                    if (parts.length > 2) return;
                    setPortfolioForm({ ...portfolioForm, price: cleaned });
                  }}
                  placeholder="0.00"
                  keyboardType="numeric"
                  style={styles.formInput}
                  mode="outlined"
                  theme={{
                    colors: {
                      primary: colors.primary,
                      background: colors.surface,
                      surface: colors.surface,
                      text: colors.text,
                      placeholder: colors.textSecondary,
                      onSurface: colors.text,
                      onSurfaceVariant: colors.textSecondary,
                    },
                  }}
                />

                <TextInput
                  label="Purchase Date"
                  value={portfolioForm.date}
                  onChangeText={(text) => setPortfolioForm({ ...portfolioForm, date: text })}
                  placeholder="YYYY-MM-DD"
                  style={styles.formInput}
                  mode="outlined"
                  theme={{
                    colors: {
                      primary: colors.primary,
                      background: colors.surface,
                      surface: colors.surface,
                      text: colors.text,
                      placeholder: colors.textSecondary,
                      onSurface: colors.text,
                      onSurfaceVariant: colors.textSecondary,
                    },
                  }}
                />

                <TextInput
                  label="Quantity (Shares)"
                  value={portfolioForm.quantity}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setPortfolioForm({ ...portfolioForm, quantity: cleaned });
                  }}
                  placeholder="1"
                  keyboardType="numeric"
                  style={styles.formInput}
                  mode="outlined"
                  theme={{
                    colors: {
                      primary: colors.primary,
                      background: colors.surface,
                      surface: colors.surface,
                      text: colors.text,
                      placeholder: colors.textSecondary,
                      onSurface: colors.text,
                      onSurfaceVariant: colors.textSecondary,
                    },
                  }}
                />
              </View>

              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={() => setShowPortfolioModal(false)} style={[styles.modalButton, styles.cancelButton]}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleSubmitPortfolio} style={[styles.modalButton, styles.submitButton]} loading={addingToPortfolio} disabled={addingToPortfolio}>
                  {addingToPortfolio ? "Adding..." : "Add Shares"}
                </Button>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  headerCard: {
    margin: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  stockInfo: {
    flex: 1,
  },
  symbol: {
    fontSize: 24,
    fontWeight: "bold",
  },
  companyName: {
    fontSize: 14,
    marginTop: 4,
  },
  priceInfo: {
    alignItems: "flex-end",
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: "bold",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  changeText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 4,
  },
  changePercent: {
    fontSize: 14,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  addButton: {
    flex: 1,
    marginRight: 8,
  },
  dividendButton: {
    flex: 1,
    marginLeft: 8,
  },
  infoCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 8,
    width: "90%",
    maxHeight: "80%",
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBody: {
    padding: 16,
  },
  formContainer: {
    marginBottom: 16,
  },
  formInput: {
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  cancelButton: {
    // Border color will be handled by theme
  },
  submitButton: {
    // Background color will be handled by theme
  },
  moreDividends: {
    alignItems: "center",
    marginTop: 10,
  },
  moreDividendsText: {
    fontSize: 14,
  },
  tableContainer: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
  },
});

export default StockDetailScreen;

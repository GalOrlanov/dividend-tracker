import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Dimensions, Alert, TouchableOpacity, Modal } from "react-native";
import { Card, Title, Paragraph, Button, Chip, ActivityIndicator, Text, Divider, DataTable, FAB, TextInput } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { marketDataAPI } from "../services/api";
import { showMessage } from "react-native-flash-message";
import { BarChart } from "react-native-chart-kit";
import { Chart, Line, HorizontalAxis } from "react-native-responsive-linechart";
import apiConfig from "../config/api";

// Custom Tooltip Component
const CustomTooltip = (a) => {
  if (!a.value) return null;
  console.log(a);
  // Calculate the position of the crosshair line
  const xPosition = a?.position?.x ?? 0;

  return (
    <View style={styles.staticTooltipContainer}>
      {/* Vertical crosshair line */}
      <View
        style={[
          styles.crosshairLine,
          {
            left: xPosition, // Add left padding offset
          },
        ]}
      />

      <View style={[styles.staticTooltipContent, { top: -10, left: Dimensions.get("window").width / 2 - 115 }]}>
        <Text style={styles.staticTooltipText}>
          ${a.value.meta.price.toFixed(2)} • {new Date(a.value.meta.date).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
};

const { width } = Dimensions.get("window");

const StockDetailScreen = ({ route, navigation }) => {
  const { stock, portfolioData } = route.params;
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState(null);
  const [dividendHistory, setDividendHistory] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1m");
  const [priceData, setPriceData] = useState(null);
  const [tooltipData, setTooltipData] = useState(null);

  // Check if opened from portfolio
  const isFromPortfolio = !!portfolioData;

  // Portfolio modal state
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    price: "",
    date: new Date().toISOString().split("T")[0], // Today's date
    quantity: "1",
  });

  const timeframes = [
    { key: "7d", label: "7D" },
    { key: "1m", label: "1M" },
    { key: "3m", label: "3M" },
    { key: "6m", label: "6M" },
    { key: "1y", label: "1Y" },
    { key: "5y", label: "5Y" },
    { key: "all", label: "ALL" },
  ];

  useEffect(() => {
    fetchStockDetails();
  }, []);

  const fetchStockDetails = async () => {
    try {
      setLoading(true);
      const [stockResponse, dividendResponse] = await Promise.all([marketDataAPI.getFullStockData(stock.symbol), marketDataAPI.getDividendHistory(stock.symbol)]);

      setStockData(stockResponse.data);
      setDividendHistory(dividendResponse.data);

      // Fetch real price data for the default timeframe
      await fetchPriceData(selectedTimeframe);
    } catch (error) {
      console.error("Error fetching stock details:", error);
      showMessage({
        message: "Error",
        description: "Failed to load stock details",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceData = async (timeframe) => {
    try {
      console.log(`📈 Fetching price data for ${stock.symbol} (${timeframe})`);
      const response = await marketDataAPI.getPriceHistory(stock.symbol, timeframe);

      if (response.data && response.data.data && response.data.data.length > 0) {
        setPriceData(response.data.data);
        console.log(`✅ Loaded ${response.data.data.length} price points`);
      } else {
        console.log("⚠️ No price data available, using fallback");
        generateMockPriceData();
      }
    } catch (error) {
      console.error("Error fetching price data:", error);
      // Fallback to mock data if API fails
      generateMockPriceData();
    }
  };

  const generateMockPriceData = () => {
    // Generate mock price data for demonstration
    const days = 30;
    const basePrice = stock.currentPrice || 100;
    const data = [];

    for (let i = days; i >= 0; i--) {
      const randomChange = (Math.random() - 0.5) * 0.1; // ±5% daily change
      const price = basePrice * (1 + randomChange);
      data.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        price: parseFloat(price.toFixed(2)),
      });
    }

    setPriceData(data);
  };

  const getPriceChangeColor = () => {
    if (!stockData?.quote?.change) return "#757575";
    return stockData.quote.change >= 0 ? "#4CAF50" : "#F44336";
  };

  const getPriceChangeIcon = () => {
    if (!stockData?.quote?.change) return "minus";
    return stockData.quote.change >= 0 ? "trending-up" : "trending-down";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Portfolio-specific calculations
  const getPortfolioCalculations = () => {
    if (!isFromPortfolio || !portfolioData || !stockData?.quote?.price) return null;

    const currentPrice = stockData.quote.price;
    const shares = portfolioData.shares;
    const purchasePrice = portfolioData.purchasePrice;
    const annualDividendIncome = portfolioData.totalDividendIncome || 0;

    return {
      totalValue: currentPrice * shares,
      totalCost: purchasePrice * shares,
      capitalGainLoss: (currentPrice - purchasePrice) * shares,
      capitalGainLossPercent: ((currentPrice - purchasePrice) / purchasePrice) * 100,
      annualDividendIncome: annualDividendIncome,
      monthlyDividendIncome: annualDividendIncome / 12,
      dailyDividendIncome: annualDividendIncome / 365,
      yieldOnCost: portfolioData.yieldOnCost || 0,
    };
  };

  const handleAddToPortfolio = () => {
    Alert.alert("Add to Portfolio", `Add ${stock.symbol} to your portfolio?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Add",
        onPress: () => {
          navigation.navigate("AddStock", { stock });
        },
      },
    ]);
  };

  const handleAddMoreShares = () => {
    // Set the current price as default purchase price
    const currentPrice = stockData?.quote?.price || stock.currentPrice;
    setPortfolioForm({
      price: currentPrice ? currentPrice.toString() : "",
      date: new Date().toISOString().split("T")[0],
      quantity: "1",
    });
    setShowPortfolioModal(true);
  };

  const handleSubmitPortfolio = async () => {
    // Validate required fields
    if (!portfolioForm.price || !portfolioForm.quantity) {
      showMessage({
        message: "Error",
        description: "Please fill in all required fields",
        type: "danger",
      });
      return;
    }

    // Validate numeric values
    const price = parseFloat(portfolioForm.price);
    const quantity = parseInt(portfolioForm.quantity);

    if (isNaN(price) || price <= 0) {
      showMessage({
        message: "Error",
        description: "Please enter a valid purchase price",
        type: "danger",
      });
      return;
    }

    if (isNaN(quantity) || quantity <= 0) {
      showMessage({
        message: "Error",
        description: "Please enter a valid quantity",
        type: "danger",
      });
      return;
    }

    try {
      const portfolioData = {
        symbol: stock.symbol,
        companyName: stock.companyName || stockData?.overview?.companyName,
        shares: quantity,
        purchasePrice: price,
        purchaseDate: portfolioForm.date,
      };

      // Call the portfolio API to add the stock
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

        // Navigate back to portfolio to see the updated data
        navigation.navigate("PortfolioMain");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add to portfolio");
      }
    } catch (error) {
      showMessage({
        message: "Error",
        description: error.message || "Failed to add stock to portfolio",
        type: "danger",
      });
    }
  };

  const renderPriceChart = () => {
    if (!priceData) return null;

    // Prepare data for react-native-responsive-linechart
    const chartData = priceData.map((item, index) => ({
      x: index,
      y: item.price,
      meta: {
        date: item.date,
        price: item.price,
      },
    }));

    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <Title style={styles.chartTitle}>Price Chart</Title>
          {/* Timeframe Selector */}
          <View style={styles.timeframeContainer}>
            {timeframes.map((timeframe) => (
              <Chip
                key={timeframe.key}
                selected={selectedTimeframe === timeframe.key}
                onPress={() => {
                  setSelectedTimeframe(timeframe.key);
                  fetchPriceData(timeframe.key);
                }}
                style={styles.timeframeChip}
                textStyle={{ fontSize: 12 }}
              >
                {timeframe.label}
              </Chip>
            ))}
          </View>
          <View style={styles.chartContainer}>
            <Chart
              style={{ height: 250, width: "100%" }}
              data={chartData}
              xDomain={{ min: 0, max: priceData.length - 1 }}
              yDomain={{
                min: Math.min(...priceData.map((item) => item.price)) * 0.99,
                max: Math.max(...priceData.map((item) => item.price)) * 1.01,
              }}
              padding={{ left: 20, top: 20, bottom: 20, right: 20 }}
            >
              <Line
                theme={{
                  stroke: { color: "#2196F3", width: 2 },
                }}
                tooltipComponent={<CustomTooltip value={tooltipData} />}
                onTooltipSelect={(value) => {
                  setTooltipData(value);
                }}
              />
              <HorizontalAxis
                tickCount={6}
                theme={{
                  labels: {
                    formatter: (v) => {
                      const index = Math.floor(v);
                      if (index >= 0 && index < priceData.length) {
                        const date = new Date(priceData[index].date);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }
                      return "";
                    },
                  },
                }}
              />
            </Chart>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderStockInfo = () => {
    if (!stockData) return null;

    return (
      <Card style={styles.infoCard}>
        <Card.Content>
          <Title style={styles.infoTitle}>Stock Information</Title>

          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Metric</DataTable.Title>
              <DataTable.Title numeric>Value</DataTable.Title>
            </DataTable.Header>

            <DataTable.Row>
              <DataTable.Cell>Company</DataTable.Cell>
              <DataTable.Cell numeric>{stockData.overview?.companyName || stock.companyName}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Sector</DataTable.Cell>
              <DataTable.Cell numeric>{stockData.overview?.sector || stock.sector}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Industry</DataTable.Cell>
              <DataTable.Cell numeric>{stockData.overview?.industry || "N/A"}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Market Cap</DataTable.Cell>
              <DataTable.Cell numeric>{stockData.overview?.marketCap ? formatCurrency(stockData.overview.marketCap) : "N/A"}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>P/E Ratio</DataTable.Cell>
              <DataTable.Cell numeric>{stockData.overview?.peRatio || "N/A"}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Beta</DataTable.Cell>
              <DataTable.Cell numeric>{stockData.overview?.beta || "N/A"}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Employees</DataTable.Cell>
              <DataTable.Cell numeric>{stockData.overview?.employees ? stockData.overview.employees.toLocaleString() : "N/A"}</DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </Card.Content>
      </Card>
    );
  };

  const renderDividendInfo = () => {
    if (!stockData) return null;

    return (
      <Card style={styles.infoCard}>
        <Card.Content>
          <Title style={styles.infoTitle}>Dividend Information</Title>

          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Metric</DataTable.Title>
              <DataTable.Title numeric>Value</DataTable.Title>
            </DataTable.Header>

            <DataTable.Row>
              <DataTable.Cell>Dividend Yield</DataTable.Cell>
              <DataTable.Cell numeric>{stockData.overview?.dividendYield ? `${stockData.overview.dividendYield.toFixed(2)}%` : "N/A"}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Dividend Per Share</DataTable.Cell>
              <DataTable.Cell numeric>{stockData.overview?.dividendPerShare ? formatCurrency(stockData.overview.dividendPerShare) : "N/A"}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Payout Ratio</DataTable.Cell>
              <DataTable.Cell numeric>{stockData.overview?.payoutRatio ? `${stockData.overview.payoutRatio.toFixed(2)}%` : "N/A"}</DataTable.Cell>
            </DataTable.Row>

            <DataTable.Row>
              <DataTable.Cell>Frequency</DataTable.Cell>
              <DataTable.Cell numeric>{stockData.overview?.payoutFrequency || stock.frequency || "N/A"}</DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </Card.Content>
      </Card>
    );
  };

  const renderDividendHistory = () => {
    if (!dividendHistory?.dividends || dividendHistory.dividends.length === 0) {
      return (
        <Card style={styles.infoCard}>
          <Card.Content>
            <Title style={styles.infoTitle}>Dividend History</Title>
            <Text style={styles.noDataText}>No dividend history available</Text>
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card style={styles.infoCard}>
        <Card.Content>
          <Title style={styles.infoTitle}>Recent Dividend Payments</Title>

          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Date</DataTable.Title>
              <DataTable.Title numeric>Amount</DataTable.Title>
            </DataTable.Header>

            {dividendHistory.dividends.slice(0, 10).map((dividend, index) => (
              <DataTable.Row key={index}>
                <DataTable.Cell>{formatDate(dividend.date)}</DataTable.Cell>
                <DataTable.Cell numeric>{formatCurrency(dividend.amount)}</DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading stock details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Header with Stock Info */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.stockInfo}>
                <Title style={styles.symbol}>{stock.symbol}</Title>
                <Paragraph style={styles.companyName}>{stock.companyName}</Paragraph>
              </View>
              <View style={styles.priceInfo}>
                <Text style={styles.currentPrice}>{formatCurrency(stockData?.quote?.price || stock.currentPrice)}</Text>
                <View style={styles.changeContainer}>
                  <Icon name={getPriceChangeIcon()} size={16} color={getPriceChangeColor()} />
                  <Text style={[styles.changeText, { color: getPriceChangeColor() }]}>{stockData?.quote?.change ? formatCurrency(stockData.quote.change) : "N/A"}</Text>
                  <Text style={[styles.changePercent, { color: getPriceChangeColor() }]}>{stockData?.quote?.changePercent ? formatPercentage(stockData.quote.changePercent) : ""}</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Portfolio Information (if opened from portfolio) */}
        {isFromPortfolio &&
          (() => {
            const portfolioCalc = getPortfolioCalculations();
            if (!portfolioCalc) return null;

            return (
              <Card style={styles.infoCard}>
                <Card.Content>
                  <Title style={styles.infoTitle}>Portfolio Position</Title>
                  <View style={styles.portfolioGrid}>
                    <View style={styles.portfolioItem}>
                      <Text style={styles.portfolioLabel}>Shares Owned</Text>
                      <Text style={styles.portfolioValue}>{portfolioData.shares.toLocaleString()}</Text>
                    </View>
                    <View style={styles.portfolioItem}>
                      <Text style={styles.portfolioLabel}>Total Value</Text>
                      <Text style={styles.portfolioValue}>{formatCurrency(portfolioCalc.totalValue)}</Text>
                    </View>
                    <View style={styles.portfolioItem}>
                      <Text style={styles.portfolioLabel}>Total Cost</Text>
                      <Text style={styles.portfolioValue}>{formatCurrency(portfolioCalc.totalCost)}</Text>
                    </View>
                    <View style={styles.portfolioItem}>
                      <Text style={styles.portfolioLabel}>Capital G/L</Text>
                      <Text style={[styles.portfolioValue, { color: portfolioCalc.capitalGainLoss >= 0 ? "#4CAF50" : "#F44336" }]}>
                        {formatCurrency(portfolioCalc.capitalGainLoss)} ({formatPercentage(portfolioCalc.capitalGainLossPercent)})
                      </Text>
                    </View>
                    <View style={styles.portfolioItem}>
                      <Text style={styles.portfolioLabel}>Annual Dividends</Text>
                      <Text style={styles.portfolioValue}>{formatCurrency(portfolioCalc.annualDividendIncome)}</Text>
                    </View>
                    <View style={styles.portfolioItem}>
                      <Text style={styles.portfolioLabel}>Monthly Dividends</Text>
                      <Text style={styles.portfolioValue}>{formatCurrency(portfolioCalc.monthlyDividendIncome)}</Text>
                    </View>
                    <View style={styles.portfolioItem}>
                      <Text style={styles.portfolioLabel}>Daily Dividends</Text>
                      <Text style={styles.portfolioValue}>{formatCurrency(portfolioCalc.dailyDividendIncome)}</Text>
                    </View>
                    <View style={styles.portfolioItem}>
                      <Text style={styles.portfolioLabel}>Yield on Cost</Text>
                      <Text style={styles.portfolioValue}>{formatPercentage(portfolioCalc.yieldOnCost)}</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            );
          })()}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isFromPortfolio && (
            <Button mode="contained" onPress={handleAddToPortfolio} style={styles.addButton} icon="plus">
              Add to Portfolio
            </Button>
          )}
          <Button mode="outlined" onPress={() => navigation.navigate("AddDividend", { stock })} style={[styles.dividendButton, !isFromPortfolio && { flex: 1 }]} icon="cash-multiple">
            Track Dividends
          </Button>
        </View>

        {/* Price Chart */}
        {renderPriceChart()}

        {/* Stock Information */}
        {renderStockInfo()}

        {/* Dividend Information */}
        {renderDividendInfo()}

        {/* Dividend History */}
        {renderDividendHistory()}
      </ScrollView>

      {/* FAB for adding more shares (only when opened from portfolio) */}
      {isFromPortfolio && <FAB style={styles.fab} icon="plus" onPress={handleAddMoreShares} label="Add Shares" />}

      {/* Portfolio Modal */}
      <Modal visible={showPortfolioModal} transparent={true} animationType="slide" onRequestClose={() => setShowPortfolioModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Title style={styles.modalTitle}>Add More Shares</Title>
              <TouchableOpacity onPress={() => setShowPortfolioModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Card style={styles.stockSummaryCard}>
                <Card.Content>
                  <Text style={styles.stockSummaryName}>{stock.companyName || stockData?.overview?.companyName}</Text>
                  <Text style={styles.stockSummarySymbol}>{stock.symbol}</Text>
                  <Text style={styles.stockSummaryPrice}>Current Price: ${stockData?.quote?.price ? stockData.quote.price.toFixed(2) : "N/A"}</Text>
                  {stockData?.overview?.dividendYield > 0 && <Text style={styles.stockSummaryYield}>Dividend Yield: {stockData.overview.dividendYield.toFixed(2)}%</Text>}
                </Card.Content>
              </Card>

              <View style={styles.formContainer}>
                <TextInput
                  label="Purchase Price ($)"
                  value={portfolioForm.price}
                  onChangeText={(text) => {
                    // Only allow numbers and decimal point
                    const cleaned = text.replace(/[^0-9.]/g, "");
                    // Ensure only one decimal point
                    const parts = cleaned.split(".");
                    if (parts.length > 2) return;
                    setPortfolioForm({ ...portfolioForm, price: cleaned });
                  }}
                  placeholder="0.00"
                  keyboardType="numeric"
                  style={styles.formInput}
                  mode="outlined"
                  error={portfolioForm.price && (isNaN(parseFloat(portfolioForm.price)) || parseFloat(portfolioForm.price) <= 0)}
                />

                <TextInput
                  label="Purchase Date"
                  value={portfolioForm.date}
                  onChangeText={(text) => setPortfolioForm({ ...portfolioForm, date: text })}
                  placeholder="YYYY-MM-DD"
                  style={styles.formInput}
                  mode="outlined"
                />

                <TextInput
                  label="Quantity (Shares)"
                  value={portfolioForm.quantity}
                  onChangeText={(text) => {
                    // Only allow whole numbers
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setPortfolioForm({ ...portfolioForm, quantity: cleaned });
                  }}
                  placeholder="1"
                  keyboardType="numeric"
                  style={styles.formInput}
                  mode="outlined"
                  error={portfolioForm.quantity && (isNaN(parseInt(portfolioForm.quantity)) || parseInt(portfolioForm.quantity) <= 0)}
                />

                {/* Dividend and Cost Summary Section */}
                <View style={styles.dividendSummaryBox}>
                  {(() => {
                    const price = parseFloat(portfolioForm.price) || 0;
                    const quantity = parseInt(portfolioForm.quantity) || 0;
                    const dividendPerShare = stockData?.overview?.dividendPerShare || 0;
                    const frequency = stockData?.overview?.payoutFrequency || "quarterly";
                    let freqMultiplier = 4;
                    if (frequency === "monthly") freqMultiplier = 12;
                    else if (frequency === "quarterly") freqMultiplier = 4;
                    else if (frequency === "semi-annual") freqMultiplier = 2;
                    else if (frequency === "annual") freqMultiplier = 1;
                    const totalCost = price * quantity;
                    const annualDividend = dividendPerShare * quantity * freqMultiplier;
                    return (
                      <>
                        <Text style={styles.dividendSummaryTitle}>Summary</Text>
                        <View style={styles.dividendSummaryRow}>
                          <Text style={styles.dividendSummaryLabel}>Total Cost:</Text>
                          <Text style={styles.dividendSummaryValue}>${totalCost.toFixed(2)}</Text>
                        </View>
                        <View style={styles.dividendSummaryRow}>
                          <Text style={styles.dividendSummaryLabel}>Expected Annual Dividend:</Text>
                          <Text style={styles.dividendSummaryValue}>${annualDividend.toFixed(2)}</Text>
                        </View>
                        <View style={styles.dividendSummaryRow}>
                          <Text style={styles.dividendSummaryLabel}>Dividend Yield:</Text>
                          <Text style={styles.dividendSummaryValue}>{stockData?.overview?.dividendYield ? stockData.overview.dividendYield.toFixed(2) + "%" : "N/A"}</Text>
                        </View>
                      </>
                    );
                  })()}
                </View>

                {/* Helper text */}
                <View style={styles.helperTextContainer}>
                  <Text style={styles.helperText}>💡 Current price and dividend data will be automatically updated when added to portfolio.</Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button mode="outlined" onPress={() => setShowPortfolioModal(false)} style={[styles.modalButton, styles.cancelButton]}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={handleSubmitPortfolio} style={[styles.modalButton, styles.submitButton]}>
                  Add to Portfolio
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
    backgroundColor: "#F5F5F5",
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
    color: "#212121",
  },
  companyName: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  priceInfo: {
    alignItems: "flex-end",
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
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
  chartCard: {
    margin: 16,
    marginTop: 0,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  timeframeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  timeframeChip: {
    marginRight: 4,
    height: 32,
  },
  timeframeText: {
    fontSize: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
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
  noDataText: {
    textAlign: "center",
    color: "#757575",
    fontStyle: "italic",
    marginVertical: 32,
  },

  chartContainer: {
    position: "relative",
  },
  chartTouchArea: {
    position: "relative",
  },

  staticTooltipContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: "none",
  },
  crosshairLine: {
    position: "absolute",
    width: 1,
    backgroundColor: "#2196F3",
    opacity: 0.7,
  },
  crosshairLineHorizontal: {
    position: "absolute",
    height: 1,
    backgroundColor: "#2196F3",
    opacity: 0.7,
  },
  staticTooltipContent: {
    position: "absolute",
    backgroundColor: "#333",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#2196F3",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: 170,
    zIndex: 20,
  },
  staticTooltipText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  portfolioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  portfolioItem: {
    width: "48%",
    marginBottom: 16,
  },
  portfolioLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  portfolioValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
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
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBody: {
    padding: 16,
  },
  stockSummaryCard: {
    marginBottom: 16,
  },
  stockSummaryName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  stockSummarySymbol: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 4,
  },
  stockSummaryPrice: {
    fontSize: 14,
    color: "#212121",
    marginBottom: 2,
  },
  stockSummaryYield: {
    fontSize: 14,
    color: "#4CAF50",
  },
  formContainer: {
    marginBottom: 16,
  },
  formInput: {
    marginBottom: 12,
  },
  dividendSummaryBox: {
    backgroundColor: "#F5F5F5",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  dividendSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  dividendSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dividendSummaryLabel: {
    fontSize: 14,
    color: "#757575",
  },
  dividendSummaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
  },
  helperTextContainer: {
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    color: "#1976D2",
    fontStyle: "italic",
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
    borderColor: "#757575",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
  },
});

export default StockDetailScreen;

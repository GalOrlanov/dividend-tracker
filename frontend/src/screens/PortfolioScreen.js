import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions, Alert, ActivityIndicator } from "react-native";
import { Card, Title, Paragraph, Button, TextInput, Portal, Modal, IconButton, Menu, Divider, Chip, FAB } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { BarChart, PieChart } from "react-native-gifted-charts";

import { portfolioAPI } from "../services/api";
import authService from "../services/auth";
import { showMessage } from "react-native-flash-message";
import PurchaseHistoryModal from "../components/PurchaseHistoryModal";

const { width } = Dimensions.get("window");

const PortfolioScreen = ({ navigation }) => {
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
  const [portfolio, setPortfolio] = useState([]);
  const [dividendHistory, setDividendHistory] = useState([]);
  const [upcomingPayouts, setUpcomingPayouts] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("portfolio");

  // Separate loading states for each data type
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [dividendHistoryLoading, setDividendHistoryLoading] = useState(false);
  const [upcomingPayoutsLoading, setUpcomingPayoutsLoading] = useState(false);
  const [chartDataLoading, setChartDataLoading] = useState(false);

  const [menuVisible, setMenuVisible] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ shares: "", purchasePrice: "" });
  const [selectedStock, setSelectedStock] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [chartPopupVisible, setChartPopupVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [purchaseHistoryVisible, setPurchaseHistoryVisible] = useState(false);
  const [selectedStockForHistory, setSelectedStockForHistory] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    // Load each data type independently for better UX
    loadPortfolio();
    loadDividendHistory();
    loadUpcomingPayouts();

    // Removed auto-generation to prevent duplicate entries and inconsistent amounts
    // Future dividends should only be generated manually when needed
  }, []);

  useEffect(() => {
    // Extract available years from dividend history
    const years = [
      ...new Set(
        dividendHistory
          .map((entry) => {
            if (entry.year !== undefined) {
              return entry.year;
            } else if (entry.date) {
              return new Date(entry.date).getFullYear();
            }
            return null;
          })
          .filter((year) => year !== null)
      ),
    ].sort((a, b) => b - a);

    setAvailableYears(years);
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [dividendHistory]);

  // Load chart data when selected year changes or on initial mount
  useEffect(() => {
    if (selectedYear) {
      loadChartData(selectedYear);
    }
  }, [selectedYear]);

  const loadPortfolio = async () => {
    try {
      setPortfolioLoading(true);
      const response = await portfolioAPI.getPortfolio();
      setPortfolio(response.data.portfolio);
      setTotals(response.data.totals);
    } catch (error) {
      console.error("Error loading portfolio:", error);
      showMessage({
        message: "Error",
        description: "Failed to load portfolio",
        type: "danger",
      });
    } finally {
      setPortfolioLoading(false);
    }
  };

  const loadDividendHistory = async () => {
    try {
      setDividendHistoryLoading(true);
      const response = await portfolioAPI.getDividendHistory();
      const data = response.data;
      setDividendHistory(data.history || []);
    } catch (error) {
      console.error("Error loading dividend history:", error);
    } finally {
      setDividendHistoryLoading(false);
    }
  };

  const loadUpcomingPayouts = async () => {
    try {
      setUpcomingPayoutsLoading(true);
      const response = await portfolioAPI.getUpcomingPayouts();
      const data = response.data;
      setUpcomingPayouts(data.upcomingPayouts || []);
    } catch (error) {
      console.error("Error loading upcoming payouts:", error);
    } finally {
      setUpcomingPayoutsLoading(false);
    }
  };

  const loadChartData = async (year) => {
    try {
      setChartDataLoading(true);
      const response = await portfolioAPI.getDividendChartData(year);
      setChartData(response.data);
    } catch (error) {
      console.error("Error loading chart data:", error);
      // Fallback to null if API fails
      setChartData(null);
    } finally {
      setChartDataLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh each data type independently
      await Promise.all([loadPortfolio(), loadDividendHistory(), loadUpcomingPayouts(), loadChartData(selectedYear)]);
    } catch (error) {
      console.error("❌ Error during refresh:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const refreshStockData = async (stockId) => {
    try {
      await portfolioAPI.refreshStock(stockId);
      await loadPortfolio();
      Alert.alert("Success", "Stock data refreshed");
    } catch (error) {
      console.error("Error refreshing stock data:", error);
      Alert.alert("Error", "Failed to refresh stock data");
    }
  };

  const deleteStock = async (stockId) => {
    Alert.alert("Delete Stock", "Are you sure you want to delete this stock from your portfolio?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await portfolioAPI.deleteStock(stockId);
            await loadPortfolio();
            Alert.alert("Success", "Stock removed from portfolio");
          } catch (error) {
            console.error("Error deleting stock:", error);
            Alert.alert("Error", "Failed to delete stock");
          }
        },
      },
    ]);
  };

  const openEditModal = (stock) => {
    setSelectedStock(stock);
    setEditForm({ shares: stock.shares.toString(), purchasePrice: stock.purchasePrice.toString() });
    setEditModalVisible(true);
  };

  const saveEdit = async () => {
    // Validate inputs
    const shares = parseFloat(editForm.shares);
    const purchasePrice = parseFloat(editForm.purchasePrice);

    if (isNaN(shares) || shares <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid number of shares (greater than 0)");
      return;
    }

    if (isNaN(purchasePrice) || purchasePrice <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid purchase price (greater than 0)");
      return;
    }

    try {
      await portfolioAPI.updateStock(selectedStock._id, {
        shares: shares,
        purchasePrice: purchasePrice,
      });
      await loadPortfolio();
      setEditModalVisible(false);
      Alert.alert("Success", "Stock updated successfully");
    } catch (error) {
      console.error("Error updating stock:", error);
      Alert.alert("Error", "Failed to update stock");
    }
  };

  const deleteStockFromModal = () => {
    setEditModalVisible(false);
    if (selectedStock) {
      deleteStock(selectedStock._id);
    }
  };

  const openPurchaseHistory = (stock) => {
    setSelectedStockForHistory(stock.symbol);
    setPurchaseHistoryVisible(true);
    setMenuVisible(null);
  };

  const closePurchaseHistory = () => {
    setPurchaseHistoryVisible(false);
    setSelectedStockForHistory(null);
  };

  const openDetailModal = async (stock) => {
    try {
      // Navigate to StockDetailScreen with portfolio data
      navigation.navigate("StockDetail", {
        stock: {
          symbol: stock.symbol,
          companyName: stock.companyName,
          currentPrice: stock.currentPrice,
        },
        portfolioData: stock,
      });
    } catch (error) {
      console.error("Error opening stock detail:", error);
      Alert.alert("Error", "Failed to open stock details");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatMonthYear = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const getDaysUntil = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getMonthlyDividends = (monthLabel) => {
    if (!monthLabel || !dividendHistory.length) return [];

    // Parse month label (e.g., "Jan", "Feb", etc.)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = monthNames.findIndex((name) => monthLabel.toLowerCase().includes(name.toLowerCase()));

    if (monthIndex === -1) return [];

    // Filter dividend history for the selected month and year
    return dividendHistory.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === monthIndex && entryDate.getFullYear() === selectedYear;
    });
  };
  const getChartData = () => {
    // If we have chart data from the API, use it
    if (chartData && chartData.datasets && chartData.datasets[0] && chartData.datasets[0].data) {
      return {
        labels: chartData.labels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [
          {
            data: chartData.datasets[0].data,
          },
        ],
        tooltipData: chartData.datasets[0].data.map((amount, index) => ({
          month: (chartData.labels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])[index],
          amount: amount,
          formattedAmount: formatCurrency(amount),
        })),
      };
    }

    // Fallback to processing dividend history (limited to 1000 docs)
    const monthlyData = {};

    // Add historical dividend data for the selected year
    const yearData = dividendHistory.filter((entry) => {
      // Handle different possible data structures
      if (entry.year !== undefined) {
        return entry.year === selectedYear;
      } else if (entry.date) {
        const entryDate = new Date(entry.date);
        return entryDate.getFullYear() === selectedYear;
      }
      return false;
    });

    yearData.forEach((entry) => {
      let month;
      if (entry.month !== undefined) {
        month = entry.month;
      } else if (entry.date) {
        const entryDate = new Date(entry.date);
        month = entryDate.getMonth() + 1; // Convert to 1-based month
      } else {
        return; // Skip entries without month data
      }

      const key = `${selectedYear}-${month.toString().padStart(2, "0")}`;
      // Ensure proper number handling
      const amount = Number(entry.totalAmount || entry.amount || 0) || 0;
      monthlyData[key] = (Number(monthlyData[key]) || 0) + amount;
    });

    // Only add upcoming payout data for the current year (not future years)
    // This prevents duplication with dividendHistory data for future years
    const currentYear = new Date().getFullYear();
    if (selectedYear === currentYear) {
      upcomingPayouts.forEach((payout) => {
        if (payout.payoutDate) {
          const payoutDate = new Date(payout.payoutDate);
          if (payoutDate.getFullYear() === selectedYear) {
            const month = payoutDate.getMonth() + 1; // Convert to 1-based month
            const key = `${selectedYear}-${month.toString().padStart(2, "0")}`;
            const amount = Number(payout.totalAmount || 0) || 0;
            monthlyData[key] = (Number(monthlyData[key]) || 0) + amount;
          }
        }
      });
    }

    // Create labels for all 12 months of the year
    const monthLabels = [];
    const monthData = [];

    for (let month = 1; month <= 12; month++) {
      const monthKey = `${selectedYear}-${month.toString().padStart(2, "0")}`;
      monthLabels.push(new Date(selectedYear, month - 1).toLocaleDateString("en-US", { month: "short" }));
      const monthAmount = Number(monthlyData[monthKey]) || 0;
      monthData.push(monthAmount);
    }

    return {
      labels: monthLabels,
      datasets: [
        {
          data: monthData,
        },
      ],
      tooltipData: monthData.map((amount, index) => ({
        month: monthLabels[index],
        amount: amount,
        formattedAmount: formatCurrency(amount),
      })),
    };
  };

  const renderPortfolioCard = (stock) => (
    <TouchableOpacity key={stock._id} onPress={() => openDetailModal(stock)}>
      <Card testID="stock-card" style={styles.stockCard}>
        <Card.Content>
          <View style={styles.stockHeader}>
            <View style={styles.stockInfo}>
              <Title testID="stock-symbol" style={styles.stockSymbol}>
                {stock.symbol}
              </Title>
              <Paragraph testID="company-name" style={styles.companyName}>
                {stock.companyName}
              </Paragraph>
            </View>
            <Menu
              visible={menuVisible === stock._id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setMenuVisible(stock._id);
                  }}
                  style={styles.menuButton}
                >
                  <IconButton testID="stock-menu-button" icon="dots-vertical" size={24} iconColor="#666" />
                </TouchableOpacity>
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  openEditModal(stock);
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  openPurchaseHistory(stock);
                }}
                title="View Purchases"
                leadingIcon="history"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  refreshStockData(stock._id);
                }}
                title="Refresh Data"
                leadingIcon="refresh"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  deleteStock(stock._id);
                }}
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          </View>

          <View style={styles.stockDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shares:</Text>
              <Text style={styles.detailValue}>{stock.shares}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Purchase Price:</Text>
              <Text style={styles.detailValue}>{formatCurrency(stock.purchasePrice)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Current Price:</Text>
              <View style={styles.priceChangeContainer}>
                <Text style={styles.detailValue}>{formatCurrency(stock.currentPrice)}</Text>
                {(stock.change !== undefined && stock.change !== 0) || (stock.priceChange !== undefined && stock.priceChange !== 0) ? (
                  <View style={styles.changeIndicator}>
                    <MaterialIcons
                      name={stock.change >= 0 || stock.priceChange >= 0 ? "trending-up" : "trending-down"}
                      size={16}
                      color={stock.change >= 0 || stock.priceChange >= 0 ? "#4CAF50" : "#F44336"}
                    />
                    <Text style={[styles.changeText, { color: stock.change >= 0 || stock.priceChange >= 0 ? "#4CAF50" : "#F44336" }]}>
                      {stock.change >= 0 || stock.priceChange >= 0 ? "+" : ""}
                      {formatCurrency(stock.change || stock.priceChange)} ({stock.changePercent >= 0 || stock.priceChangePercent >= 0 ? "+" : ""}
                      {(stock.changePercent || stock.priceChangePercent)?.toFixed(2)}%)
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Dividend/Share:</Text>
              <Text style={styles.detailValue}>{formatCurrency(stock.dividendPerShare)}</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.calculations}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Total Investment:</Text>
              <Text style={styles.calcValue}>{formatCurrency(stock.totalInvestment)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Current Value:</Text>
              <Text style={styles.calcValue}>{formatCurrency(stock.currentValue)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Annual Dividend:</Text>
              <Text style={styles.calcValue}>{formatCurrency(stock.totalDividendIncome)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Current Yield:</Text>
              <Text style={styles.calcValue}>{formatPercentage(stock.dividendYield)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Yield on Cost:</Text>
              <Text style={styles.calcValue}>{formatPercentage(stock.yieldOnCost)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Capital G/L:</Text>
              <Text style={[styles.calcValue, { color: stock.capitalGainLoss >= 0 ? "#4CAF50" : "#F44336" }]}>{formatCurrency(stock.capitalGainLoss)}</Text>
            </View>
          </View>

          <Chip style={styles.frequencyChip}>{stock.payoutFrequency} dividends</Chip>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  const renderCompactPortfolioCard = (stock) => {
    const gainLoss = stock.currentValue - stock.totalInvestment;
    const gainLossPercent = stock.totalInvestment > 0 ? (gainLoss / stock.totalInvestment) * 100 : 0;
    const isGain = gainLoss > 0;
    return (
      <Card key={stock._id} style={styles.compactStockCard}>
        <Card.Content style={styles.compactCardContent}>
          <View style={styles.compactHeader}>
            <View style={styles.compactInfo}>
              <Title style={styles.compactSymbol}>{stock.symbol}</Title>
              <Text style={styles.compactShares}>{stock.shares} shares</Text>
            </View>
            <Menu
              visible={menuVisible === stock._id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    setMenuVisible(stock._id);
                  }}
                  style={styles.menuButton}
                >
                  <IconButton icon="dots-vertical" size={20} />
                </TouchableOpacity>
              }
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  openEditModal(stock);
                }}
                title="Edit"
                leadingIcon="pencil"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  openPurchaseHistory(stock);
                }}
                title="View Purchases"
                leadingIcon="history"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  refreshStockData(stock._id);
                }}
                title="Refresh Data"
                leadingIcon="refresh"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(null);
                  deleteStock(stock._id);
                }}
                title="Delete"
                leadingIcon="delete"
              />
            </Menu>
          </View>

          <TouchableOpacity onPress={() => openDetailModal(stock)} style={styles.compactContent}>
            <View style={styles.compactRow}>
              <View style={styles.priceChangeContainer}>
                <Text style={styles.compactStat}>Price: {formatCurrency(stock.currentPrice)}</Text>
                {(stock.change !== undefined && stock.change !== 0) || (stock.priceChange !== undefined && stock.priceChange !== 0) ? (
                  <View style={styles.changeIndicator}>
                    <MaterialIcons
                      name={stock.change >= 0 || stock.priceChange >= 0 ? "trending-up" : "trending-down"}
                      size={14}
                      color={stock.change >= 0 || stock.priceChange >= 0 ? "#4CAF50" : "#F44336"}
                    />
                    <Text style={[styles.changeText, { color: stock.change >= 0 || stock.priceChange >= 0 ? "#4CAF50" : "#F44336" }]}>
                      {stock.change >= 0 || stock.priceChange >= 0 ? "+" : ""}
                      {(stock.changePercent || stock.priceChangePercent)?.toFixed(2)}%
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.compactStat}>Yield: {formatPercentage(stock.dividendYield)}</Text>
            </View>
            <View style={styles.compactRow}>
              <Text style={styles.compactStat}>Total Value: {formatCurrency(stock.currentPrice * stock.shares)}</Text>
              <Text style={styles.compactStat}>Annual: {formatCurrency(stock.totalDividendIncome)}</Text>
            </View>
            <View style={styles.compactRow}>
              <Text style={styles.compactStat}>Frequency: {stock.payoutFrequency}</Text>
              <Text style={styles.compactStat}>
                G/L: <Text style={{ color: isGain ? "#4CAF50" : "#F44336" }}>{formatCurrency(gainLoss)}</Text>
              </Text>
            </View>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    );
  };

  // Holdings tabs removed - all information now shown directly on cards

  const renderEnhancedChart = () => {
    const chartData = getChartData();
    const labels = chartData.labels || [];
    const data = chartData.datasets?.[0]?.data.map((val) => Number(val) || 0) || [];

    // Calculate chart width to fit all 12 columns on screen
    const screenPadding = 16; // 8px padding on each side
    const availableWidth = width - screenPadding;
    const chartWidth = availableWidth;
    const chartHeight = 250;

    // Calculate bar width and spacing to fit 12 columns
    const totalBars = 12;
    const totalSpacing = availableWidth - 10; // Leave minimal margin
    const barWidth = Math.floor(totalSpacing / totalBars) - 10; // Subtract 1 for spacing between bars
    const spacing = Math.floor((totalSpacing - barWidth * totalBars) / totalBars);

    // Prepare data for react-native-gifted-charts
    const barData = data.map((value, index) => ({
      value: Number(value) || 0,
      label: labels[index],
      frontColor: "#4CAF50",
      topLabelComponent: () => {
        const numValue = Number(value) || 0;
        return <Text style={{ fontSize: 9, color: "#666" }}>{Math.round(numValue)}</Text>;
      },
    }));

    const handleBarPress = async (item, index) => {
      if (item && index >= 0 && index < labels.length) {
        const selectedMonthLabel = labels[index];
        const monthIndex = index + 1; // Convert to 1-based month index

        try {
          // Fetch month-specific data from the API
          const response = await portfolioAPI.getDividendMonthData(selectedYear, monthIndex);
          const monthData = response.data;

          // Show modal with dividend details
          setSelectedMonth({
            label: monthData.monthName,
            dividends: monthData.symbolSummary,
            totals: monthData.totals,
          });
          setChartPopupVisible(true);
        } catch (error) {
          console.error("Error fetching month data:", error);
          // Fallback to old method if API fails
          const historicalDividends = dividendHistory.filter((entry) => {
            if (entry.year !== undefined && entry.month !== undefined) {
              return entry.year === selectedYear && entry.month === monthIndex;
            } else if (entry.date) {
              const entryDate = new Date(entry.date);
              return entryDate.getFullYear() === selectedYear && entryDate.getMonth() + 1 === monthIndex;
            }
            return false;
          });

          const totalAmount = historicalDividends.reduce((sum, div) => sum + (div.totalAmount || 0), 0);
          const dividendCount = historicalDividends.length;

          // Group by symbol
          const grouped = {};
          historicalDividends.forEach((payout) => {
            const symbol = payout.symbol;
            if (!grouped[symbol]) {
              grouped[symbol] = {
                symbol,
                totalAmount: 0,
                totalShares: 0,
                dividendPerShare: payout.dividendPerShare || 0,
                paymentDate: payout.paymentDate,
              };
            }
            grouped[symbol].totalAmount += payout.totalAmount || 0;
            if (payout.shares) {
              grouped[symbol].totalShares += payout.shares;
            }
          });

          setSelectedMonth({
            label: selectedMonthLabel,
            dividends: Object.values(grouped),
            totals: { totalAmount, dividendCount },
          });
          setChartPopupVisible(true);
        }
      }
    };

    return (
      <Card style={styles.chartCard}>
        <Card.Content>
          <View style={styles.chartHeader}>
            <Title style={styles.chartTitle}>Dividend Income</Title>
          </View>
          <View style={styles.yearButtonsContainer}>
            {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((year) => (
              <TouchableOpacity key={year} style={[styles.yearButton, selectedYear === year && styles.yearButtonActive]} onPress={() => setSelectedYear(year)}>
                <Text style={[styles.yearButtonText, selectedYear === year && styles.yearButtonTextActive]}>{year}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View testID="chart-container" style={styles.chartContainer}>
            <BarChart
              key={`chart-${selectedYear}-${dividendHistory.length}`} // Force re-render when data changes
              data={barData}
              width={chartWidth}
              height={chartHeight}
              barWidth={barWidth}
              spacing={spacing}
              xAxisLabelsVerticalShift={10}
              xAxisLabelTextStyle={{ fontSize: 9, color: "#666" }}
              onPress={handleBarPress}
              showVerticalLines={false}
              showHorizontalLines={false}
              showYAxisLabels={false}
              initialSpacing={0}
              yAxisTextNumberOfLines={0}
              hideYAxisText
              hideAxesAndRules
              yAxisLabelWidth={0} // removes left padding
              endSpacing={0}
              barBorderRadius={10}
              topLabelTextStyle={{ fontSize: 10, color: "#666" }}
              barStyle={{
                borderRadius: 10,
                fontSize: 10,
              }}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };

  // Group upcoming payouts by stock symbol and payout date
  const getGroupedUpcomingPayouts = () => {
    const grouped = {};

    upcomingPayouts.forEach((payout) => {
      // Create a unique key combining symbol and payout date
      const key = `${payout.symbol}-${payout.payoutDate}`;

      if (!grouped[key]) {
        grouped[key] = {
          symbol: payout.symbol,
          companyName: payout.companyName,
          payoutDate: payout.payoutDate,
          exDividendDate: payout.exDividendDate,
          payouts: [],
          totalAmount: 0,
          totalShares: 0,
          frequency: payout.payoutFrequency,
        };
      }

      grouped[key].payouts.push(payout);
      grouped[key].totalAmount += payout.totalAmount;
      // Add shares if available in the payout data
      if (payout.shares) {
        grouped[key].totalShares += payout.shares;
      }
    });

    // Convert to array and sort by payout date
    return Object.values(grouped).sort((a, b) => {
      const dateA = new Date(a.payoutDate);
      const dateB = new Date(b.payoutDate);
      return dateA - dateB;
    });
  };

  const renderCalendarSection = () => {
    const groupedPayouts = getGroupedUpcomingPayouts();

    return (
      <View>
        {/* Upcoming Payouts Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title>Upcoming Dividend Payouts</Title>
            {upcomingPayoutsLoading ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.sectionLoadingText}>Loading upcoming payouts...</Text>
              </View>
            ) : (
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Next 30 Days</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(upcomingPayouts.filter((payout) => getDaysUntil(payout.payoutDate) <= 30).reduce((sum, payout) => sum + payout.totalAmount, 0))}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Next 90 Days</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(upcomingPayouts.filter((payout) => getDaysUntil(payout.payoutDate) <= 90).reduce((sum, payout) => sum + payout.totalAmount, 0))}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Upcoming</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(upcomingPayouts.reduce((sum, payout) => sum + payout.totalAmount, 0))}</Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Upcoming Payouts List */}
        <Card style={styles.calendarCard}>
          <Card.Content>
            <Title>Upcoming Payouts</Title>
            {upcomingPayoutsLoading ? (
              <View style={styles.sectionLoading}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.sectionLoadingText}>Loading payout details...</Text>
              </View>
            ) : groupedPayouts.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="event" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No upcoming payouts</Text>
                <Text style={styles.emptySubtext}>Add dividend-paying stocks to see upcoming payouts</Text>
              </View>
            ) : (
              groupedPayouts.slice(0, 20).map((stockPayout, index) => (
                <View testID="payout-item" key={`${stockPayout.symbol}-${stockPayout.payoutDate}`} style={styles.payoutItem}>
                  <View style={styles.payoutHeader}>
                    <View style={styles.payoutInfo}>
                      <Text testID="payout-symbol" style={styles.payoutSymbol}>
                        {stockPayout.symbol}
                      </Text>
                      <Text testID="payout-company" style={styles.payoutCompany}>
                        {stockPayout.companyName}
                      </Text>
                    </View>
                    <Text testID="payout-badge" style={styles.payoutBadge}>
                      {getDaysUntil(stockPayout.payoutDate)} days
                    </Text>
                  </View>

                  <View style={styles.payoutDetails}>
                    <View style={styles.payoutRow}>
                      <Text style={styles.payoutLabel}>Payout Date:</Text>
                      <Text style={styles.payoutValue}>{formatDate(stockPayout.payoutDate)}</Text>
                    </View>
                    <View style={styles.payoutRow}>
                      <Text style={styles.payoutLabel}>Ex-Dividend:</Text>
                      <Text style={styles.payoutValue}>{formatDate(stockPayout.exDividendDate)}</Text>
                    </View>
                    <View style={styles.payoutRow}>
                      <Text style={styles.payoutLabel}>Shares:</Text>
                      <Text style={styles.payoutValue}>{stockPayout.totalShares || "N/A"}</Text>
                    </View>
                    <View style={styles.payoutRow}>
                      <Text style={styles.payoutLabel}>Total Amount:</Text>
                      <Text style={styles.payoutValue}>{formatCurrency(stockPayout.totalAmount)}</Text>
                    </View>
                    <View style={styles.payoutRow}>
                      <Text style={styles.payoutLabel}>Payouts:</Text>
                      <Text style={styles.payoutValue}>
                        {stockPayout.payouts.length} entry{stockPayout.payouts.length > 1 ? "ies" : "y"}
                      </Text>
                    </View>
                    <View style={styles.payoutRow}>
                      <Text style={styles.payoutLabel}>Frequency:</Text>
                      <Text style={styles.payoutValue}>{stockPayout.frequency}</Text>
                    </View>
                  </View>

                  {index < groupedPayouts.length - 1 && <Divider style={styles.payoutDivider} />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </View>
    );
  };

  const renderPortfolioSection = () => (
    <View>
      {/* Portfolio Summary */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={{ marginBottom: 16 }}>
            <Title>Portfolio Summary</Title>
          </View>
          {portfolioLoading ? (
            <View style={styles.sectionLoading}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.sectionLoadingText}>Loading portfolio data...</Text>
            </View>
          ) : (
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Investment</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totals.totalInvestment || 0)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Current Value</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totals.currentValue || 0)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Annual Dividends</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totals.totalDividendIncome || 0)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Monthly Dividends</Text>
                <Text style={styles.summaryValue}>{formatCurrency((totals.totalDividendIncome || 0) / 12)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Daily Dividends</Text>
                <Text style={styles.summaryValue}>{formatCurrency((totals.totalDividendIncome || 0) / 365)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg Yield</Text>
                <Text style={styles.summaryValue}>{formatPercentage(totals.averageYield || 0)}</Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Enhanced Dividend History Chart */}
      {chartDataLoading ? (
        <Card style={styles.chartCard}>
          <Card.Content>
            <View style={styles.sectionLoading}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.sectionLoadingText}>Loading chart data...</Text>
            </View>
          </Card.Content>
        </Card>
      ) : (
        dividendHistory.length > 0 && renderEnhancedChart()
      )}

      {/* Dividend History Summary */}
      <Card style={styles.historyCard}>
        <Card.Content>
          <Title>Dividend History</Title>
          {dividendHistoryLoading ? (
            <View style={styles.sectionLoading}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.sectionLoadingText}>Loading dividend history...</Text>
            </View>
          ) : (
            <View style={styles.historySummary}>
              <View style={styles.historyItem}>
                <Text style={styles.historyLabel}>Total Received</Text>
                <Text style={styles.historyValue}>{formatCurrency(totals.totalReceived || 0)}</Text>
              </View>
              <View style={styles.historyItem}>
                <Text style={styles.historyLabel}>This Year</Text>
                <Text style={styles.historyValue}>{formatCurrency(totals.totalThisYear || 0)}</Text>
              </View>
              <View style={styles.historyItem}>
                <Text style={styles.historyLabel}>This Month</Text>
                <Text style={styles.historyValue}>{formatCurrency(totals.totalThisMonth || 0)}</Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Holdings Tabs - Removed since all info is now shown on cards */}

      {/* Portfolio Holdings */}
      <Card style={styles.holdingsCard}>
        <Card.Content>
          <Title>Portfolio Holdings</Title>
          {portfolioLoading ? (
            <View style={styles.sectionLoading}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.sectionLoadingText}>Loading holdings...</Text>
            </View>
          ) : portfolio.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="account-balance-wallet" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No stocks in portfolio</Text>
              <Text style={styles.emptySubtext}>Add stocks to start tracking your dividend income</Text>
            </View>
          ) : (
            <View testID="holdings-list">{portfolio.map(renderCompactPortfolioCard)}</View>
          )}
        </Card.Content>
      </Card>
    </View>
  );

  const renderTabButton = (tabName, title, icon) => (
    <TouchableOpacity style={[styles.tabButton, selectedTab === tabName && styles.tabButtonActive]} onPress={() => setSelectedTab(tabName)}>
      <MaterialIcons name={icon} size={24} color={selectedTab === tabName ? "#4CAF50" : "#666"} />
      <Text style={[styles.tabButtonText, selectedTab === tabName && styles.tabButtonTextActive]}>{title}</Text>
    </TouchableOpacity>
  );

  const generateFutureDividends = async () => {
    try {
      const response = await portfolioAPI.generateFutureDividends();

      if (response.data.success) {
        // Refresh the dividend history data
        loadDividendHistory();
      } else {
      }
    } catch (error) {
      console.error("❌ Error auto-generating future dividends:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton("portfolio", "Portfolio", "account-balance-wallet")}
        {renderTabButton("calendar", "Calendar", "event")}
      </View>

      {portfolioLoading && portfolio.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading portfolio...</Text>
        </View>
      ) : (
        <ScrollView testID="portfolio-scroll-view" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} style={styles.scrollView}>
          {selectedTab === "portfolio" ? renderPortfolioSection() : renderCalendarSection()}
        </ScrollView>
      )}

      {/* FAB for adding stocks */}
      <FAB testID="add-stock-fab" style={styles.fab} icon="plus" onPress={() => navigation.navigate("Search")} />

      {/* Edit Modal */}
      <Portal>
        <Modal visible={editModalVisible} onDismiss={() => setEditModalVisible(false)} contentContainerStyle={styles.modal}>
          {selectedStock && (
            <>
              <View style={styles.modalHeader}>
                <Title>Edit {selectedStock.symbol}</Title>
                <Text style={styles.modalSubtitle}>{selectedStock.companyName}</Text>
              </View>

              <TextInput
                testID="edit-shares-input"
                label="Number of Shares"
                value={editForm.shares}
                onChangeText={(text) => setEditForm({ ...editForm, shares: text })}
                keyboardType="numeric"
                style={styles.input}
                placeholder="Enter number of shares"
              />
              <TextInput
                testID="edit-purchase-price-input"
                label="Purchase Price per Share"
                value={editForm.purchasePrice}
                onChangeText={(text) => setEditForm({ ...editForm, purchasePrice: text })}
                keyboardType="numeric"
                style={styles.input}
                placeholder="Enter purchase price"
              />

              <View style={styles.modalButtons}>
                <Button mode="outlined" onPress={() => setEditModalVisible(false)} style={styles.modalButton}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={saveEdit} style={styles.modalButton}>
                  Save Changes
                </Button>
              </View>

              <View style={styles.modalDivider} />

              <Button mode="outlined" onPress={deleteStockFromModal} style={[styles.modalButton, styles.deleteButton]} textColor="#d32f2f" buttonColor="transparent">
                Delete Stock from Portfolio
              </Button>
            </>
          )}
        </Modal>
      </Portal>

      {/* Chart Popup Modal */}
      <Portal>
        <Modal visible={chartPopupVisible} onDismiss={() => setChartPopupVisible(false)} contentContainerStyle={styles.chartModal}>
          {selectedMonth &&
            (() => {
              // Use totals from API if available, otherwise calculate from dividends
              const totalAmount =
                selectedMonth.totals?.totalAmount ||
                (selectedMonth.dividends || []).reduce((sum, div) => {
                  const amount = div.totalAmount !== undefined ? div.totalAmount : div.amount !== undefined ? div.amount : 0;
                  return sum + Number(amount);
                }, 0);

              const historicalTotal = selectedMonth.totals?.historicalTotal || 0;
              const upcomingTotal = selectedMonth.totals?.upcomingTotal || 0;

              return (
                <>
                  <View style={styles.chartModalHeader}>
                    <Title style={styles.chartModalTitle}>
                      {selectedMonth.label} {selectedYear} Dividends
                    </Title>
                    <IconButton icon="close" size={24} onPress={() => setChartPopupVisible(false)} />
                  </View>

                  <ScrollView style={styles.chartModalContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.chartModalSummary}>
                      <Text style={{ fontSize: 22, fontWeight: "bold", color: "#4CAF50", textAlign: "center", marginVertical: 12 }}>Total: ${totalAmount.toFixed(2)}</Text>
                      {(historicalTotal > 0 || upcomingTotal > 0) && (
                        <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 8 }}>
                          {historicalTotal > 0 && <Text style={{ fontSize: 14, color: "#666" }}>Historical: ${historicalTotal.toFixed(2)}</Text>}
                          {upcomingTotal > 0 && <Text style={{ fontSize: 14, color: "#666" }}>Upcoming: ${upcomingTotal.toFixed(2)}</Text>}
                        </View>
                      )}
                    </View>

                    {selectedMonth.dividends && selectedMonth.dividends.length > 0 ? (
                      <>
                        {/* Pie Chart Section */}
                        <View style={styles.pieChartContainer}>
                          <Text style={styles.pieChartTitle}>Dividend Distribution</Text>
                          {(() => {
                            // Group by symbol for the pie chart
                            const grouped = {};
                            (selectedMonth.dividends || []).forEach((div) => {
                              if (!grouped[div.symbol]) {
                                grouped[div.symbol] = {
                                  value: 0,
                                  text: "", // Remove text from pie chart
                                };
                              }
                              grouped[div.symbol].value += Number(div.totalAmount || div.amount || 0);
                            });
                            const pieData = Object.keys(grouped).map((symbol, index) => ({
                              value: grouped[symbol].value,
                              text: symbol,
                              color: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#FF6384", "#C9CBCF"][index % 8],
                            }));
                            return pieData.length > 0 ? <PieChart data={pieData} donut radius={60} innerRadius={35} showText={false} /> : null;
                          })()}
                        </View>

                        {/* Dividend List Section */}
                        <View style={styles.dividendListContainer}>
                          <Text style={styles.dividendListTitle}>Dividends</Text>
                          {(() => {
                            // Handle new API data structure or fallback to old structure
                            const dividends = selectedMonth.dividends || [];

                            // Group by symbol and create pie chart data to get colors
                            const grouped = {};
                            dividends.forEach((div) => {
                              if (!grouped[div.symbol]) {
                                grouped[div.symbol] = {
                                  value: 0,
                                  dividends: [],
                                  historicalAmount: 0,
                                  upcomingAmount: 0,
                                };
                              }

                              // Handle new API structure
                              if (div.historicalAmount !== undefined || div.upcomingAmount !== undefined) {
                                grouped[div.symbol].historicalAmount += Number(div.historicalAmount || 0);
                                grouped[div.symbol].upcomingAmount += Number(div.upcomingAmount || 0);
                                grouped[div.symbol].value = grouped[div.symbol].historicalAmount + grouped[div.symbol].upcomingAmount;
                              } else {
                                // Handle old structure
                                grouped[div.symbol].value += Number(div.totalAmount || div.amount || 0);
                              }

                              grouped[div.symbol].dividends.push(div);
                            });

                            // Create pie chart data to get colors and sort by value (highest first)
                            const pieData = Object.keys(grouped)
                              .map((symbol, index) => ({
                                value: grouped[symbol].value,
                                text: symbol,
                                color: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#FF6384", "#C9CBCF"][index % 8],
                                historicalAmount: grouped[symbol].historicalAmount,
                                upcomingAmount: grouped[symbol].upcomingAmount,
                              }))
                              .sort((a, b) => b.value - a.value); // Sort by value in descending order

                            return pieData.map((item, idx) => (
                              <View key={idx} style={styles.dividendListItem}>
                                <View style={styles.dividendListRow}>
                                  <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                                  <Text style={styles.dividendListSymbol}>{item.text}</Text>
                                </View>
                                <View style={styles.dividendListDetails}>
                                  <Text style={styles.dividendListAmount}>{formatCurrency(item.value)}</Text>
                                  {(item.historicalAmount > 0 || item.upcomingAmount > 0) && (
                                    <View style={styles.dividendBreakdown}>
                                      {item.historicalAmount > 0 && <Text style={{ fontSize: 10, color: "#666" }}>Hist: ${item.historicalAmount.toFixed(2)}</Text>}
                                      {item.upcomingAmount > 0 && <Text style={{ fontSize: 10, color: "#666" }}>Up: ${item.upcomingAmount.toFixed(2)}</Text>}
                                    </View>
                                  )}
                                </View>
                              </View>
                            ));
                          })()}
                        </View>
                      </>
                    ) : (
                      <Text style={styles.emptyText}>No dividends for this month</Text>
                    )}
                  </ScrollView>
                </>
              );
            })()}
        </Modal>
      </Portal>

      {/* Purchase History Modal */}
      <PurchaseHistoryModal visible={purchaseHistoryVisible} symbol={selectedStockForHistory} onClose={closePurchaseHistory} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    elevation: 4,
    marginBottom: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: "#4CAF50",
    backgroundColor: "#f1f8e9",
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    color: "#666",
  },
  tabButtonTextActive: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    margin: 16,
    elevation: 4,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  summaryItem: {
    width: "48%",
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  chartCard: {
    margin: 16,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },

  yearPickerContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  yearPicker: {
    width: 100,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 8,
  },
  chartContainer: {
    alignItems: "center",
    marginVertical: 8,
    position: "relative",
    width: "100%",
    marginLeft: -10,
  },
  chartOverlay: {
    position: "absolute",
    top: 8,
    flexDirection: "row",
    pointerEvents: "box-none",
  },
  barTouchable: {
    position: "absolute",
    height: "100%",
    backgroundColor: "transparent",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    paddingRight: 0,
    paddingLeft: 0,
  },
  customValueLabels: {
    position: "absolute",
    top: -30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    zIndex: 1,
  },
  valueLabelContainer: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  valueLabel: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  chartLegend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: "#666",
  },
  historyCard: {
    margin: 16,
    elevation: 4,
  },
  historySummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  historyItem: {
    alignItems: "center",
  },
  historyLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  historyValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  holdingsCard: {
    margin: 16,
    elevation: 4,
  },
  calendarCard: {
    margin: 16,
    elevation: 4,
  },
  payoutItem: {
    marginBottom: 16,
  },
  payoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutSymbol: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  payoutCompany: {
    fontSize: 14,
    color: "#666",
  },
  payoutBadge: {
    backgroundColor: "#4CAF50",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 5,
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  payoutDetails: {
    marginTop: 8,
  },
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  payoutLabel: {
    fontSize: 14,
    color: "#666",
  },
  payoutValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  payoutDivider: {
    marginTop: 16,
  },
  stockCard: {
    marginBottom: 16,
    elevation: 2,
  },
  stockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: "bold",
  },
  companyName: {
    fontSize: 14,
    color: "#666",
  },
  stockDetails: {
    marginTop: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    marginVertical: 16,
  },
  calculations: {
    marginBottom: 16,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  calcLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  calcValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  frequencyChip: {
    alignSelf: "flex-start",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    color: "#666",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  compactStockCard: {
    marginBottom: 10,
    elevation: 1,
    borderRadius: 8,
    padding: 0,
  },
  compactCardContent: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  compactInfo: {
    flex: 1,
  },
  compactContent: {
    flex: 1,
  },
  menuButton: {
    padding: 4,
  },
  compactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  compactSymbol: {
    fontSize: 16,
    fontWeight: "bold",
  },
  compactShares: {
    fontSize: 13,
    color: "#666",
  },
  compactStat: {
    fontSize: 13,
    color: "#333",
    marginRight: 12,
  },
  holdingsTabsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  holdingsTabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  holdingsTabButtonActive: {
    borderBottomColor: "#4CAF50",
    backgroundColor: "#f1f8e9",
  },
  holdingsTabText: {
    fontSize: 15,
    color: "#666",
  },
  holdingsTabTextActive: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  detailModal: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
    minHeight: 300,
    maxHeight: 600,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  detailTabsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  detailTabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  detailTabButtonActive: {
    borderBottomColor: "#4CAF50",
    backgroundColor: "#f1f8e9",
  },
  detailTabText: {
    fontSize: 15,
    color: "#666",
  },
  detailTabTextActive: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  detailHistoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  chartModal: {
    backgroundColor: "white",
    width: "90%",
    height: "95%",
    borderRadius: 12,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
  chartModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  chartModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  chartModalContent: {
    flex: 1,
    backgroundColor: "white",
  },
  chartModalSummary: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  chartModalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  chartModalScroll: {
    maxHeight: 300,
    backgroundColor: "white",
  },
  chartModalDividendItem: {
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  chartModalDividendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    backgroundColor: "white",
  },
  chartModalDividendSymbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
    backgroundColor: "white",
  },
  chartModalDividendAmount: {
    fontSize: 16,
    fontWeight: "bold",
    backgroundColor: "white",
    color: "#333",
  },
  chartModalDividendDetails: {
    marginTop: 4,
    backgroundColor: "white",
  },
  chartModalDividendDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
    backgroundColor: "white",
  },
  chartModalDividendCompany: {
    fontSize: 14,
    color: "#666",
    backgroundColor: "white",
  },
  chartModalDivider: {
    marginTop: 16,
  },
  chartModalEmpty: {
    padding: 32,
    alignItems: "center",
  },
  chartModalEmptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  pieChartContainer: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f8f9fa",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  pieChartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  pieChartCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  pieChartCenterText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  pieChartCenterSubtext: {
    fontSize: 12,
    color: "#666",
  },
  dividendListContainer: {
    marginTop: 16,
    backgroundColor: "white",
    paddingHorizontal: 16,
    width: Dimensions.get("window").width * 0.85,
  },
  dividendListTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
    backgroundColor: "white",
  },
  chartModalDividendAmountContainer: {
    alignItems: "flex-end",
    backgroundColor: "white",
  },
  chartModalDividendPercentage: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    backgroundColor: "white",
    fontWeight: "500",
  },
  chartModalDividendShares: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
    backgroundColor: "white",
  },
  yearButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 8,
  },
  yearButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  yearButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  yearButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  yearButtonTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  dividendTableCard: {
    margin: 16,
    elevation: 4,
  },
  dividendTableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dividendTableTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  dividendTableTotal: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  tableContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    overflow: "hidden",
    width: "100%",
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  tableCellName: {
    flex: 3,
    textAlign: "left",
  },
  tableCellSymbol: {
    flex: 2,
    textAlign: "center",
  },
  tableCellShares: {
    flex: 2,
    textAlign: "center",
  },
  tableCellIncome: {
    flex: 2,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableCell: {
    fontSize: 14,
    color: "#666",
    flex: 1,
    textAlign: "center",
  },
  emptyCard: {
    margin: 16,
    elevation: 4,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  companyNameText: {
    fontSize: 14,
    color: "#333",
  },
  pieChartWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#f5f5f5",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  modalButton: {
    marginHorizontal: 8,
    marginVertical: 4,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 20,
  },
  deleteButton: {
    borderColor: "#d32f2f",
  },
  menuButton: {
    marginLeft: 8,
  },
  totalValueText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  priceChangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  changeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  dividendListItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dividendListRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  dividendListSymbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  dividendListAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  dividendListDetails: {
    alignItems: "flex-end",
  },
  dividendBreakdown: {
    alignItems: "flex-end",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
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
    color: "#666",
  },
});

export default PortfolioScreen;

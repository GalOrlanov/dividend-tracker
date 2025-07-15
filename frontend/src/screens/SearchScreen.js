import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Alert, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Card, Title, Paragraph, Button, Searchbar, Chip, ActivityIndicator, Text, Divider, TextInput } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { marketDataAPI } from "../services/api";
import { showMessage } from "react-native-flash-message";
import apiConfig from "../config/api";
import authService from "../services/auth";

const SearchScreen = ({ navigation }) => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState("");
  const [minYield, setMinYield] = useState("");
  const [maxYield, setMaxYield] = useState("");

  const fetchSectors = async () => {
    // For now, we'll use a predefined list of sectors
    // In a real app, you might want to fetch this from an API
    setSectors(["Technology", "Healthcare", "Consumer Defensive", "Communication Services", "Financial Services", "Energy"]);
  };

  const searchStocks = async () => {
    if (!searchQuery.trim()) {
      setStocks([]);
      return;
    }

    try {
      setLoading(true);
      const response = await marketDataAPI.searchStocks(searchQuery.trim());

      // Extract results from the response
      let filteredStocks = response.data.results || [];

      // Transform the data to match the expected structure
      filteredStocks = filteredStocks.map((stock) => ({
        symbol: stock.ticker || stock.symbol,
        companyName: stock.name || stock.companyName,
        sector: stock.sector || "Unknown",
        currentPrice: stock.currentPrice || 0,
        dividendYield: stock.dividendYield || 0,
        dividendPerShare: stock.dividendPerShare || 0,
        frequency: stock.frequency || "Unknown",
        market: stock.market || "Unknown",
        type: stock.type || "Unknown",
      }));

      setStocks(filteredStocks);
    } catch (error) {
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await searchStocks();
    setRefreshing(false);
  };

  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [portfolioForm, setPortfolioForm] = useState({
    price: "",
    date: new Date().toISOString().split("T")[0], // Today's date
    quantity: "1",
  });

  const handleAddToPortfolio = (stock) => {
    setSelectedStock(stock);
    setPortfolioForm({
      price: stock.currentPrice ? stock.currentPrice.toString() : "",
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
        symbol: selectedStock.symbol,
        companyName: selectedStock.companyName,
        shares: quantity, // ✅ Changed from 'quantity' to 'shares'
        purchasePrice: price,
        purchaseDate: portfolioForm.date,
        // Note: Backend will fetch current price, dividend data automatically
        // We don't need to send these as they'll be updated by the backend
      };
      const token = await authService.getToken();
      // Call the portfolio API to add the stock
      const response = await fetch(`${apiConfig.API_BASE_URL}/api/portfolio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(portfolioData),
      });

      if (response.ok) {
        showMessage({
          message: "Success",
          description: `${selectedStock.symbol} added to portfolio`,
          type: "success",
        });
        setShowPortfolioModal(false);
        setSelectedStock(null);
        setPortfolioForm({ price: "", date: new Date().toISOString().split("T")[0], quantity: "1" });
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

  useEffect(() => {
    fetchSectors();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(searchStocks, 300); // Reduced delay for faster autocomplete
      return () => clearTimeout(timeoutId);
    } else {
      setStocks([]); // Clear results when search is empty
    }
  }, [searchQuery]); // Only trigger on searchQuery changes, not filters

  const renderStockItem = ({ item }) => {
    let priceDisplay = "N/A";
    if (item.currentPrice && item.currentPrice > 0) {
      priceDisplay = `$${item.currentPrice.toFixed(2)}`;
      if (item.isPreviousClose) {
        priceDisplay += " (prev close)";
      }
    }

    // Calculate dividend amounts for different quantities
    const dividendPerShare = item.dividendPerShare || 0;
    const quantities = [1, 10, 100, 1000];
    const dividendAmounts = quantities.map((qty) => ({
      quantity: qty,
      amount: dividendPerShare * qty,
    }));

    return (
      <TouchableOpacity onPress={() => navigation.navigate("StockDetail", { stock: item })}>
        <Card style={styles.stockCard}>
          <Card.Content>
            <View style={styles.stockHeader}>
              <View style={styles.stockInfo}>
                {/* Show company name above symbol */}
                <Paragraph style={styles.companyName}>{item.companyName}</Paragraph>
                <Title style={styles.symbol}>{item.symbol}</Title>
                <Text style={styles.sector}>{`${item.sector || "Unknown"} | ${item.type || "Unknown"}`}</Text>
              </View>
              <View style={styles.stockMetrics}>
                <Text style={styles.price}>{priceDisplay}</Text>
                <Text style={styles.yield}>{item.dividendYield && item.dividendYield > 0 ? `${item.dividendYield.toFixed(2)}%` : "N/A"}</Text>
                {/* Only show frequency if dividendYield > 0 */}
                {item.dividendYield && item.dividendYield > 0 && item.frequency ? <Text style={styles.frequency}>{item.frequency}</Text> : null}
              </View>
            </View>

            {/* Dividend Details Section */}
            <View style={styles.actionButtons}>
              <Button mode="outlined" onPress={() => handleAddToPortfolio(item)} style={styles.addButton} compact>
                Add to Portfolio
              </Button>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  // Defensive: ensure stocks is always an array
  const safeStocks = Array.isArray(stocks) ? stocks : [];

  const renderEmptyState = () => {
    return (
      <View style={styles.emptyState}>
        <Icon name="magnify" size={64} color="#757575" />
        <Text style={styles.emptyTitle}>{searchQuery && searchQuery.trim() && !loading ? "No Results Found" : "Search for Stocks"}</Text>
        <Text style={styles.emptyText}>
          {searchQuery && searchQuery.trim() ? `No stocks found for "${searchQuery}". Try a different search term.` : "Start typing to search for stocks by symbol, company name, or sector"}
        </Text>
      </View>
    );
  };

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterTitle}>Filters:</Text>
      <View style={styles.filterRow}>
        <Chip selected={!selectedSector} onPress={() => setSelectedSector("")} style={styles.filterChip}>
          All Sectors
        </Chip>
        {sectors.slice(0, 5).map((sector) => (
          <Chip key={sector} selected={selectedSector === sector} onPress={() => setSelectedSector(selectedSector === sector ? "" : sector)} style={styles.filterChip}>
            {sector}
          </Chip>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar with Autocomplete */}
      <View style={{ position: "relative" }}>
        <Searchbar placeholder="Search stocks..." onChangeText={setSearchQuery} value={searchQuery} style={styles.searchBar} />
      </View>

      {/* Stocks List */}
      <FlatList
        data={safeStocks}
        renderItem={renderStockItem}
        keyExtractor={(item, index) => `${item.symbol || item.ticker || "unknown"}-${index}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={loading ? null : renderEmptyState}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : null
        }
      />

      {/* Portfolio Modal */}
      <Modal visible={showPortfolioModal} transparent={true} animationType="slide" onRequestClose={() => setShowPortfolioModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Title style={styles.modalTitle}>Add to Portfolio</Title>
              <TouchableOpacity onPress={() => setShowPortfolioModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedStock && (
              <ScrollView style={styles.modalBody}>
                <Card style={styles.stockSummaryCard}>
                  <Card.Content>
                    <Text style={styles.stockSummaryName}>{selectedStock.companyName}</Text>
                    <Text style={styles.stockSummarySymbol}>{selectedStock.symbol}</Text>
                    <Text style={styles.stockSummaryPrice}>Current Price: ${selectedStock.currentPrice ? selectedStock.currentPrice.toFixed(2) : "N/A"}</Text>
                    {selectedStock.dividendYield > 0 && <Text style={styles.stockSummaryYield}>Dividend Yield: {selectedStock.dividendYield.toFixed(2)}%</Text>}
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
                  {selectedStock && (
                    <View style={styles.dividendSummaryBox}>
                      {/* Calculate values */}
                      {(() => {
                        const price = parseFloat(portfolioForm.price) || 0;
                        const quantity = parseInt(portfolioForm.quantity) || 0;
                        const dividendPerShare = selectedStock.dividendPerShare || 0;
                        const frequency = selectedStock.frequency || selectedStock.payoutFrequency || "quarterly";
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
                              <Text style={styles.dividendSummaryValue}>{selectedStock.dividendYield ? selectedStock.dividendYield.toFixed(2) + "%" : "N/A"}</Text>
                            </View>
                          </>
                        );
                      })()}
                    </View>
                  )}

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
            )}
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
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  yieldContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  yieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212121",
    marginBottom: 8,
  },
  yieldInputs: {
    flexDirection: "row",
    alignItems: "center",
  },
  yieldInput: {
    flex: 1,
    marginRight: 8,
    height: 40,
  },
  yieldSeparator: {
    marginHorizontal: 8,
    color: "#757575",
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212121",
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
  },
  stockCard: {
    marginBottom: 16,
    elevation: 2,
  },
  stockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  stockInfo: {
    flex: 1,
  },
  symbol: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  companyName: {
    fontSize: 14,
    color: "#757575",
    marginTop: 2,
  },
  sectorChip: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: "#E3F2FD",
  },
  sectorText: {
    color: "#1976D2",
    fontSize: 12,
  },
  stockMetrics: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  yield: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
    marginTop: 2,
  },
  stockDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#212121",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  addButton: {
    flex: 1,
  },
  infoButton: {
    flex: 1,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
  },
  frequency: {
    fontSize: 12,
    color: "#1976D2",
    marginTop: 2,
  },
  sector: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  dividendDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  dividendSectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  dividendInfo: {
    marginBottom: 12,
  },
  dividendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dividendLabel: {
    fontSize: 13,
    color: "#757575",
    fontWeight: "500",
  },
  dividendValue: {
    fontSize: 13,
    color: "#212121",
    fontWeight: "500",
  },
  quantityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  quantityItem: {
    width: "48%",
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
    alignItems: "center",
  },
  quantityLabel: {
    fontSize: 11,
    color: "#757575",
    marginBottom: 2,
  },
  quantityAmount: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "90%",
    maxHeight: "90%",
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBody: {
    padding: 20,
  },
  stockSummaryCard: {
    marginBottom: 20,
    elevation: 2,
  },
  stockSummaryName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  stockSummarySymbol: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  stockSummaryPrice: {
    fontSize: 14,
    color: "#212121",
    marginTop: 8,
  },
  stockSummaryYield: {
    fontSize: 14,
    color: "#4CAF50",
    marginTop: 4,
  },
  formContainer: {
    marginBottom: 20,
  },
  formInput: {
    marginBottom: 16,
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
    borderColor: "#666",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
  },
  dividendSummaryBox: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  dividendSummaryTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 6,
  },
  dividendSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dividendSummaryLabel: {
    fontSize: 13,
    color: "#757575",
  },
  dividendSummaryValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  helperTextContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#e0f7fa",
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: "#00bcd4",
  },
  helperText: {
    fontSize: 13,
    color: "#00796b",
    fontStyle: "italic",
  },
});

export default SearchScreen;

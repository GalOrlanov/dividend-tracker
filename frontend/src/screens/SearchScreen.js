import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Alert, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Card, Title, Paragraph, Button, Searchbar, Chip, ActivityIndicator, Text, Divider, TextInput } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { marketDataAPI } from "../services/api";
import { showMessage } from "react-native-flash-message";
import apiConfig from "../config/api";
import authService from "../services/auth";
import { useTheme } from "../context/ThemeContext";

const SearchScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState("");
  const [minYield, setMinYield] = useState("");
  const [maxYield, setMaxYield] = useState("");

  // Debounce refs
  const searchTimeoutRef = useRef(null);
  const lastSearchQueryRef = useRef("");
  const isSearchingRef = useRef(false);

  const fetchSectors = async () => {
    // For now, we'll use a predefined list of sectors
    // In a real app, you might want to fetch this from an API
    setSectors(["Technology", "Healthcare", "Consumer Defensive", "Communication Services", "Financial Services", "Energy"]);
  };

  const searchStocks = useCallback(async (query) => {
    const trimmedQuery = query.trim();

    // Don't search if query is empty or too short
    if (!trimmedQuery || trimmedQuery.length < 2) {
      setStocks([]);
      setLoading(false);
      return;
    }

    // Don't search if we're already searching for the same query
    if (lastSearchQueryRef.current === trimmedQuery && isSearchingRef.current) {
      return;
    }

    // Don't search if query is too similar to last search (prevents rapid API calls)
    if (
      lastSearchQueryRef.current &&
      (trimmedQuery.startsWith(lastSearchQueryRef.current) || lastSearchQueryRef.current.startsWith(trimmedQuery)) &&
      Math.abs(trimmedQuery.length - lastSearchQueryRef.current.length) <= 1
    ) {
      return;
    }

    try {
      isSearchingRef.current = true;
      lastSearchQueryRef.current = trimmedQuery;
      setLoading(true);

      const response = await marketDataAPI.searchStocks(trimmedQuery);

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
        relevanceScore: stock.relevanceScore || 0,
        isExactMatch: stock.isExactMatch || false,
      }));

      setStocks(filteredStocks);
    } catch (error) {
      console.error("Search error:", error);
      setStocks([]);
    } finally {
      setLoading(false);
      isSearchingRef.current = false;
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (searchQuery.trim()) {
      await searchStocks(searchQuery.trim());
    }
    setRefreshing(false);
  };

  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [portfolioForm, setPortfolioForm] = useState({
    price: "",
    date: new Date().toISOString().split("T")[0], // Today's date
    quantity: "1",
  });
  const [addingToPortfolio, setAddingToPortfolio] = useState(false);

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

    setAddingToPortfolio(true);
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
    } finally {
      setAddingToPortfolio(false);
    }
  };

  useEffect(() => {
    fetchSectors();

    // Cleanup function to clear timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setStocks([]);
      setLoading(false);
      lastSearchQueryRef.current = "";
      return;
    }

    // Don't search for very short queries
    if (trimmedQuery.length < 2) {
      setStocks([]);
      setLoading(false);
      return;
    }

    // Set a longer delay for longer queries to reduce API calls
    const delay = trimmedQuery.length <= 3 ? 500 : 800;

    searchTimeoutRef.current = setTimeout(() => {
      searchStocks(trimmedQuery);
    }, delay);

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchStocks]);

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
        <Card style={[styles.stockCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <View style={styles.stockHeader}>
              <View style={styles.stockInfo}>
                {/* Show company name above symbol */}
                <Paragraph style={styles.companyName}>{item.companyName}</Paragraph>
                <Title style={styles.symbol}>{item.symbol}</Title>
                <Text style={[styles.sector, { color: colors.textSecondary }]}>{`${item.sector || "Unknown"} | ${item.type || "Unknown"}`}</Text>
              </View>
              <View style={styles.stockMetrics}>
                <Text style={[styles.price, { color: colors.text }]}>{priceDisplay}</Text>
                <Text style={[styles.yield, { color: colors.success }]}>{item.dividendYield && item.dividendYield > 0 ? `${item.dividendYield.toFixed(2)}%` : "N/A"}</Text>
                {/* Only show frequency if dividendYield > 0 */}
                {item.dividendYield && item.dividendYield > 0 && item.frequency ? <Text style={[styles.frequency, { color: colors.primary }]}>{item.frequency}</Text> : null}
              </View>
            </View>

            {/* Dividend Details Section */}
            <View style={styles.actionButtons}>
              <Button mode="outlined" onPress={() => handleAddToPortfolio(item)} style={styles.addButton} compact loading={addingToPortfolio} disabled={addingToPortfolio}>
                {addingToPortfolio ? "Adding..." : "Add to Portfolio"}
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
        <Icon name="magnify" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>{searchQuery && searchQuery.trim() && !loading ? "No Results Found" : "Search for Stocks"}</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {searchQuery && searchQuery.trim() ? `No stocks found for "${searchQuery}". Try a different search term.` : "Start typing to search for stocks by symbol, company name, or sector"}
        </Text>
      </View>
    );
  };

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <Text style={[styles.filterTitle, { color: colors.text }]}>Filters:</Text>
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

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      {/* Search Bar with Autocomplete */}
      <View style={{ position: "relative" }}>
        <Searchbar placeholder="Search stocks..." onChangeText={setSearchQuery} value={searchQuery} style={styles.searchBar} loading={loading} icon={loading ? "loading" : "magnify"} />
        {searchQuery.trim().length >= 2 && !loading && (
          <View style={styles.debounceIndicator}>
            <Text style={styles.debounceText}>Searching...</Text>
          </View>
        )}
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
              <ActivityIndicator size="large" color={colors.primary} />
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
                <Icon name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedStock && (
              <ScrollView style={styles.modalBody}>
                <Card style={[styles.stockSummaryCard, { backgroundColor: colors.surface }]}>
                  <Card.Content>
                    <Text style={[styles.stockSummaryName, { color: colors.text }]}>{selectedStock.companyName}</Text>
                    <Text style={[styles.stockSummarySymbol, { color: colors.textSecondary }]}>{selectedStock.symbol}</Text>
                    <Text style={[styles.stockSummaryPrice, { color: colors.text }]}>Current Price: ${selectedStock.currentPrice ? selectedStock.currentPrice.toFixed(2) : "N/A"}</Text>
                    {selectedStock.dividendYield > 0 && <Text style={[styles.stockSummaryYield, { color: colors.success }]}>Dividend Yield: {selectedStock.dividendYield.toFixed(2)}%</Text>}
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
                      // Only allow whole numbers
                      const cleaned = text.replace(/[^0-9]/g, "");
                      setPortfolioForm({ ...portfolioForm, quantity: cleaned });
                    }}
                    placeholder="1"
                    keyboardType="numeric"
                    style={styles.formInput}
                    mode="outlined"
                    error={portfolioForm.quantity && (isNaN(parseInt(portfolioForm.quantity)) || parseInt(portfolioForm.quantity) <= 0)}
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
                            <Text style={[styles.dividendSummaryTitle, { color: colors.text }]}>Summary</Text>
                            <View style={styles.dividendSummaryRow}>
                              <Text style={[styles.dividendSummaryLabel, { color: colors.textSecondary }]}>Total Cost:</Text>
                              <Text style={[styles.dividendSummaryValue, { color: colors.success }]}>${totalCost.toFixed(2)}</Text>
                            </View>
                            <View style={styles.dividendSummaryRow}>
                              <Text style={[styles.dividendSummaryLabel, { color: colors.textSecondary }]}>Expected Annual Dividend:</Text>
                              <Text style={[styles.dividendSummaryValue, { color: colors.success }]}>${annualDividend.toFixed(2)}</Text>
                            </View>
                            <View style={styles.dividendSummaryRow}>
                              <Text style={[styles.dividendSummaryLabel, { color: colors.textSecondary }]}>Dividend Yield:</Text>
                              <Text style={[styles.dividendSummaryValue, { color: colors.success }]}>{selectedStock.dividendYield ? selectedStock.dividendYield.toFixed(2) + "%" : "N/A"}</Text>
                            </View>
                          </>
                        );
                      })()}
                    </View>
                  )}

                  {/* Helper text */}
                  <View style={styles.helperTextContainer}>
                    <Text style={[styles.helperText, { color: colors.primary }]}>💡 Current price and dividend data will be automatically updated when added to portfolio.</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <Button mode="outlined" onPress={() => setShowPortfolioModal(false)} style={[styles.modalButton, styles.cancelButton]}>
                    Cancel
                  </Button>
                  <Button mode="contained" onPress={handleSubmitPortfolio} style={[styles.modalButton, styles.submitButton]} loading={addingToPortfolio} disabled={addingToPortfolio}>
                    {addingToPortfolio ? "Adding..." : "Add to Portfolio"}
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

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      color: colors.text,
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
      color: colors.textSecondary,
    },
    filterContainer: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    filterTitle: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
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
      color: colors.textSecondary,
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
      color: colors.text,
    },
    companyName: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    sectorChip: {
      alignSelf: "flex-start",
      marginTop: 8,
      backgroundColor: colors.primaryLight,
    },
    sectorText: {
      color: colors.primary,
      fontSize: 12,
    },
    stockMetrics: {
      alignItems: "flex-end",
    },
    price: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    yield: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.success,
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
      color: colors.textSecondary,
      fontWeight: "500",
    },
    detailValue: {
      fontSize: 14,
      color: colors.text,
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
      color: colors.text,
      marginTop: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
      paddingHorizontal: 32,
    },
    frequency: {
      fontSize: 12,
      color: colors.primary,
      marginTop: 2,
    },
    sector: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    dividendDetails: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    dividendSectionTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
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
      color: colors.textSecondary,
      fontWeight: "500",
    },
    dividendValue: {
      fontSize: 13,
      color: colors.text,
      fontWeight: "500",
    },
    quantityGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    quantityItem: {
      width: "48%",
      backgroundColor: colors.background,
      padding: 8,
      borderRadius: 6,
      marginBottom: 6,
      alignItems: "center",
    },
    quantityLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    quantityAmount: {
      fontSize: 13,
      fontWeight: "bold",
      color: colors.success,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.surface,
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
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
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
      color: colors.text,
    },
    stockSummarySymbol: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    stockSummaryPrice: {
      fontSize: 14,
      color: colors.text,
      marginTop: 8,
    },
    stockSummaryYield: {
      fontSize: 14,
      color: colors.success,
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
      borderColor: colors.textSecondary,
    },
    submitButton: {
      backgroundColor: colors.success,
    },
    dividendSummaryBox: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      marginTop: 8,
      marginBottom: 8,
    },
    dividendSummaryTitle: {
      fontSize: 15,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 6,
    },
    dividendSummaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    dividendSummaryLabel: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    dividendSummaryValue: {
      fontSize: 13,
      fontWeight: "bold",
      color: colors.success,
    },
    helperTextContainer: {
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      backgroundColor: colors.primaryLight,
      borderRadius: 6,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    helperText: {
      fontSize: 13,
      color: colors.primary,
      fontStyle: "italic",
    },
    debounceIndicator: {
      position: "absolute",
      top: 60,
      right: 16,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    debounceText: {
      fontSize: 12,
      color: "white",
      fontWeight: "500",
    },
  });

export default SearchScreen;

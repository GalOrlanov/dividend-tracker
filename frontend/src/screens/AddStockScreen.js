import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Card, Title, Paragraph, Button, TextInput, Chip, Divider, Text, Surface } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { marketDataAPI, portfolioAPI } from "../services/api";

const AddStockScreen = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [formData, setFormData] = useState({
    shares: "",
    purchasePrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  // If stock is passed from search screen, use it
  useEffect(() => {
    if (route.params?.stock) {
      setSelectedStock(route.params.stock);
      setFormData((prev) => ({
        ...prev,
        purchasePrice: route.params.stock.price || "",
      }));
    }
  }, [route.params]);

  const searchStocks = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await marketDataAPI.searchStocks(searchQuery);
      setSearchResults(response.data || []);
    } catch (error) {
      console.error("Error searching stocks:", error);
      Alert.alert("Error", "Failed to search stocks");
    } finally {
      setSearching(false);
    }
  };

  const selectStock = async (stock) => {
    setLoading(true);
    try {
      // Fetch detailed stock data
      const [quoteResponse, overviewResponse] = await Promise.all([marketDataAPI.getStockQuote(stock.symbol), marketDataAPI.getCompanyOverview(stock.symbol)]);

      const quote = quoteResponse.data;
      const overview = overviewResponse.data;

      const detailedStock = {
        ...stock,
        price: parseFloat(quote.currentPrice) || 0,
        dividendPerShare: parseFloat(overview.dividendPerShare) || 0,
        dividendYield: parseFloat(overview.dividendYield) || 0,
        payoutFrequency: overview.payoutFrequency || "quarterly",
        companyName: overview.companyName || stock.companyName,
      };

      setSelectedStock(detailedStock);
      setFormData((prev) => ({
        ...prev,
        purchasePrice: detailedStock.price.toString(),
      }));
    } catch (error) {
      console.error("Error fetching stock details:", error);
      Alert.alert("Error", "Failed to fetch stock details");
    } finally {
      setLoading(false);
    }
  };

  const addToPortfolio = async () => {
    if (!selectedStock || !formData.shares || !formData.purchasePrice) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const shares = parseFloat(formData.shares);
    const purchasePrice = parseFloat(formData.purchasePrice);

    if (shares <= 0 || purchasePrice <= 0) {
      Alert.alert("Error", "Shares and purchase price must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      await portfolioAPI.addStock({
        symbol: selectedStock.symbol,
        shares,
        purchasePrice,
        purchaseDate: formData.purchaseDate,
      });

      Alert.alert("Success", `${selectedStock.symbol} added to portfolio`, [
        {
          text: "OK",
          onPress: () => navigation.navigate("Portfolio"),
        },
      ]);
    } catch (error) {
      console.error("Error adding to portfolio:", error);
      Alert.alert("Error", "Failed to add stock to portfolio");
    } finally {
      setLoading(false);
    }
  };

  const calculateProjections = () => {
    if (!selectedStock || !formData.shares || !formData.purchasePrice) return null;

    const shares = parseFloat(formData.shares);
    const purchasePrice = parseFloat(formData.purchasePrice);
    const dividendPerShare = selectedStock.dividendPerShare || 0;

    const totalInvestment = shares * purchasePrice;
    const annualDividend = shares * dividendPerShare;
    const yieldOnCost = totalInvestment > 0 ? (annualDividend / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      annualDividend,
      yieldOnCost,
    };
  };

  const projections = calculateProjections();

  return (
    <ScrollView style={styles.container}>
      {/* Search Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Search for Stocks</Title>
          <View style={styles.searchContainer}>
            <TextInput label="Stock Symbol or Company Name" value={searchQuery} onChangeText={setSearchQuery} style={styles.searchInput} onSubmitEditing={searchStocks} />
            <Button mode="contained" onPress={searchStocks} loading={searching} disabled={searching} style={styles.searchButton}>
              Search
            </Button>
          </View>

          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              <Text style={styles.resultsTitle}>Search Results:</Text>
              {searchResults.map((stock, index) => (
                <Surface key={index} style={styles.stockItem}>
                  <View style={styles.stockInfo}>
                    <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                    <Text style={styles.stockName}>{stock.name}</Text>
                    <Text style={styles.stockType}>{stock.type}</Text>
                  </View>
                  <Button mode="outlined" onPress={() => selectStock(stock)} compact>
                    Select
                  </Button>
                </Surface>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Selected Stock Details */}
      {selectedStock && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Selected Stock</Title>
            <View style={styles.selectedStock}>
              <View style={styles.stockHeader}>
                <Text style={styles.selectedSymbol}>{selectedStock.symbol}</Text>
                <Chip>{selectedStock.payoutFrequency || "quarterly"} dividends</Chip>
              </View>
              <Text style={styles.selectedName}>{selectedStock.companyName}</Text>

              <Divider style={styles.divider} />

              <View style={styles.stockDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Current Price:</Text>
                  <Text style={styles.detailValue}>${selectedStock.price?.toFixed(2) || "N/A"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dividend/Share:</Text>
                  <Text style={styles.detailValue}>${selectedStock.dividendPerShare?.toFixed(2) || "0.00"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Dividend Yield:</Text>
                  <Text style={styles.detailValue}>{selectedStock.dividendYield?.toFixed(2) || "0.00"}%</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Portfolio Entry Form */}
      {selectedStock && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>Add to Portfolio</Title>

            <TextInput label="Number of Shares" value={formData.shares} onChangeText={(text) => setFormData({ ...formData, shares: text })} keyboardType="numeric" style={styles.input} />

            <TextInput
              label="Purchase Price per Share"
              value={formData.purchasePrice}
              onChangeText={(text) => setFormData({ ...formData, purchasePrice: text })}
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput label="Purchase Date" value={formData.purchaseDate} onChangeText={(text) => setFormData({ ...formData, purchaseDate: text })} style={styles.input} />

            {projections && (
              <View style={styles.projections}>
                <Text style={styles.projectionsTitle}>Projections:</Text>
                <View style={styles.projectionRow}>
                  <Text style={styles.projectionLabel}>Total Investment:</Text>
                  <Text style={styles.projectionValue}>${projections.totalInvestment.toFixed(2)}</Text>
                </View>
                <View style={styles.projectionRow}>
                  <Text style={styles.projectionLabel}>Annual Dividend:</Text>
                  <Text style={styles.projectionValue}>${projections.annualDividend.toFixed(2)}</Text>
                </View>
                <View style={styles.projectionRow}>
                  <Text style={styles.projectionLabel}>Yield on Cost:</Text>
                  <Text style={styles.projectionValue}>{projections.yieldOnCost.toFixed(2)}%</Text>
                </View>
              </View>
            )}

            <Button mode="contained" onPress={addToPortfolio} loading={loading} disabled={loading || !formData.shares || !formData.purchasePrice} style={styles.addButton}>
              Add to Portfolio
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Instructions */}
      {!selectedStock && (
        <Card style={styles.card}>
          <Card.Content>
            <Title>How to Add Stocks</Title>
            <View style={styles.instructions}>
              <View style={styles.instructionItem}>
                <MaterialIcons name="search" size={24} color="#666" />
                <Text style={styles.instructionText}>Search for a stock by symbol or company name</Text>
              </View>
              <View style={styles.instructionItem}>
                <MaterialIcons name="check-circle" size={24} color="#666" />
                <Text style={styles.instructionText}>Select the stock from search results</Text>
              </View>
              <View style={styles.instructionItem}>
                <MaterialIcons name="edit" size={24} color="#666" />
                <Text style={styles.instructionText}>Enter number of shares and purchase price</Text>
              </View>
              <View style={styles.instructionItem}>
                <MaterialIcons name="add-circle" size={24} color="#666" />
                <Text style={styles.instructionText}>Add to your portfolio and track dividends</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  searchButton: {
    minWidth: 80,
  },
  searchResults: {
    marginTop: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  stockItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 16,
    fontWeight: "bold",
  },
  stockName: {
    fontSize: 14,
    color: "#666",
  },
  stockType: {
    fontSize: 12,
    color: "#999",
  },
  selectedStock: {
    marginTop: 16,
  },
  stockHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  selectedSymbol: {
    fontSize: 24,
    fontWeight: "bold",
  },
  selectedName: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  stockDetails: {
    marginBottom: 16,
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
  input: {
    marginBottom: 16,
  },
  projections: {
    backgroundColor: "#f0f8ff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  projectionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
  },
  projectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  projectionLabel: {
    fontSize: 14,
    color: "#666",
  },
  projectionValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  addButton: {
    marginTop: 8,
  },
  instructions: {
    marginTop: 16,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
});

export default AddStockScreen;

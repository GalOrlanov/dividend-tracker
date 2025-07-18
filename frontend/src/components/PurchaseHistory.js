import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Card, Title, Paragraph, Text, Button, Divider, ActivityIndicator } from "react-native-paper";
import { portfolioAPI } from "../services/api";
import { showMessage } from "react-native-flash-message";
import { useTheme } from "../context/ThemeContext";

const PurchaseHistory = ({ symbol, onClose }) => {
  const { colors } = useTheme();
  const [purchases, setPurchases] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("🔍 PurchaseHistory: Component mounted with symbol:", symbol);
    loadPurchaseHistory();
  }, [symbol]);

  const loadPurchaseHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔍 Loading purchase history for symbol:", symbol);

      const response = await portfolioAPI.getStockPurchases(symbol);
      console.log("🔍 Purchase history response:", response);
      console.log("🔍 Purchase history data:", response.data);

      if (response.data) {
        setPurchases(response.data);
        console.log("🔍 Set purchases state:", response.data);
      } else {
        console.error("🔍 No data in response");
        setError("No data received from server");
      }
    } catch (error) {
      console.error("🔍 Error loading purchase history:", error);
      console.error("🔍 Error response:", error.response);
      console.error("🔍 Error message:", error.message);

      setError(error.response?.data?.message || error.message || "Failed to load purchase history");

      showMessage({
        message: "Error",
        description: "Failed to load purchase history",
        type: "danger",
      });
    } finally {
      setLoading(false);
      console.log("🔍 Loading finished, loading state:", false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  console.log("🔍 PurchaseHistory render - loading:", loading, "error:", error, "purchases:", purchases);

  if (loading) {
    console.log("🔍 Rendering loading state");
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading purchase history...</Text>
      </View>
    );
  }

  if (error) {
    console.log("🔍 Rendering error state:", error);
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Error: {error}</Text>
        <Button mode="contained" onPress={loadPurchaseHistory} style={{ marginTop: 16 }}>
          Retry
        </Button>
        <Button mode="outlined" onPress={onClose} style={{ marginTop: 8 }}>
          Close
        </Button>
      </View>
    );
  }

  if (!purchases) {
    console.log("🔍 Rendering no data state");
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>No purchase data available</Text>
        <Button mode="outlined" onPress={onClose} style={{ marginTop: 16 }}>
          Close
        </Button>
      </View>
    );
  }

  console.log("🔍 Rendering PurchaseHistory component with purchases:", purchases);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Card style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <Title style={[styles.symbolTitle, { color: colors.text }]}>{purchases.symbol}</Title>
          <Paragraph style={[styles.companyName, { color: colors.textSecondary }]}>{purchases.companyName}</Paragraph>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Shares</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{purchases.totalShares}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Investment</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(purchases.totalInvestment)}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Avg. Price</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{formatCurrency(purchases.weightedAveragePrice)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Purchases</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{purchases.purchaseCount}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <ScrollView style={styles.purchasesList}>
        <Title style={[styles.sectionTitle, { color: colors.text }]}>Purchase History</Title>

        {purchases.purchases && purchases.purchases.length > 0 ? (
          purchases.purchases.map((purchase, index) => (
            <Card key={purchase._id} style={[styles.purchaseCard, { backgroundColor: colors.surface }]}>
              <Card.Content>
                <View style={styles.purchaseHeader}>
                  <Text style={[styles.purchaseNumber, { color: colors.text }]}>Purchase #{index + 1}</Text>
                  <Text style={[styles.purchaseDate, { color: colors.textSecondary }]}>{formatDate(purchase.purchaseDate)}</Text>
                </View>

                <View style={styles.purchaseDetails}>
                  <View style={styles.purchaseRow}>
                    <Text style={[styles.purchaseLabel, { color: colors.textSecondary }]}>Shares:</Text>
                    <Text style={[styles.purchaseValue, { color: colors.text }]}>{purchase.shares}</Text>
                  </View>

                  <View style={styles.purchaseRow}>
                    <Text style={[styles.purchaseLabel, { color: colors.textSecondary }]}>Price:</Text>
                    <Text style={[styles.purchaseValue, { color: colors.text }]}>{formatCurrency(purchase.purchasePrice)}</Text>
                  </View>

                  <View style={styles.purchaseRow}>
                    <Text style={[styles.purchaseLabel, { color: colors.textSecondary }]}>Total:</Text>
                    <Text style={[styles.purchaseValue, { color: colors.text }]}>{formatCurrency(purchase.totalInvestment)}</Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Card style={[styles.purchaseCard, { backgroundColor: colors.surface }]}>
            <Card.Content>
              <Text style={[styles.noPurchasesText, { color: colors.textSecondary }]}>No purchase records found</Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <Button mode="contained" onPress={onClose} style={styles.closeButton}>
        Close
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  summaryCard: {
    margin: 16,
    elevation: 4,
  },
  symbolTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  companyName: {
    fontSize: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  purchasesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
  },
  purchaseCard: {
    marginBottom: 12,
    elevation: 2,
  },
  purchaseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  purchaseNumber: {
    fontSize: 16,
    fontWeight: "bold",
  },
  purchaseDate: {
    fontSize: 14,
  },
  purchaseDetails: {
    marginTop: 8,
  },
  purchaseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  purchaseLabel: {
    fontSize: 14,
  },
  purchaseValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  noPurchasesText: {
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
  },
  closeButton: {
    margin: 16,
  },
});

export default PurchaseHistory;

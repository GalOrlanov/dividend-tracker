import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Card, Title, Paragraph, Text, Button, Divider, ActivityIndicator } from "react-native-paper";
import { portfolioAPI } from "../services/api";
import { showMessage } from "react-native-flash-message";

const PurchaseHistory = ({ symbol, onClose }) => {
  const [purchases, setPurchases] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPurchaseHistory();
  }, [symbol]);

  const loadPurchaseHistory = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.getStockPurchases(symbol);
      setPurchases(response.data);
    } catch (error) {
      console.error("Error loading purchase history:", error);
      showMessage({
        message: "Error",
        description: "Failed to load purchase history",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading purchase history...</Text>
      </View>
    );
  }

  if (!purchases) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load purchase history</Text>
        <Button mode="contained" onPress={loadPurchaseHistory}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Title style={styles.symbolTitle}>{purchases.symbol}</Title>
          <Paragraph style={styles.companyName}>{purchases.companyName}</Paragraph>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Shares</Text>
              <Text style={styles.summaryValue}>{purchases.totalShares}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Investment</Text>
              <Text style={styles.summaryValue}>{formatCurrency(purchases.totalInvestment)}</Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Avg. Price</Text>
              <Text style={styles.summaryValue}>{formatCurrency(purchases.weightedAveragePrice)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Purchases</Text>
              <Text style={styles.summaryValue}>{purchases.purchaseCount}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      <ScrollView style={styles.purchasesList}>
        <Title style={styles.sectionTitle}>Purchase History</Title>

        {purchases.purchases.map((purchase, index) => (
          <Card key={purchase._id} style={styles.purchaseCard}>
            <Card.Content>
              <View style={styles.purchaseHeader}>
                <Text style={styles.purchaseNumber}>Purchase #{index + 1}</Text>
                <Text style={styles.purchaseDate}>{formatDate(purchase.purchaseDate)}</Text>
              </View>

              <View style={styles.purchaseDetails}>
                <View style={styles.purchaseRow}>
                  <Text style={styles.purchaseLabel}>Shares:</Text>
                  <Text style={styles.purchaseValue}>{purchase.shares}</Text>
                </View>

                <View style={styles.purchaseRow}>
                  <Text style={styles.purchaseLabel}>Price:</Text>
                  <Text style={styles.purchaseValue}>{formatCurrency(purchase.purchasePrice)}</Text>
                </View>

                <View style={styles.purchaseRow}>
                  <Text style={styles.purchaseLabel}>Total:</Text>
                  <Text style={styles.purchaseValue}>{formatCurrency(purchase.totalInvestment)}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
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
    backgroundColor: "#f5f5f5",
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
    color: "#666",
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
    color: "#666",
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
    color: "#666",
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
    color: "#666",
  },
  purchaseValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  closeButton: {
    margin: 16,
  },
});

export default PurchaseHistory;

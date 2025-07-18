import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { Modal, Portal, Card, Title, Paragraph, Text, Button, ActivityIndicator } from "react-native-paper";
import { portfolioAPI } from "../services/api";
import { showMessage } from "react-native-flash-message";
import { useTheme } from "../context/ThemeContext";

const { width, height } = Dimensions.get("window");

const PurchaseHistoryModal = ({ visible, symbol, onClose }) => {
  console.log("🔍 PurchaseHistoryModal: Component called with visible:", visible, "symbol:", symbol);

  const { colors } = useTheme();
  const [purchases, setPurchases] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("🔍 PurchaseHistoryModal: useEffect triggered with visible:", visible, "symbol:", symbol);
    if (visible && symbol) {
      console.log("🔍 PurchaseHistoryModal: Opening for symbol:", symbol);
      loadPurchaseHistory();
    }
  }, [visible, symbol]);

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

  const handleClose = () => {
    setPurchases(null);
    setError(null);
    setLoading(true);
    onClose();
  };

  console.log("🔍 PurchaseHistoryModal render - visible:", visible, "loading:", loading, "error:", error, "purchases:", purchases);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleClose} contentContainerStyle={styles.modalContainer}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Test Header - Always show this */}
          <View style={[styles.header, { backgroundColor: colors.surface }]}>
            <Title style={[styles.headerTitle, { color: colors.text }]}>Purchase History for {symbol || "Unknown"}</Title>
            <Button mode="text" onPress={handleClose} textColor={colors.primary}>
              Close
            </Button>
          </View>

          {/* Test Content - Always show this */}
          <View style={styles.content}>
            <Text style={{ color: colors.text, fontSize: 16, padding: 20 }}>Modal is working! Symbol: {symbol}</Text>
            <Text style={{ color: colors.text, fontSize: 14, padding: 20 }}>Loading: {loading.toString()}</Text>
            <Text style={{ color: colors.text, fontSize: 14, padding: 20 }}>Error: {error || "None"}</Text>
            <Text style={{ color: colors.text, fontSize: 14, padding: 20 }}>Purchases: {purchases ? "Loaded" : "Not loaded"}</Text>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    margin: 0,
    padding: 0,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  content: {
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  summaryCard: {
    marginVertical: 16,
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
});

export default PurchaseHistoryModal;

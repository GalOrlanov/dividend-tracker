import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Card } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const StockCard = ({ stock, isLoading, onPress }) => {
  const { colors } = useTheme();

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === "N.A" || isNaN(amount)) {
      return "$0.00";
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined || value === "N.A" || isNaN(value)) {
      return "0.00%";
    }
    return `${Number(value).toFixed(2)}%`;
  };

  const getChangeColor = () => {
    if (!stock.change && stock.change !== 0) return colors.textSecondary;
    return stock.change >= 0 ? colors.success : colors.error;
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      marginBottom: 8,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    content: {
      padding: 12,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    stockInfo: {
      flex: 1,
    },
    symbol: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 2,
    },
    companyName: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    priceContainer: {
      alignItems: "flex-end",
    },
    currentPrice: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 2,
    },
    changeContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    changeIcon: {
      marginRight: 2,
    },
    change: {
      fontSize: 12,
      fontWeight: "500",
    },
    details: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 8,
    },
    detailItem: {
      alignItems: "center",
      flex: 1,
    },
    detailLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.text,
    },
    loadingContainer: {
      alignItems: "center",
      paddingVertical: 16,
    },
    loadingText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 6,
    },
  });

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.loadingContainer}>
          <MaterialIcons name="sync" size={20} color={colors.textSecondary} />
          <Text style={styles.loadingText}>Loading {stock?.symbol}...</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.stockInfo}>
              <Text style={styles.symbol}>{stock.symbol}</Text>
              <Text style={styles.companyName}>{stock.companyName}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>{formatCurrency(stock.currentPrice)}</Text>
              <View style={styles.changeContainer}>
                <MaterialIcons name={stock.change >= 0 ? "trending-up" : "trending-down"} size={14} color={getChangeColor()} style={styles.changeIcon} />
                <Text style={[styles.change, { color: getChangeColor() }]}>
                  {stock.change >= 0 ? "+" : ""}
                  {formatCurrency(stock.change)} ({stock.changePercent >= 0 ? "+" : ""}
                  {formatPercentage(stock.changePercent)})
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Shares</Text>
              <Text style={styles.detailValue}>{stock.shares || "N/A"}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Value</Text>
              <Text style={styles.detailValue}>{formatCurrency(stock.currentValue)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Yield</Text>
              <Text style={styles.detailValue}>{formatPercentage(stock.yieldOnCost)}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

export default StockCard;

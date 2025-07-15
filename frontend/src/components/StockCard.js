import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Title, Paragraph, Text } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const StockCard = ({ stock, isLoading = false }) => {
  const isPositive = stock?.priceChange >= 0 || stock?.change >= 0;
  const changeColor = isPositive ? "#4CAF50" : "#F44336";
  const changeIcon = isPositive ? "chevron-up" : "chevron-down";

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSymbol} />
            <View style={styles.loadingPrice} />
            <View style={styles.loadingChange} />
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.container}>
          <View style={styles.leftSection}>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {stock?.companyName || stock?.name || "Unknown"}
            </Text>
            <Text style={styles.symbol}>{stock?.symbol || "N/A"}</Text>
          </View>
          <View style={styles.rightSection}>
            <Text style={styles.price}>${stock?.currentPrice ? stock.currentPrice.toFixed(2) : stock?.price ? stock.price.toFixed(2) : "0.00"}</Text>
            <View style={styles.changeContainer}>
              <Icon name={changeIcon} size={16} color={changeColor} style={styles.changeIcon} />
              <Text style={[styles.change, { color: changeColor }]}>
                {stock?.priceChange ? (stock.priceChange >= 0 ? "+" : "") + stock.priceChange.toFixed(2) : stock?.change ? (stock.change >= 0 ? "+" : "") + stock.change.toFixed(2) : "0.00"}(
                {stock?.priceChangePercent
                  ? (stock.priceChangePercent >= 0 ? "+" : "") + stock.priceChangePercent.toFixed(2)
                  : stock?.changePercent
                  ? (stock.changePercent >= 0 ? "+" : "") + stock.changePercent.toFixed(2)
                  : "0.00"}
                %)
              </Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 8,
    elevation: 2,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    flex: 1,
    marginRight: 12,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  symbol: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  changeIcon: {
    marginRight: 4,
  },
  change: {
    fontSize: 12,
    fontWeight: "500",
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  loadingSymbol: {
    width: 80,
    height: 16,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
  },
  loadingPrice: {
    width: 60,
    height: 16,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
  },
  loadingChange: {
    width: 50,
    height: 12,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
  },
});

export default StockCard;

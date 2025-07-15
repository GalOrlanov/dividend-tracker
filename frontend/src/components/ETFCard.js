import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Title, Paragraph, Text } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const ETFCard = ({ symbol, name, fullName, price, change, changePercent, isLoading = false }) => {
  const isPositive = change >= 0;
  const changeColor = isPositive ? "#4CAF50" : "#F44336";
  const changeIcon = isPositive ? "trending-up" : "trending-down";

  // Format number with commas
  const formatNumber = (num) => {
    if (!num || isNaN(num)) return "0.00";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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
        <View style={styles.header}>
          <View>
            <Title style={styles.name}>{name}</Title>
            <Paragraph style={styles.symbol}>{symbol}</Paragraph>
          </View>
          <Icon name="chart-line" size={24} color="#666" />
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>${formatNumber(price)}</Text>
          <View style={[styles.changeContainer, { backgroundColor: changeColor + "20" }]}>
            <Icon name={changeIcon} size={16} color={changeColor} />
            <Text style={[styles.changeText, { color: changeColor }]}>
              {change >= 0 ? "+" : ""}
              {formatNumber(change)} ({changePercent >= 0 ? "+" : ""}
              {changePercent?.toFixed(2) || "0.00"}%)
            </Text>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  symbol: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  changeText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  changeIcon: {
    marginRight: 2,
  },
  loadingContainer: {
    padding: 12,
  },
  loadingSymbol: {
    height: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginBottom: 8,
  },
  loadingPrice: {
    height: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginBottom: 4,
  },
  loadingChange: {
    height: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    width: "60%",
  },
});

export default ETFCard;

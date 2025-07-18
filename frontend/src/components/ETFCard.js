import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

const ETFCard = ({ symbol, name, fullName, price, change, changePercent, isLoading }) => {
  const { colors } = useTheme();

  const formatPrice = (price) => {
    if (!price || price === 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change) => {
    if (!change && change !== 0) return "N/A";
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}`;
  };

  const formatChangePercent = (changePercent) => {
    if (!changePercent && changePercent !== 0) return "N/A";
    const sign = changePercent >= 0 ? "+" : "";
    return `${sign}${changePercent.toFixed(2)}%`;
  };

  const getChangeColor = () => {
    if (!change && change !== 0) return colors.textSecondary;
    return change >= 0 ? colors.success : colors.error;
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
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
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    symbol: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    name: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    priceContainer: {
      alignItems: "flex-end",
      width: "100%",
    },
    price: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    changeContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
    },
    changeIcon: {
      marginRight: 4,
    },
    change: {
      fontSize: 12,
      fontWeight: "500",
    },
    loadingContainer: {
      alignItems: "center",
      paddingVertical: 16,
    },
    loadingText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
  });

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <Card.Content style={styles.loadingContainer}>
          <MaterialIcons name="sync" size={20} color={colors.textSecondary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.symbol}>{name}</Text>
            <Text style={styles.name}>{symbol}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>{formatPrice(price)}</Text>
            <View style={styles.changeContainer}>
              <MaterialIcons name={change >= 0 ? "trending-up" : "trending-down"} size={12} color={getChangeColor()} style={styles.changeIcon} />
              <Text style={[styles.change, { color: getChangeColor() }]}>{formatChangePercent(changePercent)}</Text>
            </View>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

export default ETFCard;

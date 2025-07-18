import React from "react";
import { View, Text } from "react-native";
import { Card, Title } from "react-native-paper";
import { useTheme } from "../context/ThemeContext";

const ChartCard = ({ title, children, style = {}, noDataMessage = "No data available", showNoData = false }) => {
  const theme = useTheme();
  const colors = theme?.colors || {
    background: "#F5F5F5",
    surface: "#FFFFFF",
    text: "#212121",
    textSecondary: "#757575",
  };

  return (
    <Card style={[styles.card, { backgroundColor: colors.surface }, style]}>
      <Card.Content>
        <Title style={[styles.title, { color: colors.text }]}>{title}</Title>
        {showNoData ? <Text style={[styles.noDataText, { color: colors.textSecondary }]}>{noDataMessage}</Text> : children}
      </Card.Content>
    </Card>
  );
};

const styles = {
  card: {
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  title: {
    marginBottom: 16,
    fontSize: 18,
    fontWeight: "600",
  },
  noDataText: {
    textAlign: "center",
    padding: 20,
    fontSize: 14,
  },
};

export default ChartCard;

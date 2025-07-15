import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import { Card, Title, Text, Button, Chip, ActivityIndicator, Divider } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { dividendAPI } from "../services/api";
import { showMessage } from "react-native-flash-message";

const DividendDetailScreen = ({ navigation, route }) => {
  const { dividend } = route.params;
  const [loading, setLoading] = useState(false);

  const handleEdit = () => {
    navigation.navigate("AddDividend", { dividend });
  };

  const handleDelete = () => {
    Alert.alert("Delete Dividend", `Are you sure you want to delete the dividend for ${dividend.symbol}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await dividendAPI.deleteDividend(dividend._id);
            showMessage({
              message: "Success",
              description: "Dividend deleted successfully",
              type: "success",
            });
            navigation.goBack();
          } catch (error) {
            showMessage({
              message: "Error",
              description: "Failed to delete dividend",
              type: "danger",
            });
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysUntilPayment = () => {
    const paymentDate = new Date(dividend.paymentDate);
    const today = new Date();
    const diffTime = paymentDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = () => {
    const daysUntil = getDaysUntilPayment();
    if (daysUntil < 0) return "#F44336"; // Past
    if (daysUntil <= 7) return "#FF9800"; // Soon
    return "#4CAF50"; // Future
  };

  const getStatusText = () => {
    const daysUntil = getDaysUntilPayment();
    if (daysUntil < 0) return "Paid";
    if (daysUntil === 0) return "Today";
    if (daysUntil === 1) return "Tomorrow";
    if (daysUntil <= 7) return `${daysUntil} days`;
    return `${daysUntil} days`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerRow}>
            <View style={styles.symbolContainer}>
              <Title style={styles.symbol}>{dividend.symbol}</Title>
              <Text style={styles.companyName}>{dividend.companyName}</Text>
            </View>
            <View style={styles.amountContainer}>
              <Text style={styles.amount}>${dividend.totalDividend.toFixed(2)}</Text>
              <Text style={styles.perShare}>${dividend.dividendPerShare.toFixed(2)}/share</Text>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <Chip style={[styles.statusChip, { backgroundColor: getStatusColor() }]} textStyle={styles.statusText}>
              {getStatusText()}
            </Chip>
            {dividend.sector && (
              <Chip style={styles.sectorChip} textStyle={styles.sectorText}>
                {dividend.sector}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Details Card */}
      <Card style={styles.detailsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Dividend Details</Title>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Shares Owned</Text>
              <Text style={styles.detailValue}>{dividend.shares.toLocaleString()}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Dividend Per Share</Text>
              <Text style={styles.detailValue}>${dividend.dividendPerShare.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total Dividend</Text>
              <Text style={styles.detailValue}>${dividend.totalDividend.toFixed(2)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Frequency</Text>
              <Text style={styles.detailValue}>{dividend.frequency}</Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Ex-Dividend Date</Text>
              <Text style={styles.detailValue}>{formatDate(dividend.exDate)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Payment Date</Text>
              <Text style={styles.detailValue}>{formatDate(dividend.paymentDate)}</Text>
            </View>
          </View>

          {dividend.notes && (
            <>
              <Divider style={styles.divider} />
              <View style={styles.notesContainer}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.notesText}>{dividend.notes}</Text>
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Calculations Card */}
      <Card style={styles.calculationsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Calculations</Title>

          <View style={styles.calculationRow}>
            <Text style={styles.calculationLabel}>Annual Dividend Income</Text>
            <Text style={styles.calculationValue}>${(dividend.totalDividend * getFrequencyMultiplier(dividend.frequency)).toFixed(2)}</Text>
          </View>

          <View style={styles.calculationRow}>
            <Text style={styles.calculationLabel}>Monthly Average</Text>
            <Text style={styles.calculationValue}>${((dividend.totalDividend * getFrequencyMultiplier(dividend.frequency)) / 12).toFixed(2)}</Text>
          </View>

          <View style={styles.calculationRow}>
            <Text style={styles.calculationLabel}>Daily Average</Text>
            <Text style={styles.calculationValue}>${((dividend.totalDividend * getFrequencyMultiplier(dividend.frequency)) / 365).toFixed(2)}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <View style={styles.buttonContainer}>
            <Button mode="contained" icon="pencil" onPress={handleEdit} style={styles.editButton} disabled={loading}>
              Edit Dividend
            </Button>
            <Button mode="outlined" icon="delete" onPress={handleDelete} style={styles.deleteButton} textColor="#F44336" disabled={loading}>
              Delete
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const getFrequencyMultiplier = (frequency) => {
  switch (frequency) {
    case "monthly":
      return 12;
    case "quarterly":
      return 4;
    case "semi-annual":
      return 2;
    case "annual":
      return 1;
    default:
      return 4; // Default to quarterly
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  symbolContainer: {
    flex: 1,
  },
  symbol: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212121",
  },
  companyName: {
    fontSize: 16,
    color: "#757575",
    marginTop: 4,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  perShare: {
    fontSize: 14,
    color: "#757575",
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statusChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  statusText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  sectorChip: {
    backgroundColor: "#E3F2FD",
    marginBottom: 8,
  },
  sectorText: {
    color: "#1976D2",
  },
  detailsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "500",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#212121",
    fontWeight: "500",
  },
  divider: {
    marginVertical: 16,
  },
  notesContainer: {
    marginTop: 8,
  },
  notesText: {
    fontSize: 16,
    color: "#212121",
    fontStyle: "italic",
    marginTop: 4,
  },
  calculationsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  calculationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  calculationLabel: {
    fontSize: 16,
    color: "#212121",
  },
  calculationValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  actionsCard: {
    marginBottom: 16,
    elevation: 2,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  editButton: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    flex: 1,
    marginLeft: 8,
    borderColor: "#F44336",
  },
});

export default DividendDetailScreen;

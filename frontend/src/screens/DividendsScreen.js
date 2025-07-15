import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Alert, ScrollView } from "react-native";
import { Card, Title, Paragraph, Button, Searchbar, Chip, FAB, ActivityIndicator, Text, Menu, Divider } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { dividendAPI } from "../services/api";
import { showMessage } from "react-native-flash-message";

const DividendsScreen = ({ navigation }) => {
  const [dividends, setDividends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedDividend, setSelectedDividend] = useState(null);

  const fetchDividends = async () => {
    try {
      setLoading(true);
      const params = {
        year: filterYear,
        ...(filterMonth && { month: filterMonth }),
        ...(searchQuery && { symbol: searchQuery }),
      };

      const response = await dividendAPI.getDividends(params);
      setDividends(response.data.dividends || []);
    } catch (error) {
      showMessage({
        message: "Error",
        description: "Failed to load dividends",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDividends();
    setRefreshing(false);
  };

  const handleDeleteDividend = (dividend) => {
    Alert.alert("Delete Dividend", `Are you sure you want to delete the dividend for ${dividend.symbol}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await dividendAPI.deleteDividend(dividend._id);
            showMessage({
              message: "Success",
              description: "Dividend deleted successfully",
              type: "success",
            });
            fetchDividends();
          } catch (error) {
            showMessage({
              message: "Error",
              description: "Failed to delete dividend",
              type: "danger",
            });
          }
        },
      },
    ]);
  };

  const handleEditDividend = (dividend) => {
    navigation.navigate("AddDividend", { dividend });
  };

  const renderDividendItem = ({ item }) => (
    <Card style={styles.dividendCard} onPress={() => navigation.navigate("DividendDetail", { dividend: item })}>
      <Card.Content>
        <View style={styles.dividendHeader}>
          <View style={styles.dividendInfo}>
            <Title style={styles.symbol}>{item.symbol}</Title>
            <Paragraph style={styles.companyName}>{item.companyName}</Paragraph>
          </View>
          <View style={styles.dividendAmount}>
            <Text style={styles.amount}>${item.totalDividend.toFixed(2)}</Text>
            <Text style={styles.perShare}>${item.dividendPerShare.toFixed(2)}/share</Text>
          </View>
        </View>

        <View style={styles.dividendDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Shares:</Text>
            <Text style={styles.detailValue}>{item.shares}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Date:</Text>
            <Text style={styles.detailValue}>{new Date(item.paymentDate).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Frequency:</Text>
            <Text style={styles.detailValue}>{item.frequency}</Text>
          </View>
          {item.sector && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Sector:</Text>
              <Text style={styles.detailValue}>{item.sector}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <Button mode="outlined" compact onPress={() => handleEditDividend(item)} style={styles.actionButton}>
            Edit
          </Button>
          <Button mode="outlined" compact onPress={() => handleDeleteDividend(item)} style={[styles.actionButton, styles.deleteButton]} textColor="#F44336">
            Delete
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="cash-multiple" size={64} color="#757575" />
      <Text style={styles.emptyTitle}>No Dividends Found</Text>
      <Text style={styles.emptyText}>{searchQuery || filterMonth ? "Try adjusting your search or filters" : "Add your first dividend to get started"}</Text>
      <Button mode="contained" icon="plus" onPress={() => navigation.navigate("AddDividend")} style={styles.addButton}>
        Add Dividend
      </Button>
    </View>
  );

  const renderFilterChips = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Chip selected={!filterMonth} onPress={() => setFilterMonth(null)} style={styles.filterChip}>
          All Months
        </Chip>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
          <Chip key={month} selected={filterMonth === month} onPress={() => setFilterMonth(filterMonth === month ? null : month)} style={styles.filterChip}>
            {new Date(filterYear, month - 1, 1).toLocaleString("default", { month: "short" })}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  useEffect(() => {
    fetchDividends();
  }, [filterYear, filterMonth, searchQuery]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading dividends...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar placeholder="Search by symbol..." onChangeText={setSearchQuery} value={searchQuery} style={styles.searchBar} />

      {/* Filter Chips */}
      {renderFilterChips()}

      {/* Dividends List */}
      <FlatList
        data={dividends}
        renderItem={renderDividendItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <FAB icon="plus" style={styles.fab} onPress={() => navigation.navigate("AddDividend")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#757575",
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  dividendCard: {
    marginBottom: 16,
    elevation: 2,
  },
  dividendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  dividendInfo: {
    flex: 1,
  },
  symbol: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
  },
  companyName: {
    fontSize: 14,
    color: "#757575",
    marginTop: 2,
  },
  dividendAmount: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  perShare: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  dividendDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: "#757575",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: "#212121",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    marginLeft: 8,
  },
  deleteButton: {
    borderColor: "#F44336",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212121",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  addButton: {
    marginTop: 16,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: "#2196F3",
  },
});

export default DividendsScreen;

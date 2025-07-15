import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Card, Title, Text, Button, Chip, ActivityIndicator } from "react-native-paper";
import { Calendar } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { dividendAPI } from "../services/api";
import { showMessage } from "react-native-flash-message";

const CalendarScreen = ({ navigation }) => {
  const [dividends, setDividends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchDividends = async () => {
    try {
      setLoading(true);
      const response = await dividendAPI.getDividends({ year: selectedYear });
      const dividendsData = response.data.dividends || [];
      setDividends(dividendsData);

      // Create marked dates for calendar
      const marked = {};
      dividendsData.forEach((dividend) => {
        const date = new Date(dividend.paymentDate).toISOString().split("T")[0];
        if (marked[date]) {
          marked[date].dots.push({
            key: dividend._id,
            color: "#4CAF50",
            selectedDotColor: "#4CAF50",
          });
        } else {
          marked[date] = {
            dots: [
              {
                key: dividend._id,
                color: "#4CAF50",
                selectedDotColor: "#4CAF50",
              },
            ],
            selected: date === selectedDate,
          };
        }
      });
      setMarkedDates(marked);
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

  const handleDateSelect = (date) => {
    setSelectedDate(date.dateString);

    // Update marked dates to show selection
    const updatedMarked = { ...markedDates };
    Object.keys(updatedMarked).forEach((key) => {
      updatedMarked[key].selected = key === date.dateString;
    });
    setMarkedDates(updatedMarked);
  };

  const getDividendsForDate = (dateString) => {
    return dividends.filter((dividend) => {
      const dividendDate = new Date(dividend.paymentDate).toISOString().split("T")[0];
      return dividendDate === dateString;
    });
  };

  const getTotalForDate = (dateString) => {
    const dateDividends = getDividendsForDate(dateString);
    return dateDividends.reduce((sum, dividend) => sum + dividend.totalDividend, 0);
  };

  const getMonthlyTotal = (month) => {
    const monthDividends = dividends.filter((dividend) => {
      const dividendMonth = new Date(dividend.paymentDate).getMonth() + 1;
      return dividendMonth === month;
    });
    return monthDividends.reduce((sum, dividend) => sum + dividend.totalDividend, 0);
  };

  const renderMonthlySummary = () => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Title style={styles.summaryTitle}>Monthly Summary ({selectedYear})</Title>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.monthlyContainer}>
              {months.map((month) => {
                const total = getMonthlyTotal(month);
                const monthName = new Date(selectedYear, month - 1, 1).toLocaleString("default", { month: "short" });

                return (
                  <View key={month} style={styles.monthItem}>
                    <Text style={styles.monthName}>{monthName}</Text>
                    <Text style={styles.monthTotal}>${total.toFixed(2)}</Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };

  const renderSelectedDateDetails = () => {
    const selectedDividends = getDividendsForDate(selectedDate);
    const totalForDate = getTotalForDate(selectedDate);

    return (
      <Card style={styles.detailsCard}>
        <Card.Content>
          <Title style={styles.detailsTitle}>
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Title>

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total Income:</Text>
            <Text style={styles.totalAmount}>${totalForDate.toFixed(2)}</Text>
          </View>

          {selectedDividends.length > 0 ? (
            selectedDividends.map((dividend) => (
              <View key={dividend._id} style={styles.dividendItem}>
                <View style={styles.dividendInfo}>
                  <Text style={styles.dividendSymbol}>{dividend.symbol}</Text>
                  <Text style={styles.dividendCompany}>{dividend.companyName}</Text>
                  <Text style={styles.dividendShares}>{dividend.shares} shares</Text>
                </View>
                <View style={styles.dividendAmount}>
                  <Text style={styles.amount}>${dividend.totalDividend.toFixed(2)}</Text>
                  <Text style={styles.perShare}>${dividend.dividendPerShare.toFixed(2)}/share</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyDate}>
              <Icon name="calendar-blank" size={48} color="#757575" />
              <Text style={styles.emptyText}>No dividends on this date</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  useEffect(() => {
    fetchDividends();
  }, [selectedYear]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Year Selector */}
      <Card style={styles.yearCard}>
        <Card.Content>
          <View style={styles.yearContainer}>
            <Button mode="outlined" onPress={() => setSelectedYear(selectedYear - 1)} disabled={loading}>
              {selectedYear - 1}
            </Button>
            <Title style={styles.currentYear}>{selectedYear}</Title>
            <Button mode="outlined" onPress={() => setSelectedYear(selectedYear + 1)} disabled={loading}>
              {selectedYear + 1}
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Monthly Summary */}
      {renderMonthlySummary()}

      {/* Calendar */}
      <Card style={styles.calendarCard}>
        <Card.Content>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={markedDates}
            markingType={"multi-dot"}
            theme={{
              backgroundColor: "#ffffff",
              calendarBackground: "#ffffff",
              textSectionTitleColor: "#b6c1cd",
              selectedDayBackgroundColor: "#2196F3",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#2196F3",
              dayTextColor: "#2d4150",
              textDisabledColor: "#d9e1e8",
              dotColor: "#4CAF50",
              selectedDotColor: "#ffffff",
              arrowColor: "#2196F3",
              monthTextColor: "#2d4150",
              indicatorColor: "#4CAF50",
              textDayFontWeight: "300",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "300",
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 13,
            }}
          />
        </Card.Content>
      </Card>

      {/* Selected Date Details */}
      {renderSelectedDateDetails()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 16,
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
  yearCard: {
    marginBottom: 16,
  },
  yearContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currentYear: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2196F3",
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  monthlyContainer: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  monthItem: {
    alignItems: "center",
    marginRight: 16,
    minWidth: 60,
  },
  monthName: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  monthTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  calendarCard: {
    marginBottom: 16,
  },
  detailsCard: {
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1976D2",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1976D2",
  },
  dividendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  dividendInfo: {
    flex: 1,
  },
  dividendSymbol: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  dividendCompany: {
    fontSize: 14,
    color: "#757575",
    marginTop: 2,
  },
  dividendShares: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  dividendAmount: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  perShare: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  emptyDate: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: "#757575",
  },
});

export default CalendarScreen;

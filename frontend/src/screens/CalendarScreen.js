import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Card, Title, Text, Button, Chip, ActivityIndicator } from "react-native-paper";
import { Calendar } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { portfolioAPI } from "../services/api";
import { showMessage } from "react-native-flash-message";
import { useTheme } from "../context/ThemeContext";

const CalendarScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [dividends, setDividends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchDividends = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.getDividendHistory();
      const dividendsData = response.data.history || [];
      setDividends(dividendsData);

      // Create marked dates for calendar
      const marked = {};
      dividendsData.forEach((dividend) => {
        // Handle different date formats
        let date;
        if (dividend.paymentDate) {
          date = new Date(dividend.paymentDate).toISOString().split("T")[0];
        } else if (dividend.date) {
          date = new Date(dividend.date).toISOString().split("T")[0];
        } else if (dividend.year && dividend.month) {
          // Create date from year and month
          date = new Date(dividend.year, dividend.month - 1, 1).toISOString().split("T")[0];
        } else {
          return; // Skip entries without valid date
        }

        if (marked[date]) {
          marked[date].dots.push({
            key: dividend._id || dividend.id,
            color: "#4CAF50",
            selectedDotColor: "#4CAF50",
          });
        } else {
          marked[date] = {
            dots: [
              {
                key: dividend._id || dividend.id,
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
      console.error("Error fetching dividends:", error);
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
      let dividendDate;
      if (dividend.paymentDate) {
        dividendDate = new Date(dividend.paymentDate).toISOString().split("T")[0];
      } else if (dividend.date) {
        dividendDate = new Date(dividend.date).toISOString().split("T")[0];
      } else if (dividend.year && dividend.month) {
        dividendDate = new Date(dividend.year, dividend.month - 1, 1).toISOString().split("T")[0];
      } else {
        return false;
      }
      return dividendDate === dateString;
    });
  };

  const getTotalForDate = (dateString) => {
    const dateDividends = getDividendsForDate(dateString);
    return dateDividends.reduce((sum, dividend) => {
      const amount = dividend.totalAmount || dividend.totalDividend || dividend.amount || 0;
      return sum + Number(amount);
    }, 0);
  };

  const getMonthlyTotal = (month) => {
    const monthDividends = dividends.filter((dividend) => {
      let dividendMonth;
      if (dividend.paymentDate) {
        dividendMonth = new Date(dividend.paymentDate).getMonth() + 1;
      } else if (dividend.date) {
        dividendMonth = new Date(dividend.date).getMonth() + 1;
      } else if (dividend.month) {
        dividendMonth = dividend.month;
      } else {
        return false;
      }
      return dividendMonth === month;
    });
    return monthDividends.reduce((sum, dividend) => {
      const amount = dividend.totalAmount || dividend.totalDividend || dividend.amount || 0;
      return sum + Number(amount);
    }, 0);
  };

  const renderMonthlySummary = () => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    return (
      <Card style={[styles.summaryCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <Title style={[styles.summaryTitle, { color: colors.text }]}>Monthly Summary ({selectedYear})</Title>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.monthlyContainer}>
              {months.map((month) => {
                const total = getMonthlyTotal(month);
                const monthName = new Date(selectedYear, month - 1, 1).toLocaleString("default", { month: "short" });

                return (
                  <View key={month} style={styles.monthItem}>
                    <Text style={[styles.monthName, { color: colors.textSecondary }]}>{monthName}</Text>
                    <Text style={[styles.monthTotal, { color: colors.success }]}>${total.toFixed(2)}</Text>
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
      <Card style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <Title style={[styles.detailsTitle, { color: colors.text }]}>
            {new Date(selectedDate).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Title>

          <View style={[styles.totalContainer, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.totalLabel, { color: colors.primary }]}>Total Income:</Text>
            <Text style={[styles.totalAmount, { color: colors.primary }]}>${totalForDate.toFixed(2)}</Text>
          </View>

          {selectedDividends.length > 0 ? (
            selectedDividends.map((dividend) => (
              <View key={dividend._id || dividend.id} style={[styles.dividendItem, { borderBottomColor: colors.border }]}>
                <View style={styles.dividendInfo}>
                  <Text style={[styles.dividendSymbol, { color: colors.text }]}>{dividend.symbol}</Text>
                  <Text style={[styles.dividendCompany, { color: colors.textSecondary }]}>{dividend.companyName}</Text>
                  <Text style={[styles.dividendShares, { color: colors.textSecondary }]}>{dividend.shares} shares</Text>
                </View>
                <View style={styles.dividendAmount}>
                  <Text style={[styles.amount, { color: colors.success }]}>${(dividend.totalAmount || dividend.totalDividend || dividend.amount || 0).toFixed(2)}</Text>
                  <Text style={[styles.perShare, { color: colors.textSecondary }]}>${(dividend.dividendPerShare || dividend.perShare || 0).toFixed(2)}/share</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyDate}>
              <Icon name="calendar-blank" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No dividends on this date</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  useEffect(() => {
    fetchDividends();
  }, [selectedYear]);

  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Year Selector */}
      <Card style={[styles.yearCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <View style={styles.yearContainer}>
            <Button mode="outlined" onPress={() => setSelectedYear(selectedYear - 1)} disabled={loading}>
              {selectedYear - 1}
            </Button>
            <Title style={[styles.currentYear, { color: colors.primary }]}>{selectedYear}</Title>
            <Button mode="outlined" onPress={() => setSelectedYear(selectedYear + 1)} disabled={loading}>
              {selectedYear + 1}
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Monthly Summary */}
      {renderMonthlySummary()}

      {/* Calendar */}
      <Card style={[styles.calendarCard, { backgroundColor: colors.surface }]}>
        <Card.Content>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={markedDates}
            markingType={"multi-dot"}
            theme={{
              backgroundColor: colors.surface,
              calendarBackground: colors.surface,
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.surface,
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.textDisabled,
              dotColor: colors.success,
              selectedDotColor: colors.surface,
              arrowColor: colors.primary,
              monthTextColor: colors.text,
              indicatorColor: colors.success,
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

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
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
      marginBottom: 4,
    },
    monthTotal: {
      fontSize: 14,
      fontWeight: "bold",
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
      padding: 16,
      borderRadius: 8,
      marginBottom: 16,
    },
    totalLabel: {
      fontSize: 16,
      fontWeight: "500",
    },
    totalAmount: {
      fontSize: 20,
      fontWeight: "bold",
    },
    dividendItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    dividendInfo: {
      flex: 1,
    },
    dividendSymbol: {
      fontSize: 16,
      fontWeight: "bold",
    },
    dividendCompany: {
      fontSize: 14,
      marginTop: 2,
    },
    dividendShares: {
      fontSize: 12,
      marginTop: 2,
    },
    dividendAmount: {
      alignItems: "flex-end",
    },
    amount: {
      fontSize: 16,
      fontWeight: "bold",
    },
    perShare: {
      fontSize: 12,
      marginTop: 2,
    },
    emptyDate: {
      alignItems: "center",
      paddingVertical: 32,
    },
    emptyText: {
      marginTop: 8,
      fontSize: 16,
    },
  });

export default CalendarScreen;

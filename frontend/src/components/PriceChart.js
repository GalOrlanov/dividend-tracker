import React, { useEffect, useMemo, useState, useRef } from "react";
import { View, Dimensions, ActivityIndicator, Text, TextInput, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { CartesianChart, Area, useChartPressState, Line } from "victory-native";
import { useTheme } from "../context/ThemeContext";
import { Circle } from "@shopify/react-native-skia";
import { debounce } from "lodash";

const { width } = Dimensions.get("window");

const PriceChart = ({ data = [], loading = false, onPointPress, style = {}, height = 240, symbol }) => {
  const theme = useTheme();
  const colors = theme?.colors || {
    surface: "#FFFFFF",
    primary: "#1976D2",
    text: "#212121",
    textSecondary: "#757575",
    border: "#E0E0E0",
  };

  const [showTooltip, setShowTooltip] = useState(false);

  // Initialize chart press state
  const { state: pressState, isActive } = useChartPressState({ x: 0, y: { price: 0 } });
  const [tooltipPrice, setTooltipPrice] = useState(null);
  const [tooltipPercent, setTooltipPercent] = useState(null);
  const [date, setDate] = useState(null);

  const [tooltipChange, setTooltipChange] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    console.log("Tooltip active - debounced", pressState.y.price.value.value);
    // Add your debounced logic here
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTooltipPrice(pressState.y.price.value.value);

        // Calculate percent change from first point
        const firstPrice = parseFloat(data[0]?.price) || 0;
        const currentPrice = pressState.y.price.value.value;
        const change = currentPrice - firstPrice;
        const percent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;
        const date = pressState.x.value.value;
        setDate(data[date].date);
        setTooltipPercent(percent);
        setTooltipChange(change);
      }, 10);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setTooltipPrice(null);
      setDate(null);
      setTooltipPercent(null);
      setTooltipChange(null);
    }
    // Cleanup function to cancel pending debounced calls
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, chartData, data]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((item, index) => ({
      x: index,
      y: parseFloat(item?.price) || 0,
      price: parseFloat(item?.price) || 0,
      date: item?.date,
      volume: item?.volume || 0,
      change: item?.change || 0,
      changePercent: item?.changePercent || 0,
      label: `$${parseFloat(item?.price).toFixed(2)}\n${new Date(item?.date).toLocaleDateString()}`,
    }));
  }, [data]);

  const getPriceChange = () => {
    if (!data || data.length < 2) return { change: 0, percent: 0, currentPrice: 0 };
    const firstPrice = parseFloat(data[0]?.price) || 0;
    const lastPrice = parseFloat(data[data.length - 1]?.price) || 0;
    const change = lastPrice - firstPrice;
    const percent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;
    return { change, percent, currentPrice: lastPrice };
  };

  const getTooltipPriceChange = () => {
    if (!isActive) return getPriceChange();

    const pointIndex = Math.round(pressState.x.value);
    const dataPoint = chartData[pointIndex];

    if (!dataPoint) return getPriceChange();

    const firstPrice = parseFloat(data[0]?.price) || 0;
    const currentPrice = dataPoint.price;
    const change = currentPrice - firstPrice;
    const percent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;

    return {
      change,
      percent,
      currentPrice,
      dailyChange: dataPoint.change,
      dailyChangePercent: dataPoint.changePercent,
    };
  };

  const getTooltipPosition = () => {
    if (!isActive) return { top: 10, left: 16 };

    // Calculate position based on press state
    const chartWidth = width - 64;
    const pointIndex = pressState.x.value;
    const totalPoints = chartData.length;
    const left = Math.max(16, Math.min(chartWidth - 140, (pointIndex / totalPoints) * chartWidth));

    return { top: 10, left };
  };

  const formatTooltipContent = () => {
    if (!isActive) return null;

    const pointIndex = Math.round(pressState.x.value);
    const dataPoint = chartData[pointIndex];

    if (!dataPoint) return null;

    const date = new Date(dataPoint.date);
    const formattedDate = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const isPositive = dataPoint.change >= 0;
    const changeColor = isPositive ? "#4CAF50" : "#F44336";
    const changeSign = isPositive ? "+" : "";

    return {
      symbol: symbol,
      price: `$${tooltipPrice ? tooltipPrice.toFixed(2) : dataPoint.price.toFixed(2)}`,
      date: formattedDate,
      change: tooltipChange !== null ? `${tooltipChange >= 0 ? "+" : ""}${tooltipChange.toFixed(2)}` : `${changeSign}${dataPoint.change.toFixed(2)}`,
      changePercent: tooltipPercent !== null ? `${tooltipPercent >= 0 ? "+" : ""}${tooltipPercent.toFixed(2)}%` : `${changeSign}${dataPoint.changePercent.toFixed(2)}%`,
      volume: dataPoint.volume ? `$${(dataPoint.volume / 1000000).toFixed(1)}M` : "N/A",
      changeColor,
      // Access the actual x and y values from pressState
      xValue: pressState.x.value,
      yValue: pressState.y.price.value,
      xPosition: pressState.x.position.value,
      yPosition: pressState.y.price.position.value,
    };
  };

  const hideTooltip = () => {
    setShowTooltip(false);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading chart data...</Text>
      </View>
    );
  }

  if (!chartData.length) {
    return (
      <View style={[styles.noDataContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>No price data available</Text>
      </View>
    );
  }

  const priceChange = getTooltipPriceChange();
  const isPositive = priceChange.change >= 0;
  const lineColor = isPositive ? "#4CAF50" : "#F44336";
  const tooltipPosition = getTooltipPosition();
  const tooltipContent = formatTooltipContent();

  return (
    <TouchableWithoutFeedback onPress={hideTooltip}>
      <View style={[styles.chartContainer, { backgroundColor: colors.surface }, style]}>
        <Text style={[styles.chartTitle, { color: colors.text }]}>{symbol} Price Chart</Text>
        <View style={styles.priceInfoContainer}>
          <View style={styles.priceInfo}>
            <Text style={[styles.priceText, { color: colors.text }]}>${tooltipPrice ? tooltipPrice.toFixed(2) : priceChange.currentPrice.toFixed(2)}</Text>
            <View style={styles.changeContainer}>
              <Text style={[styles.changeText, isPositive ? styles.positiveChange : styles.negativeChange]}>
                {tooltipChange !== null ? (tooltipChange >= 0 ? "+" : "") + tooltipChange.toFixed(2) : (isPositive ? "+" : "") + priceChange.change.toFixed(2)} (
                {tooltipPercent !== null ? (tooltipPercent >= 0 ? "+" : "") + tooltipPercent.toFixed(2) : (isPositive ? "+" : "") + priceChange.percent.toFixed(2)}%)
              </Text>
            </View>
          </View>
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{isActive ? date : ""}</Text>
        </View>

        <View style={[styles.chartArea, { backgroundColor: colors.background }]}>
          <CartesianChart data={chartData} xKey="x" yKeys={["y", "price"]} width={width - 64} height={200} chartPressState={pressState}>
            {({ points, chartBounds }) => {
              return (
                <>
                  <Line color="rgb(100, 100, 255)" points={points.y} y0={chartBounds.bottom} strokeWidth={2} animate={{ type: "timing", duration: 300 }} fillOpacity={0.3} />
                  <Area color="rgba(100, 100, 255, 0.2)" points={points.y} y0={chartBounds.bottom} animate={{ type: "timing", duration: 300 }} fillOpacity={0.3} />
                  {isActive ? <ToolTip x={pressState.x.position} y={pressState.y.price.position} points={points} /> : null}
                </>
              );
            }}
          </CartesianChart>

          {isActive && tooltipContent && (
            <View
              style={[
                styles.tooltip,
                tooltipPosition,
                {
                  backgroundColor: colors.isDark ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)",
                  borderColor: colors.isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.1)",
                },
              ]}
            >
              <View style={styles.tooltipHeader}>
                <Text style={[styles.tooltipSymbol, { color: colors.text }]}>{tooltipContent.symbol}</Text>
                <Text style={[styles.tooltipDate, { color: colors.textSecondary }]}>{tooltipContent.date}</Text>
              </View>

              <View style={styles.tooltipPriceRow}>
                <Text style={[styles.tooltipPrice, { color: colors.text }]}>{tooltipContent.price}</Text>
                <Text style={[styles.tooltipChange, { color: tooltipContent.changeColor }]}>
                  {tooltipContent.change} ({tooltipContent.changePercent})
                </Text>
              </View>

              <View style={styles.tooltipVolumeRow}>
                <Text style={[styles.tooltipVolumeLabel, { color: colors.textSecondary }]}>Volume:</Text>
                <Text style={[styles.tooltipVolume, { color: colors.text }]}>{tooltipContent.volume}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

function ToolTip({ x, y, points }) {
  return (
    <>
      <Circle cx={x} cy={y} r={3} color="rgb(100, 100, 255)" />
      <Circle cx={x} cy={y} r={8} color="rgba(100, 100, 255,0.2)" />
    </>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  chartArea: {
    width: width - 64,
    height: 200,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  priceInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 8,
    gap: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "700",
    alignItems: "center",
    textAlign: "center",
    justifyContent: "center",
  },
  dateText: {
    fontSize: 14,
  },
  changeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  positiveChange: {
    color: "#4CAF50",
  },
  negativeChange: {
    color: "#F44336",
  },
  tooltip: {
    position: "absolute",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 120,
  },
  tooltipHeader: {
    marginBottom: 8,
  },
  tooltipSymbol: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  tooltipDate: {
    fontSize: 11,
  },
  tooltipPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  tooltipPrice: {
    fontSize: 16,
    fontWeight: "700",
  },
  tooltipChange: {
    fontSize: 12,
    fontWeight: "600",
  },
  tooltipVolumeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tooltipVolumeLabel: {
    fontSize: 11,
  },
  tooltipVolume: {
    fontSize: 11,
    fontWeight: "500",
  },
  loadingContainer: {
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
  priceInfoContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  noDataContainer: {
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataText: {
    fontSize: 14,
    textAlign: "center",
  },
  changeContainer: {
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  dailyChangeText: {
    fontSize: 12,
    marginTop: 2,
  },
  tooltipAdditionalInfo: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tooltipAdditionalLabel: {
    fontSize: 11,
    color: "#CCCCCC",
  },
  tooltipAdditionalValue: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  tooltipDebugInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  tooltipDebugLabel: {
    fontSize: 10,
    color: "#CCCCCC",
  },
});

export default PriceChart;

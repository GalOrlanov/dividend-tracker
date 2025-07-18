import React, { useState, useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from "react-native";
import { Card, Title, Paragraph, Chip } from "react-native-paper";
import { CartesianChart, Line, useChartPressState } from "victory-native";
import { Circle } from "@shopify/react-native-skia";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { calculateForecastScenarios, getForecastChartData, getForecastSummary } from "../utils/forecastCalculator";

const { width } = Dimensions.get("window");

const InteractiveForecastChart = ({ data, colors, height, width: chartWidth, selectedChartType, dividendView, onTooltipChange, annualDividendYield }) => {
  const intervalRef = useRef(null);

  // Initialize chart press state
  const { state: pressState, isActive } = useChartPressState({ x: 0, y: { portfolio: 0, dividend: 0 } });

  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      console.log("ForecastChart: No data provided");
      return [];
    }

    const processedData = data.map((item, index) => {
      // For year 0 (current year), calculate the initial dividend income
      let dividendValue = item.dividendsReceived || 0;
      if (item.year === 0) {
        // Calculate initial dividend income based on initial investment and dividend yield
        const initialDividendIncome = (item.portfolioValue || 0) * (annualDividendYield / 100);
        dividendValue = initialDividendIncome;
      }

      return {
        x: index,
        portfolio: Math.round(item.portfolioValue || 0),
        dividend: Math.round(dividendView === "monthly" ? dividendValue / 12 : dividendValue),
        year: item.year || 0,
        portfolioValue: Math.round(item.portfolioValue || 0),
        dividendsReceived: Math.round(dividendValue),
      };
    });

    console.log("ForecastChart: Processed data:", processedData);
    console.log("ForecastChart: Selected chart type:", selectedChartType);
    console.log("ForecastChart: Dividend view:", dividendView);

    return processedData;
  }, [data, dividendView]);

  useEffect(() => {
    if (isActive) {
      console.log("Chart is active, starting interval");
      intervalRef.current = setInterval(() => {
        // const pointIndex = Math.round(pressState.y.value);
        //  const dataPoint = chartData[pointIndex];

        if (onTooltipChange) {
          const tooltipData = {
            portfolio: pressState.y.portfolio.value.value,
            dividend: pressState.y.dividend.value.value,
            year: chartData[pressState.x.value.value]?.year,
            isActive: true,
          };
          console.log("Calling onTooltipChange with:", tooltipData);
          onTooltipChange(tooltipData);
        }
      }, 10);
    } else {
      console.log("Chart is not active, clearing interval");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (onTooltipChange) {
        const resetData = {
          portfolio: null,
          dividend: null,
          year: null,
          isActive: false,
        };
        console.log("Calling onTooltipChange with reset:", resetData);
        onTooltipChange(resetData);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, chartData, pressState.x.value, onTooltipChange]);

  if (chartData.length === 0) {
    return (
      <View style={{ height, width: chartWidth, justifyContent: "center", alignItems: "center" }}>
        <Text>No forecast data available</Text>
      </View>
    );
  }

  // Determine which yKeys to use based on selectedChartType
  const yKeys = [];
  if (selectedChartType === "portfolio" || selectedChartType === "both") {
    yKeys.push("portfolio");
  }
  if (selectedChartType === "dividend" || selectedChartType === "both") {
    yKeys.push("dividend");
  }

  return (
    <View style={{ position: "relative", height, width: chartWidth }}>
      <CartesianChart data={chartData} xKey="x" yKeys={yKeys} width={chartWidth} height={height} chartPressState={pressState}>
        {({ points, chartBounds }) => {
          console.log("ForecastChart: Points available:", Object.keys(points));
          return (
            <>
              {/* Portfolio line */}
              {(selectedChartType === "portfolio" || selectedChartType === "both") && points.portfolio && (
                <Line points={points.portfolio} color={colors.chartPrimary} strokeWidth={3} animate={{ type: "timing", duration: 300 }} />
              )}

              {/* Dividend line */}
              {(selectedChartType === "dividend" || selectedChartType === "both") && points.dividend && (
                <Line points={points.dividend} color={colors.chartSecondary} strokeWidth={2} animate={{ type: "timing", duration: 300 }} />
              )}

              {/* Interactive data points */}
              {isActive && (
                <>
                  {(selectedChartType === "portfolio" || selectedChartType === "both") && pressState.y.portfolio && (
                    <Circle cx={pressState.x.position} cy={pressState.y.portfolio.position} r={4} color={colors.chartPrimary} style="fill" />
                  )}
                  {(selectedChartType === "dividend" || selectedChartType === "both") && pressState.y.dividend && (
                    <Circle cx={pressState.x.position} cy={pressState.y.dividend.position} r={3} color={colors.chartSecondary} style="fill" />
                  )}
                </>
              )}
            </>
          );
        }}
      </CartesianChart>
    </View>
  );
};

const ForecastChart = ({ initialInvestment = 10000, annualDividendYield = 3.5, years = 10, showScenarios = true }) => {
  const { colors } = useTheme();
  const [selectedScenario, setSelectedScenario] = useState("moderate");
  const [selectedChartType, setSelectedChartType] = useState("both"); // "portfolio", "dividend", "both"
  const [dividendView, setDividendView] = useState("yearly"); // "yearly", "monthly"
  const [forecastData, setForecastData] = useState([]);
  const [summary, setSummary] = useState({});
  const [tooltipPortfolio, setTooltipPortfolio] = useState(null);
  const [tooltipDividend, setTooltipDividend] = useState(null);
  const [tooltipYear, setTooltipYear] = useState(null);
  const [isTooltipActive, setIsTooltipActive] = useState(false);

  useEffect(() => {
    calculateForecast();
  }, [initialInvestment, annualDividendYield, years, selectedScenario]);

  const calculateForecast = () => {
    if (showScenarios) {
      const scenarios = calculateForecastScenarios(initialInvestment, annualDividendYield, years);
      setForecastData(scenarios[selectedScenario]);
    } else {
      const { moderate } = calculateForecastScenarios(initialInvestment, annualDividendYield, years);
      setForecastData(moderate);
    }

    const scenarios = calculateForecastScenarios(initialInvestment, annualDividendYield, years);
    const currentData = scenarios[selectedScenario];
    const summaryData = getForecastSummary(currentData);
    setSummary(summaryData);
  };

  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return "$0";
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatPercentage = (value) => {
    if (!value || isNaN(value)) return "0.0%";
    return `${value.toFixed(1)}%`;
  };

  const getDisplayValues = () => {
    if (isTooltipActive) {
      console.log("Displaying tooltip values:", { portfolio: tooltipPortfolio, dividend: tooltipDividend, year: tooltipYear });
      return {
        portfolio: tooltipPortfolio,
        dividend: tooltipDividend,
        year: tooltipYear,
        isActive: true,
      };
    } else {
      // For the default display (not tooltip), show initial values for current year
      const initialPortfolio = summary.initialValue || 0;
      const initialDividend = summary.initialDividendIncome || 0;
      console.log("Displaying initial values:", { portfolio: initialPortfolio, dividend: initialDividend, year: 0 });
      return {
        portfolio: initialPortfolio,
        dividend: initialDividend,
        year: 0,
        isActive: false,
      };
    }
  };

  const displayValues = getDisplayValues();

  const scenarios = {
    conservative: { label: "Conservative", color: colors.warning },
    moderate: { label: "Moderate", color: colors.success },
    aggressive: { label: "Aggressive", color: colors.error },
  };

  const chartTypes = {
    portfolio: { label: "Portfolio Value", color: colors.chartPrimary },
    dividend: { label: "Dividend", color: colors.chartSecondary },
    both: { label: "Both", color: colors.chartQuaternary },
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      margin: 16,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    scenarioContainer: {
      marginBottom: 16,
    },
    scenarioLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    scenarioChips: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    scenarioChip: {
      backgroundColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
    },
    scenarioChipText: {
      fontSize: 12,
      color: colors.text,
    },
    chartTypeContainer: {
      marginBottom: 16,
    },
    chartTypeLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    chartTypeChips: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    chartTypeChip: {
      backgroundColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
    },
    chartTypeChipText: {
      fontSize: 12,
      color: colors.text,
    },
    dividendViewContainer: {
      marginBottom: 16,
    },
    dividendViewLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    dividendViewChips: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    dividendViewChip: {
      backgroundColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
    },
    dividendViewChipText: {
      fontSize: 12,
      color: colors.text,
    },
    summaryContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
    },
    summaryItem: {
      alignItems: "center",
      flex: 1,
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
    chart: {
      marginVertical: 8,
      borderRadius: 16,
      alignItems: "center",
    },
    legend: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 16,
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 8,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 4,
    },
    legendText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    tooltip: {
      backgroundColor: "white",
      borderRadius: 8,
      padding: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    tooltipHeader: {
      marginBottom: 5,
    },
    tooltipYear: {
      fontSize: 14,
      fontWeight: "bold",
    },
    tooltipRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    tooltipLabel: {
      fontSize: 12,
    },
    tooltipValue: {
      fontSize: 12,
      fontWeight: "bold",
    },
    interactiveDisplay: {
      marginTop: 16,
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    displayHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    displayTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    displayYear: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    displayValues: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    displayItem: {
      alignItems: "center",
    },
    displayLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    displayValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
  });

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>Dividend Reinvestment Forecast</Text>
          <MaterialIcons name="trending-up" size={24} color={colors.success} />
        </View>

        {showScenarios && (
          <View style={styles.scenarioContainer}>
            <Text style={styles.scenarioLabel}>Growth Scenario:</Text>
            <View style={styles.scenarioChips}>
              {Object.entries(scenarios).map(([key, scenario]) => (
                <TouchableOpacity key={key} onPress={() => setSelectedScenario(key)} style={[styles.scenarioChip, selectedScenario === key && { backgroundColor: scenario.color }]}>
                  <Text style={[styles.scenarioChipText, selectedScenario === key && { color: "white" }]}>{scenario.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.chartTypeContainer}>
          <Text style={styles.chartTypeLabel}>Chart Type:</Text>
          <View style={styles.chartTypeChips}>
            {Object.entries(chartTypes).map(([key, chartType]) => (
              <TouchableOpacity key={key} onPress={() => setSelectedChartType(key)} style={[styles.chartTypeChip, selectedChartType === key && { backgroundColor: chartType.color }]}>
                <Text style={[styles.chartTypeChipText, selectedChartType === key && { color: "white" }]}>{chartType.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedChartType === "dividend" && (
          <View style={styles.dividendViewContainer}>
            <Text style={styles.dividendViewLabel}>Dividend View:</Text>
            <View style={styles.dividendViewChips}>
              <TouchableOpacity onPress={() => setDividendView("yearly")} style={[styles.dividendViewChip, dividendView === "yearly" && { backgroundColor: colors.chartSecondary }]}>
                <Text style={[styles.dividendViewChipText, dividendView === "yearly" && { color: "white" }]}>Yearly</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setDividendView("monthly")} style={[styles.dividendViewChip, dividendView === "monthly" && { backgroundColor: colors.chartSecondary }]}>
                <Text style={[styles.dividendViewChipText, dividendView === "monthly" && { color: "white" }]}>Monthly</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{selectedChartType === "dividend" ? "Initial Income" : "Initial Investment"}</Text>
            <Text style={styles.summaryValue}>
              {selectedChartType === "dividend"
                ? dividendView === "monthly"
                  ? formatCurrency((summary.initialDividendIncome || 0) / 12)
                  : formatCurrency(summary.initialDividendIncome || 0)
                : formatCurrency(summary.initialValue || 0)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{selectedChartType === "dividend" ? "Final Income" : "Final Value"}</Text>
            <Text style={styles.summaryValue}>
              {selectedChartType === "dividend"
                ? dividendView === "monthly"
                  ? formatCurrency((summary.finalDividendIncome || 0) / 12)
                  : formatCurrency(summary.finalDividendIncome || 0)
                : formatCurrency(summary.finalValue || 0)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Growth</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              +{formatPercentage(selectedChartType === "dividend" ? summary.dividendGrowthPercentage || 0 : summary.growthPercentage || 0)}
            </Text>
          </View>
        </View>

        {/* Interactive Values Display */}
        <View style={styles.interactiveDisplay}>
          <View style={styles.displayHeader}>
            <Text style={styles.displayTitle}>Forecast Values</Text>
            <Text style={styles.displayYear}>
              {displayValues.isActive
                ? `Year ${new Date().getFullYear() + displayValues.year}`
                : displayValues.year === 0
                ? `Year ${new Date().getFullYear()}`
                : `Year ${new Date().getFullYear() + displayValues.year}`}
            </Text>
          </View>

          <View style={styles.displayValues}>
            {(selectedChartType === "portfolio" || selectedChartType === "both") && (
              <View style={styles.displayItem}>
                <Text style={styles.displayLabel}>Portfolio Value:</Text>
                <Text style={styles.displayValue}>{formatCurrency(displayValues.portfolio)}</Text>
              </View>
            )}

            {(selectedChartType === "dividend" || selectedChartType === "both") && (
              <View style={styles.displayItem}>
                <Text style={styles.displayLabel}>{dividendView === "monthly" ? "Monthly" : "Annual"} Dividend:</Text>
                <Text style={styles.displayValue}>{formatCurrency(displayValues.dividend)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.chart}>
          <InteractiveForecastChart
            data={forecastData}
            colors={colors}
            height={220}
            width={width - 60}
            selectedChartType={selectedChartType}
            dividendView={dividendView}
            annualDividendYield={annualDividendYield}
            onTooltipChange={(tooltipData) => {
              setTooltipPortfolio(tooltipData.portfolio);
              setTooltipDividend(tooltipData.dividend);
              setTooltipYear(tooltipData.year);
              setIsTooltipActive(tooltipData.isActive);
            }}
          />
        </View>

        <View style={styles.legend}>
          {(selectedChartType === "portfolio" || selectedChartType === "both") && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.chartPrimary }]} />
              <Text style={styles.legendText}>Portfolio Value</Text>
            </View>
          )}
          {(selectedChartType === "dividend" || selectedChartType === "both") && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.chartSecondary }]} />
              <Text style={styles.legendText}>{dividendView === "monthly" ? "Monthly Dividends" : "Annual Dividends"}</Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

export default ForecastChart;

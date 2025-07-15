import React, { useState, useEffect } from "react";
import { View, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { Card, Title, Paragraph, Chip, Text } from "react-native-paper";
import { LineChart } from "react-native-chart-kit";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { calculateForecastScenarios, getForecastChartData, getForecastSummary } from "../utils/forecastCalculator";

const { width } = Dimensions.get("window");

const ForecastChart = ({ initialInvestment = 10000, annualDividendYield = 3.5, years = 10, showScenarios = true }) => {
  const [selectedScenario, setSelectedScenario] = useState("moderate");
  const [selectedChartType, setSelectedChartType] = useState("both"); // "portfolio", "dividends", "both"
  const [forecastData, setForecastData] = useState([]);
  const [summary, setSummary] = useState({});

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

  const getChartData = () => {
    if (!forecastData || forecastData.length === 0) {
      return {
        labels: ["Y0"],
        datasets: [
          {
            data: [0],
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      };
    }

    const labels = forecastData.map((item) => `Y${item.year || 0}`);
    const portfolioValues = forecastData.map((item) => Math.round(item.portfolioValue || 0));
    const dividendIncome = forecastData.map((item) => Math.round(item.dividendsReceived || 0));

    let datasets = [];

    if (selectedChartType === "portfolio" || selectedChartType === "both") {
      datasets.push({
        data: portfolioValues,
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for portfolio growth
        strokeWidth: 3,
      });
    }

    if (selectedChartType === "dividends" || selectedChartType === "both") {
      datasets.push({
        data: dividendIncome,
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue for dividend income
        strokeWidth: 2,
      });
    }

    return { labels, datasets };
  };

  const chartData = getChartData();

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: "#4CAF50",
    },
    propsForBackgroundLines: {
      strokeDasharray: "",
      stroke: "#E0E0E0",
      strokeWidth: 1,
    },
  };

  const scenarios = {
    conservative: { label: "Conservative", color: "#FF9800" },
    moderate: { label: "Moderate", color: "#4CAF50" },
    aggressive: { label: "Aggressive", color: "#F44336" },
  };

  const chartTypes = {
    portfolio: { label: "Portfolio Value", color: "#4CAF50" },
    dividends: { label: "Annual Dividends", color: "#2196F3" },
    both: { label: "Both", color: "#9C27B0" },
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

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <Title style={styles.title}>Dividend Reinvestment Forecast</Title>
          <Icon name="trending-up" size={24} color="#4CAF50" />
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

        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Initial Investment</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.initialValue || 0)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Final Value</Text>
            <Text style={styles.summaryValue}>{formatCurrency(summary.finalValue || 0)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Growth</Text>
            <Text style={[styles.summaryValue, { color: "#4CAF50" }]}>+{formatPercentage(summary.growthPercentage || 0)}</Text>
          </View>
        </View>

        <LineChart
          data={chartData}
          width={width - 60}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withDots={false}
          withShadow={false}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
        />

        <View style={styles.legend}>
          {(selectedChartType === "portfolio" || selectedChartType === "both") && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#4CAF50" }]} />
              <Text style={styles.legendText}>Portfolio Value</Text>
            </View>
          )}
          {(selectedChartType === "dividends" || selectedChartType === "both") && (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#2196F3" }]} />
              <Text style={styles.legendText}>Annual Dividends</Text>
            </View>
          )}
        </View>

        <View style={styles.assumptions}>
          <Text style={styles.assumptionsTitle}>Assumptions:</Text>
          <Text style={styles.assumptionsText}>• {formatPercentage(annualDividendYield || 0)} annual dividend yield</Text>
          <Text style={styles.assumptionsText}>• All dividends reinvested in same investments</Text>
          <Text style={styles.assumptionsText}>• {scenarios[selectedScenario]?.label || "Moderate"} growth scenario</Text>
          <Text style={styles.assumptionsText}>• {years || 10}-year forecast period</Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    flex: 1,
  },
  scenarioContainer: {
    marginBottom: 16,
  },
  scenarioLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 8,
  },
  scenarioChips: {
    flexDirection: "row",
    gap: 8,
  },
  scenarioChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F5F5F5",
  },
  scenarioChipText: {
    fontSize: 12,
    color: "#757575",
  },
  chartTypeContainer: {
    marginBottom: 16,
  },
  chartTypeLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 8,
  },
  chartTypeChips: {
    flexDirection: "row",
    gap: 8,
  },
  chartTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F5F5F5",
  },
  chartTypeChipText: {
    fontSize: 12,
    color: "#757575",
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#757575",
  },
  assumptions: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  assumptionsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  assumptionsText: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
});

export default ForecastChart;

import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { Card, Title, Paragraph, Button, Text, TextInput } from "react-native-paper";
import Slider from "@react-native-community/slider";
import { LineChart } from "react-native-chart-kit";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { portfolioAPI } from "../services/api";
import { showMessage } from "react-native-flash-message";
import { calculateForecastScenarios, getForecastChartData, getForecastSummary } from "../utils/forecastCalculator";

const { width } = Dimensions.get("window");

const ForecastScreen = ({ navigation }) => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedScenario, setSelectedScenario] = useState("moderate");
  const [selectedChartType, setSelectedChartType] = useState("both"); // "portfolio", "dividends", "both"
  const [forecastData, setForecastData] = useState([]);
  const [summary, setSummary] = useState({});

  // Customizable parameters
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [annualDividendYield, setAnnualDividendYield] = useState(3.5);
  const [years, setYears] = useState(10);
  const [customDividendGrowth, setCustomDividendGrowth] = useState(5);
  const [customMarketGrowth, setCustomMarketGrowth] = useState(7);

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  useEffect(() => {
    calculateForecast();
  }, [initialInvestment, annualDividendYield, years, selectedScenario, customDividendGrowth, customMarketGrowth]);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.getPortfolio();
      setPortfolioData(response.data);

      // Set initial values from portfolio if available
      if (response.data && response.data.totals) {
        const totalInvestment = response.data.totals.totalInvestment || 10000;
        const averageYield = response.data.totals.averageYield || 3.5;

        setInitialInvestment(totalInvestment);
        setAnnualDividendYield(averageYield);
      }
    } catch (error) {
      showMessage({
        message: "Error",
        description: "Failed to load portfolio data",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateForecast = () => {
    let scenarios;

    if (selectedScenario === "custom") {
      // Use custom parameters
      const customForecast = calculateForecastScenarios(initialInvestment, annualDividendYield, years);
      scenarios = {
        custom: customForecast.moderate.map((item, index) => ({
          ...item,
          portfolioValue: item.portfolioValue * (1 + (customMarketGrowth - 7) / 100) ** (index + 1),
          dividendsReceived: item.dividendsReceived * (1 + (customDividendGrowth - 5) / 100) ** (index + 1),
        })),
      };
    } else {
      scenarios = calculateForecastScenarios(initialInvestment, annualDividendYield, years);
    }

    setForecastData(scenarios[selectedScenario]);
    const summaryData = getForecastSummary(scenarios[selectedScenario]);
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
    conservative: { label: "Conservative", color: "#FF9800", description: "3% dividend growth, 5% market growth" },
    moderate: { label: "Moderate", color: "#4CAF50", description: "5% dividend growth, 7% market growth" },
    aggressive: { label: "Aggressive", color: "#F44336", description: "7% dividend growth, 9% market growth" },
    custom: { label: "Custom", color: "#9C27B0", description: "Custom growth rates" },
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="loading" size={48} color="#2196F3" />
        <Text style={styles.loadingText}>Loading forecast data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <Icon name="trending-up" size={32} color="#4CAF50" />
            <View style={styles.headerText}>
              <Title style={styles.headerTitle}>Dividend Reinvestment Forecast</Title>
              <Paragraph style={styles.headerSubtitle}>See how your portfolio could grow with dividend reinvestment</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Parameters Card */}
      <Card style={styles.parametersCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Forecast Parameters</Title>

          <View style={styles.parameterRow}>
            <Text style={styles.parameterLabel}>Initial Investment</Text>
            <TextInput
              value={(initialInvestment || 0).toString()}
              onChangeText={(text) => setInitialInvestment(parseFloat(text) || 0)}
              keyboardType="numeric"
              style={styles.textInput}
              mode="outlined"
              dense
            />
          </View>

          <View style={styles.parameterRow}>
            <Text style={styles.parameterLabel}>Annual Dividend Yield ({formatPercentage(annualDividendYield || 0)})</Text>
            <Slider
              value={annualDividendYield || 0}
              onValueChange={setAnnualDividendYield}
              minimumValue={0.5}
              maximumValue={10}
              step={0.1}
              style={styles.slider}
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#E0E0E0"
              thumbStyle={{ backgroundColor: "#4CAF50" }}
            />
          </View>

          <View style={styles.parameterRow}>
            <Text style={styles.parameterLabel}>Forecast Period ({years || 10} years)</Text>
            <Slider
              value={years || 10}
              onValueChange={setYears}
              minimumValue={5}
              maximumValue={30}
              step={1}
              style={styles.slider}
              minimumTrackTintColor="#4CAF50"
              maximumTrackTintColor="#E0E0E0"
              thumbStyle={{ backgroundColor: "#4CAF50" }}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Scenario Selection */}
      <Card style={styles.scenarioCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Growth Scenario</Title>
          <View style={styles.scenarioContainer}>
            {Object.entries(scenarios).map(([key, scenario]) => (
              <TouchableOpacity key={key} onPress={() => setSelectedScenario(key)} style={[styles.scenarioChip, selectedScenario === key && { backgroundColor: scenario.color }]}>
                <Text style={[styles.scenarioChipText, selectedScenario === key && { color: "white" }]}>{scenario.label}</Text>
                <Text style={[styles.scenarioDescription, selectedScenario === key && { color: "white" }]}>{scenario.description}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedScenario === "custom" && (
            <View style={styles.customParameters}>
              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Dividend Growth Rate ({formatPercentage(customDividendGrowth || 0)})</Text>
                <Slider
                  value={customDividendGrowth || 0}
                  onValueChange={setCustomDividendGrowth}
                  minimumValue={0}
                  maximumValue={15}
                  step={0.5}
                  style={styles.slider}
                  minimumTrackTintColor="#9C27B0"
                  maximumTrackTintColor="#E0E0E0"
                  thumbStyle={{ backgroundColor: "#9C27B0" }}
                />
              </View>

              <View style={styles.parameterRow}>
                <Text style={styles.parameterLabel}>Market Growth Rate ({formatPercentage(customMarketGrowth || 0)})</Text>
                <Slider
                  value={customMarketGrowth || 0}
                  onValueChange={setCustomMarketGrowth}
                  minimumValue={0}
                  maximumValue={15}
                  step={0.5}
                  style={styles.slider}
                  minimumTrackTintColor="#9C27B0"
                  maximumTrackTintColor="#E0E0E0"
                  thumbStyle={{ backgroundColor: "#9C27B0" }}
                />
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Summary Statistics */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Forecast Summary</Title>
          <View style={styles.summaryGrid}>
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
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Dividends</Text>
              <Text style={styles.summaryValue}>{formatCurrency(summary.totalDividends || 0)}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Chart Type Selection */}
      <Card style={styles.chartTypeCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Chart Type</Title>
          <View style={styles.chartTypeContainer}>
            {Object.entries(chartTypes).map(([key, chartType]) => (
              <TouchableOpacity key={key} onPress={() => setSelectedChartType(key)} style={[styles.chartTypeChip, selectedChartType === key && { backgroundColor: chartType.color }]}>
                <Text style={[styles.chartTypeChipText, selectedChartType === key && { color: "white" }]}>{chartType.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Forecast Chart */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Growth Projection</Title>
          <LineChart
            data={chartData}
            width={width - 40}
            height={280}
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
        </Card.Content>
      </Card>

      {/* Assumptions */}
      <Card style={styles.assumptionsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Key Assumptions</Title>
          <View style={styles.assumptionsList}>
            <View style={styles.assumptionItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.assumptionText}>All dividends are reinvested in the same investments</Text>
            </View>
            <View style={styles.assumptionItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.assumptionText}>Dividend yields and growth rates remain consistent</Text>
            </View>
            <View style={styles.assumptionItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.assumptionText}>Market conditions follow historical averages</Text>
            </View>
            <View style={styles.assumptionItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.assumptionText}>No additional contributions or withdrawals</Text>
            </View>
            <View style={styles.assumptionItem}>
              <Icon name="check-circle" size={16} color="#4CAF50" />
              <Text style={styles.assumptionText}>Tax implications are not considered</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
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
  headerCard: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "#757575",
  },
  parametersCard: {
    marginBottom: 16,
  },
  scenarioCard: {
    marginBottom: 16,
  },
  summaryCard: {
    marginBottom: 16,
  },
  chartCard: {
    marginBottom: 16,
  },
  chartTypeCard: {
    marginBottom: 16,
  },
  assumptionsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  parameterRow: {
    marginBottom: 16,
  },
  parameterLabel: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "white",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  scenarioContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  scenarioChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F5F5F5",
    minWidth: 120,
    alignItems: "center",
  },
  scenarioChipText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#757575",
  },
  scenarioDescription: {
    fontSize: 10,
    color: "#757575",
    textAlign: "center",
    marginTop: 2,
  },
  customParameters: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  summaryItem: {
    width: "48%",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
    textAlign: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    textAlign: "center",
  },
  chartTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chartTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F5F5F5",
    minWidth: 120,
    alignItems: "center",
  },
  chartTypeChipText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#757575",
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
  assumptionsList: {
    gap: 12,
  },
  assumptionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  assumptionText: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 8,
    flex: 1,
  },
});

export default ForecastScreen;

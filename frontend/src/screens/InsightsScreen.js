import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from "react-native";
import { Card, Title, Text, Button, TextInput, Chip, ActivityIndicator, Divider, ProgressBar } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { showMessage } from "react-native-flash-message";
import { calculateForecastScenarios, getForecastSummary } from "../utils/forecastCalculator";
import { portfolioAPI } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const InsightsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("calculator");
  const [portfolioData, setPortfolioData] = useState(null);
  const [incomeTarget, setIncomeTarget] = useState("");
  const [timeframe, setTimeframe] = useState("10");
  const [riskProfile, setRiskProfile] = useState("moderate");
  const [customYield, setCustomYield] = useState("4.0");
  const [investmentFrequency, setInvestmentFrequency] = useState("lump-sum");
  const [reinvestDividends, setReinvestDividends] = useState(true);
  const [forecastData, setForecastData] = useState(null);
  const [showEducationalContent, setShowEducationalContent] = useState(false);
  const [isLoadingSavedData, setIsLoadingSavedData] = useState(false);

  // Storage keys for calculator data
  const CALCULATOR_DATA_KEY = "insights_calculator_data";

  const riskProfiles = {
    conservative: {
      label: "Conservative",
      color: colors.warning,
      dividendYield: 3.0,
      growthRate: 3,
      marketGrowth: 5,
      description: "Lower yield, stable companies, lower risk",
      characteristics: ["Stable dividend payments", "Low volatility", "Established companies", "Lower growth potential"],
    },
    moderate: {
      label: "Moderate",
      color: colors.success,
      dividendYield: 4.5,
      growthRate: 5,
      marketGrowth: 7,
      description: "Balanced yield and growth potential",
      characteristics: ["Balanced risk/reward", "Moderate growth", "Diversified sectors", "Steady income"],
    },
    aggressive: {
      label: "Aggressive",
      color: colors.error,
      dividendYield: 6.0,
      growthRate: 7,
      marketGrowth: 9,
      description: "Higher yield, potentially higher risk",
      characteristics: ["Higher dividend yields", "Growth potential", "Higher volatility", "Greater risk"],
    },
    custom: {
      label: "Custom",
      color: colors.primary,
      dividendYield: 4.0,
      growthRate: 5,
      marketGrowth: 7,
      description: "Set your own target dividend yield",
      characteristics: ["Custom yield target", "Flexible risk level", "Personalized strategy"],
    },
  };

  const timeframes = [
    { value: "1", label: "1 Year" },
    { value: "5", label: "5 Years" },
    { value: "10", label: "10 Years" },
    { value: "15", label: "15 Years" },
    { value: "20", label: "20 Years" },
    { value: "30", label: "30 Years" },
  ];

  const investmentFrequencies = [
    { value: "lump-sum", label: "Lump Sum", description: "Invest all money upfront" },
    { value: "monthly", label: "Monthly", description: "Invest equal amounts monthly" },
    { value: "yearly", label: "Yearly", description: "Invest equal amounts yearly" },
  ];

  const tabs = [
    { id: "calculator", label: "Income Calculator", icon: "calculate" },
    { id: "portfolio", label: "Portfolio Health", icon: "favorite" },
    { id: "scenarios", label: "Scenarios", icon: "show-chart" },
    { id: "education", label: "Learn", icon: "school" },
  ];

  useEffect(() => {
    fetchPortfolioData();
    loadCalculatorData();
  }, []);

  useEffect(() => {
    saveCalculatorData();
  }, [incomeTarget, timeframe, riskProfile, customYield, investmentFrequency, reinvestDividends]);

  // Auto-generate recommendations when data is loaded and we have an income target
  useEffect(() => {
    if (incomeTarget && parseFloat(incomeTarget) > 0 && !forecastData) {
      // Small delay to ensure all state is properly set
      const timer = setTimeout(() => {
        generateRecommendations();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [incomeTarget, timeframe, riskProfile, customYield, investmentFrequency, reinvestDividends]);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      const response = await portfolioAPI.getPortfolio();
      setPortfolioData(response.data);
    } catch (error) {
      console.error("Error fetching portfolio data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCalculatorData = async () => {
    try {
      setIsLoadingSavedData(true);
      const savedData = await AsyncStorage.getItem(CALCULATOR_DATA_KEY);
      if (savedData) {
        const data = JSON.parse(savedData);
        setIncomeTarget(data.incomeTarget || "");
        setTimeframe(data.timeframe || "10");
        setRiskProfile(data.riskProfile || "moderate");
        setCustomYield(data.customYield || "4.0");
        setInvestmentFrequency(data.investmentFrequency || "lump-sum");
        setReinvestDividends(data.reinvestDividends !== undefined ? data.reinvestDividends : true);

        // Show a brief message that saved data was loaded
        if (data.incomeTarget && parseFloat(data.incomeTarget) > 0) {
          showMessage({
            message: "Data Loaded",
            description: "Your saved calculator settings have been restored",
            type: "info",
            duration: 2000,
          });
        }
      }
    } catch (error) {
      console.error("Error loading calculator data:", error);
    } finally {
      setIsLoadingSavedData(false);
    }
  };

  const saveCalculatorData = async () => {
    try {
      const dataToSave = {
        incomeTarget,
        timeframe,
        riskProfile,
        customYield,
        investmentFrequency,
        reinvestDividends,
      };
      await AsyncStorage.setItem(CALCULATOR_DATA_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error("Error saving calculator data:", error);
    }
  };

  const clearSavedData = async () => {
    try {
      await AsyncStorage.removeItem(CALCULATOR_DATA_KEY);
      setIncomeTarget("");
      setTimeframe("10");
      setRiskProfile("moderate");
      setCustomYield("4.0");
      setInvestmentFrequency("lump-sum");
      setReinvestDividends(true);
      setForecastData(null);
      showMessage({
        message: "Success",
        description: "Saved calculator data cleared",
        type: "success",
      });
    } catch (error) {
      console.error("Error clearing calculator data:", error);
      showMessage({
        message: "Error",
        description: "Failed to clear saved data",
        type: "danger",
      });
    }
  };

  const calculateInvestmentNeeded = () => {
    if (!incomeTarget || parseFloat(incomeTarget) <= 0) {
      return 0;
    }

    const targetIncome = parseFloat(incomeTarget);
    const dividendYield = riskProfile === "custom" ? parseFloat(customYield) : riskProfiles[riskProfile].dividendYield;
    const years = parseInt(timeframe);

    if (reinvestDividends) {
      // With dividend reinvestment, we need less initial investment due to compound growth
      if (investmentFrequency === "lump-sum") {
        return calculateLumpSumWithReinvestment(targetIncome, dividendYield, years);
      } else {
        return calculatePeriodicInvestmentNeeded(targetIncome, dividendYield, years);
      }
    } else {
      // Without dividend reinvestment, we need more investment to reach the target
      if (investmentFrequency === "lump-sum") {
        return calculateLumpSumWithoutReinvestment(targetIncome, dividendYield);
      } else {
        return calculatePeriodicWithoutReinvestment(targetIncome, dividendYield, years);
      }
    }
  };

  const calculateLumpSumWithReinvestment = (targetIncome, dividendYield, years) => {
    // With reinvestment, we need less initial investment due to compound growth
    const scenarios = calculateForecastScenarios(10000, dividendYield, years);
    const scenarioData = scenarios[riskProfile] || scenarios.moderate;
    const finalDividendIncome = scenarioData[scenarioData.length - 1]?.dividendsReceived || 0;
    const requiredInvestment = (targetIncome / finalDividendIncome) * 10000;
    return Math.round(requiredInvestment);
  };

  const calculateLumpSumWithoutReinvestment = (targetIncome, dividendYield) => {
    // Without reinvestment, we need the full amount to generate the target income immediately
    const requiredInvestment = targetIncome / (dividendYield / 100);
    return Math.round(requiredInvestment);
  };

  const calculatePeriodicWithoutReinvestment = (targetIncome, dividendYield, years) => {
    // Without reinvestment, we need to build up to the target portfolio value
    const targetPortfolioValue = targetIncome / (dividendYield / 100);
    const totalContributions = years * (investmentFrequency === "monthly" ? 12 : 1);
    const periodicContribution = targetPortfolioValue / totalContributions;
    return Math.round(periodicContribution);
  };

  const calculatePeriodicInvestmentNeeded = (targetIncome, dividendYield, years) => {
    // Calculate compound growth with periodic contributions and dividend reinvestment
    const monthlyYield = dividendYield / 12 / 100; // Monthly dividend yield
    const totalMonths = years * 12;

    // Use the future value formula for periodic payments with compound interest
    // FV = PMT * ((1 + r)^n - 1) / r
    // Where: PMT = monthly payment, r = monthly rate, n = total months
    // Rearranged: PMT = FV * r / ((1 + r)^n - 1)

    const targetPortfolioValue = targetIncome / (dividendYield / 100);
    const monthlyRate = monthlyYield;

    if (monthlyRate === 0) {
      return Math.round(targetPortfolioValue / totalMonths);
    }

    const monthlyContribution = (targetPortfolioValue * monthlyRate) / (Math.pow(1 + monthlyRate, totalMonths) - 1);

    return Math.round(monthlyContribution);
  };

  const generateRecommendations = async () => {
    if (!incomeTarget || parseFloat(incomeTarget) <= 0) {
      Alert.alert("Error", "Please enter a valid income target");
      return;
    }

    if (riskProfile === "custom" && (!customYield || parseFloat(customYield) <= 0)) {
      Alert.alert("Error", "Please enter a valid dividend yield for custom profile");
      return;
    }

    setLoading(true);
    try {
      const requiredInvestment = calculateInvestmentNeeded();
      const profile = riskProfiles[riskProfile];
      const years = parseInt(timeframe);
      const dividendYield = riskProfile === "custom" ? parseFloat(customYield) : profile.dividendYield;

      // Calculate compound growth with periodic investments and dividend reinvestment
      const growthData = calculateCompoundGrowth(requiredInvestment, dividendYield, years);

      setForecastData({
        requiredInvestment,
        targetIncome: parseFloat(incomeTarget),
        dividendYield: dividendYield,
        initialIncome: growthData.initialIncome,
        finalIncome: growthData.finalIncome,
        totalInvested: growthData.totalInvested,
        portfolioValue: growthData.portfolioValue,
        growthWithReinvestment: reinvestDividends,
        investmentFrequency: investmentFrequency,
        timeframe: years,
      });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      showMessage({
        message: "Error",
        description: "Failed to generate recommendations",
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateCompoundGrowth = (investment, dividendYield, years) => {
    const monthlyYield = dividendYield / 12 / 100;
    const totalMonths = years * 12;

    let portfolioValue = 0;
    let totalInvested = 0;

    if (investmentFrequency === "lump-sum") {
      // Lump sum investment
      portfolioValue = investment;
      totalInvested = investment;

      // Calculate growth with monthly dividend reinvestment
      for (let month = 1; month <= totalMonths; month++) {
        const monthlyDividend = portfolioValue * monthlyYield;
        if (reinvestDividends) {
          portfolioValue += monthlyDividend;
        }
      }
    } else {
      // Periodic investments (monthly or yearly)
      const isMonthly = investmentFrequency === "monthly";
      const contributionFrequency = isMonthly ? 1 : 12;

      for (let month = 1; month <= totalMonths; month++) {
        // Add periodic contribution
        if (month % contributionFrequency === 0) {
          portfolioValue += investment;
          totalInvested += investment;
        }

        // Add dividend income
        const monthlyDividend = portfolioValue * monthlyYield;
        if (reinvestDividends) {
          portfolioValue += monthlyDividend;
        }
      }
    }

    const initialIncome = (investmentFrequency === "lump-sum" ? investment : investment * 12) * (dividendYield / 100);
    const finalIncome = portfolioValue * (dividendYield / 100);

    return {
      initialIncome,
      finalIncome,
      totalInvested,
      portfolioValue,
    };
  };

  const calculatePortfolioHealthScore = () => {
    if (!portfolioData || !portfolioData.portfolio || portfolioData.portfolio.length === 0) {
      return { score: 0, grade: "N/A", issues: ["No portfolio data available"] };
    }

    const portfolio = portfolioData.portfolio;
    let score = 100;
    const issues = [];

    // Check diversification (sector concentration)
    const sectorCount = new Set(portfolio.map((item) => item.sector)).size;
    if (sectorCount < 3) {
      score -= 20;
      issues.push("Low sector diversification");
    } else if (sectorCount < 5) {
      score -= 10;
      issues.push("Moderate sector diversification");
    }

    // Check average yield
    const avgYield = portfolioData.totals.averageYield || 0;
    if (avgYield < 2) {
      score -= 15;
      issues.push("Low average dividend yield");
    } else if (avgYield > 8) {
      score -= 10;
      issues.push("Very high yield - potential risk");
    }

    // Check portfolio size
    const totalValue = portfolioData.totals.currentValue || 0;
    if (totalValue < 10000) {
      score -= 10;
      issues.push("Small portfolio size");
    }

    // Check for any stocks with very high yields (potential risk)
    const highRiskStocks = portfolio.filter((item) => (item.dividendYield || 0) > 10);
    if (highRiskStocks.length > 0) {
      score -= 15;
      issues.push(`${highRiskStocks.length} high-risk dividend stocks`);
    }

    // Determine grade
    let grade;
    if (score >= 90) grade = "A";
    else if (score >= 80) grade = "B";
    else if (score >= 70) grade = "C";
    else if (score >= 60) grade = "D";
    else grade = "F";

    return { score: Math.max(0, score), grade, issues };
  };

  const calculateInflationImpact = (targetIncome, years) => {
    const inflationRate = 2.5; // Average historical inflation
    const inflatedIncome = targetIncome * Math.pow(1 + inflationRate / 100, years);
    const purchasingPowerLoss = ((inflatedIncome - targetIncome) / targetIncome) * 100;

    return {
      inflatedIncome: Math.round(inflatedIncome),
      purchasingPowerLoss: Math.round(purchasingPowerLoss),
      requiredGrowthRate: inflationRate + 1, // Need to beat inflation by 1%
    };
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPortfolioData();
    if (incomeTarget && parseFloat(incomeTarget) > 0) {
      await generateRecommendations();
    }
    setRefreshing(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "calculator":
        return renderIncomeCalculator();
      case "portfolio":
        return renderPortfolioHealth();
      case "scenarios":
        return renderPortfolioComparison();
      case "education":
        return renderEducationalContent();
      default:
        return renderIncomeCalculator();
    }
  };

  const renderIncomeCalculator = () => (
    <>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialIcons name="calculate" size={24} color={colors.primary} style={styles.headerIcon} />
            <Title style={{ color: colors.text }}>Dividend Income Calculator</Title>
            {isLoadingSavedData && (
              <View style={styles.loadingIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Loading saved data...</Text>
              </View>
            )}
          </View>

          <Text style={{ color: colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
            Calculate how much you need to invest to reach your target annual dividend income. Enter your desired income and choose your investment strategy.
          </Text>

          {/* Step 1: Income Target */}
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Set Your Income Target</Text>
            </View>
            <Text style={styles.stepDescription}>How much annual dividend income do you want?</Text>
            <TextInput
              label="Annual Dividend Income Target ($)"
              value={incomeTarget}
              onChangeText={setIncomeTarget}
              keyboardType="numeric"
              style={styles.input}
              mode="outlined"
              placeholder="e.g., 50000"
              theme={{
                colors: {
                  primary: colors.primary,
                  background: colors.surface,
                  surface: colors.surface,
                  text: colors.text,
                  placeholder: colors.textSecondary,
                  onSurface: colors.text,
                  onSurfaceVariant: colors.textSecondary,
                },
              }}
            />
          </View>

          {/* Step 2: Timeframe */}
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Choose Timeframe</Text>
            </View>
            <Text style={styles.stepDescription}>How many years do you want to reach your target?</Text>
            <View style={styles.timeframeChips}>
              {timeframes.map((tf) => (
                <TouchableOpacity key={tf.value} onPress={() => setTimeframe(tf.value)} style={[styles.timeframeChip, timeframe === tf.value && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.timeframeChipText, timeframe === tf.value && { color: "white" }]}>{tf.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Step 3: Investment Strategy */}
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepTitle}>Choose Investment Strategy</Text>
            </View>
            <Text style={styles.stepDescription}>Select your risk profile or set a custom dividend yield:</Text>

            <View style={styles.riskChips}>
              {Object.entries(riskProfiles).map(([key, profile]) => (
                <TouchableOpacity key={key} onPress={() => setRiskProfile(key)} style={[styles.riskChip, riskProfile === key && { backgroundColor: profile.color }]}>
                  <Text style={[styles.riskChipText, riskProfile === key && { color: "white" }]}>{profile.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Yield Input */}
            {riskProfile === "custom" && (
              <View style={styles.customYieldContainer}>
                <Text style={styles.customYieldLabel}>Set Your Target Dividend Yield:</Text>
                <TextInput
                  label="Dividend Yield (%)"
                  value={customYield}
                  onChangeText={setCustomYield}
                  keyboardType="numeric"
                  style={styles.input}
                  mode="outlined"
                  placeholder="e.g., 4.5"
                  theme={{
                    colors: {
                      primary: colors.primary,
                      background: colors.surface,
                      surface: colors.surface,
                      text: colors.text,
                      placeholder: colors.textSecondary,
                      onSurface: colors.text,
                      onSurfaceVariant: colors.textSecondary,
                    },
                  }}
                />
                <Text style={styles.customYieldHelp}>Enter the average dividend yield you expect from your investments</Text>
              </View>
            )}

            <View style={styles.strategyInfo}>
              <Text style={styles.strategyLabel}>Selected Strategy: {riskProfiles[riskProfile].label}</Text>
              <Text style={styles.strategyDescription}>{riskProfiles[riskProfile].description}</Text>
              <Text style={styles.strategyYield}>Target Yield: {formatPercentage(riskProfile === "custom" ? parseFloat(customYield) : riskProfiles[riskProfile].dividendYield)}</Text>
            </View>
          </View>

          {/* Step 4: Investment Method */}
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepTitle}>How Will You Invest?</Text>
            </View>
            <Text style={styles.stepDescription}>Choose how you want to invest your money:</Text>

            <View style={styles.frequencyChips}>
              {investmentFrequencies.map((freq) => (
                <TouchableOpacity
                  key={freq.value}
                  onPress={() => setInvestmentFrequency(freq.value)}
                  style={[styles.frequencyChip, investmentFrequency === freq.value && { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.frequencyChipText, investmentFrequency === freq.value && { color: "white" }]}>{freq.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.frequencyInfo}>
              <Text style={styles.frequencyDescription}>{investmentFrequencies.find((f) => f.value === investmentFrequency)?.description}</Text>
            </View>
          </View>

          {/* Step 5: Dividend Reinvestment */}
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>5</Text>
              </View>
              <Text style={styles.stepTitle}>Dividend Reinvestment</Text>
            </View>
            <Text style={styles.stepDescription}>What should happen to your dividend payments?</Text>

            <View style={styles.reinvestmentContainer}>
              <TouchableOpacity style={[styles.reinvestmentOption, reinvestDividends && { backgroundColor: colors.primary }]} onPress={() => setReinvestDividends(true)}>
                <MaterialIcons name="replay" size={20} color={reinvestDividends ? "white" : colors.text} />
                <Text style={[styles.reinvestmentText, reinvestDividends && { color: "white" }]}>Reinvest Dividends</Text>
                <Text style={[styles.reinvestmentDescription, reinvestDividends && { color: "white" }]}>Use dividend payments to buy more shares (faster growth)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.reinvestmentOption, !reinvestDividends && { backgroundColor: colors.primary }]} onPress={() => setReinvestDividends(false)}>
                <MaterialIcons name="account-balance-wallet" size={20} color={!reinvestDividends ? "white" : colors.text} />
                <Text style={[styles.reinvestmentText, !reinvestDividends && { color: "white" }]}>Take as Income</Text>
                <Text style={[styles.reinvestmentDescription, !reinvestDividends && { color: "white" }]}>Receive dividend payments as cash (slower growth)</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={generateRecommendations}
            loading={loading}
            disabled={loading || !incomeTarget || parseFloat(incomeTarget) <= 0 || (riskProfile === "custom" && (!customYield || parseFloat(customYield) <= 0))}
            style={styles.calculateButton}
          >
            Calculate Investment Required
          </Button>

          <Button mode="outlined" onPress={clearSavedData} style={styles.clearButton} textColor={colors.error}>
            Clear Saved Data
          </Button>
        </Card.Content>
      </Card>

      {forecastData && (
        <Card style={styles.resultCard}>
          <Card.Content>
            <View style={styles.resultHeader}>
              <MaterialIcons name="check-circle" size={24} color={colors.success} />
              <Text style={styles.resultTitle}>Investment Plan Summary</Text>
            </View>

            {/* Main Result */}
            <View style={styles.mainResultContainer}>
              <Text style={styles.mainResultLabel}>
                {investmentFrequency === "lump-sum" ? "You Need to Invest:" : `You Need to Invest ${investmentFrequency === "monthly" ? "Monthly:" : "Yearly:"}`}
              </Text>
              <Text style={styles.mainResultAmount}>{formatCurrency(forecastData.requiredInvestment)}</Text>
              <Text style={styles.mainResultSubtext}>
                To reach {formatCurrency(forecastData.targetIncome)} annually in {timeframe} years
              </Text>
              <Text style={styles.mainResultSubtext}>At {formatPercentage(forecastData.dividendYield)} dividend yield</Text>
              <Text style={styles.mainResultSubtext}>Strategy: {reinvestDividends ? "Reinvest Dividends" : "Take as Income"}</Text>
              {investmentFrequency !== "lump-sum" && <Text style={styles.mainResultSubtext}>Total invested: {formatCurrency(forecastData.totalInvested)}</Text>}

              {/* Strategy Comparison */}
              <View style={styles.strategyComparison}>
                <Text style={styles.strategyComparisonTitle}>Investment Comparison:</Text>
                <Text style={styles.strategyComparisonText}>
                  {reinvestDividends
                    ? "With dividend reinvestment, you need less initial investment due to compound growth"
                    : "Without dividend reinvestment, you need more investment to reach your target"}
                </Text>
              </View>
            </View>

            {/* Investment Details */}
            <View style={styles.detailsContainer}>
              <Text style={styles.detailsTitle}>Investment Details:</Text>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Target Income</Text>
                  <Text style={styles.detailValue}>{formatCurrency(forecastData.targetIncome)}/year</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Timeframe</Text>
                  <Text style={styles.detailValue}>{timeframe} years</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Dividend Yield</Text>
                  <Text style={styles.detailValue}>{formatPercentage(forecastData.dividendYield)}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Strategy</Text>
                  <Text style={styles.detailValue}>{riskProfiles[riskProfile].label}</Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Investment Method</Text>
                  <Text style={styles.detailValue}>{investmentFrequency === "lump-sum" ? "Lump Sum" : investmentFrequency === "monthly" ? "Monthly Contributions" : "Yearly Contributions"}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Dividend Strategy</Text>
                  <Text style={styles.detailValue}>{reinvestDividends ? "Reinvest" : "Take as Income"}</Text>
                </View>
              </View>
            </View>

            {/* Projections */}
            <View style={styles.projectionsContainer}>
              <Text style={styles.projectionsTitle}>Compound Growth Results:</Text>

              <View style={styles.projectionRow}>
                <View style={styles.projectionItem}>
                  <Text style={styles.projectionLabel}>Portfolio Value (Year {timeframe})</Text>
                  <Text style={styles.projectionValue}>{formatCurrency(forecastData.portfolioValue)}</Text>
                </View>
                <View style={styles.projectionItem}>
                  <Text style={styles.projectionLabel}>Annual Income (Year {timeframe})</Text>
                  <Text style={styles.projectionValue}>{formatCurrency(forecastData.finalIncome)}</Text>
                </View>
              </View>

              <View style={styles.projectionRow}>
                <View style={styles.projectionItem}>
                  <Text style={styles.projectionLabel}>Total Invested</Text>
                  <Text style={styles.projectionValue}>{formatCurrency(forecastData.totalInvested)}</Text>
                </View>
                <View style={styles.projectionItem}>
                  <Text style={styles.projectionLabel}>Growth from Reinvestment</Text>
                  <Text style={[styles.projectionValue, { color: colors.success }]}>
                    +{formatPercentage(((forecastData.finalIncome - forecastData.initialIncome) / forecastData.initialIncome) * 100)}
                  </Text>
                </View>
              </View>

              <View style={styles.projectionRow}>
                <View style={styles.projectionItem}>
                  <Text style={styles.projectionLabel}>Initial Monthly Income</Text>
                  <Text style={styles.projectionValue}>{formatCurrency(forecastData.initialIncome / 12)}</Text>
                </View>
                <View style={styles.projectionItem}>
                  <Text style={styles.projectionLabel}>Monthly Income (Year {timeframe})</Text>
                  <Text style={styles.projectionValue}>{formatCurrency(forecastData.finalIncome / 12)}</Text>
                </View>
              </View>

              <View style={styles.projectionRow}>
                <View style={styles.projectionItem}>
                  <Text style={styles.projectionLabel}>Monthly Growth</Text>
                  <Text style={[styles.projectionValue, { color: colors.success }]}>+{formatCurrency((forecastData.finalIncome - forecastData.initialIncome) / 12)}/month</Text>
                </View>
                <View style={styles.projectionItem}>
                  <Text style={styles.projectionLabel}>Growth Percentage</Text>
                  <Text style={[styles.projectionValue, { color: colors.success }]}>
                    +{formatPercentage(((forecastData.finalIncome - forecastData.initialIncome) / forecastData.initialIncome) * 100)}
                  </Text>
                </View>
              </View>

              {!reinvestDividends && (
                <View style={styles.noReinvestmentNote}>
                  <Text style={styles.noReinvestmentText}>Note: Without dividend reinvestment, your income stays at {formatCurrency(forecastData.initialIncome)}/year</Text>
                </View>
              )}
            </View>

            {/* Quick Math */}
            <View style={styles.quickMathContainer}>
              <Text style={styles.quickMathTitle}>Simple Math:</Text>
              <Text style={styles.quickMathText}>
                {formatCurrency(forecastData.requiredInvestment)} × {formatPercentage(forecastData.dividendYield)} = {formatCurrency(forecastData.targetIncome)} annually
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}
    </>
  );

  const renderPortfolioHealth = () => {
    const healthScore = calculatePortfolioHealthScore();

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialIcons name="favorite" size={24} color={colors.primary} style={styles.headerIcon} />
            <Title style={{ color: colors.text }}>Portfolio Health Score</Title>
          </View>

          {portfolioData ? (
            <>
              <View style={styles.healthScoreContainer}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreNumber}>{healthScore.score}</Text>
                  <Text style={styles.scoreLabel}>Score</Text>
                </View>
                <View style={styles.gradeContainer}>
                  <Text style={styles.grade}>{healthScore.grade}</Text>
                  <Text style={styles.gradeLabel}>Grade</Text>
                </View>
              </View>

              <View style={styles.portfolioStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Value</Text>
                  <Text style={styles.statValue}>{formatCurrency(portfolioData.totals?.currentValue || 0)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Investment</Text>
                  <Text style={styles.statValue}>{formatCurrency(portfolioData.totals?.totalInvestment || 0)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Annual Income</Text>
                  <Text style={styles.statValue}>{formatCurrency(portfolioData.totals?.totalDividendIncome || 0)}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Avg. Yield</Text>
                  <Text style={styles.statValue}>{formatPercentage(portfolioData.totals?.averageYield || 0)}</Text>
                </View>
              </View>

              {healthScore.issues.length > 0 && (
                <View style={styles.issuesContainer}>
                  <Text style={styles.issuesTitle}>Areas for Improvement:</Text>
                  {healthScore.issues.map((issue, index) => (
                    <View key={index} style={styles.issueItem}>
                      <MaterialIcons name="warning" size={16} color={colors.warning} />
                      <Text style={styles.issueText}>{issue}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.recommendationsContainer}>
                <Text style={styles.recommendationsTitle}>Recommendations:</Text>
                <View style={styles.recommendationItem}>
                  <MaterialIcons name="lightbulb" size={16} color={colors.primary} />
                  <Text style={styles.recommendationText}>Consider diversifying across more sectors for better risk management</Text>
                </View>
                <View style={styles.recommendationItem}>
                  <MaterialIcons name="lightbulb" size={16} color={colors.primary} />
                  <Text style={styles.recommendationText}>Aim for a balanced yield between 3-6% for optimal risk/reward</Text>
                </View>
                <View style={styles.recommendationItem}>
                  <MaterialIcons name="lightbulb" size={16} color={colors.primary} />
                  <Text style={styles.recommendationText}>Regularly review and rebalance your portfolio</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="portfolio" size={48} color={colors.textSecondary} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No portfolio data available</Text>
              <Text style={styles.emptySubtext}>Add stocks to your portfolio to see health insights</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderPortfolioComparison = () => {
    if (!portfolioData || !portfolioData.portfolio || portfolioData.portfolio.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <MaterialIcons name="compare" size={24} color={colors.primary} style={styles.headerIcon} />
              <Title style={{ color: colors.text }}>Portfolio Comparison</Title>
            </View>

            <Text style={{ color: colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
              Compare your current portfolio with your income goals. Add stocks to your portfolio to see detailed comparisons.
            </Text>

            <View style={styles.emptyState}>
              <MaterialIcons name="portfolio" size={48} color={colors.textSecondary} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No portfolio data available</Text>
              <Text style={styles.emptySubtext}>Add stocks to your portfolio to see comparisons</Text>
            </View>
          </Card.Content>
        </Card>
      );
    }

    if (!incomeTarget || parseFloat(incomeTarget) <= 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <MaterialIcons name="compare" size={24} color={colors.primary} style={styles.headerIcon} />
              <Title style={{ color: colors.text }}>Portfolio Comparison</Title>
            </View>

            <Text style={{ color: colors.textSecondary, marginBottom: 16, lineHeight: 20 }}>
              Compare your current portfolio with your income goals. Enter an income target to see detailed comparisons.
            </Text>

            <View style={styles.portfolioSummary}>
              <Text style={styles.portfolioSummaryTitle}>Your Current Portfolio:</Text>

              <View style={styles.portfolioSummaryStats}>
                <View style={styles.portfolioSummaryStat}>
                  <Text style={styles.portfolioSummaryStatLabel}>Total Value</Text>
                  <Text style={styles.portfolioSummaryStatValue}>{formatCurrency(portfolioData.totals?.currentValue || 0)}</Text>
                </View>
                <View style={styles.portfolioSummaryStat}>
                  <Text style={styles.portfolioSummaryStatLabel}>Annual Income</Text>
                  <Text style={styles.portfolioSummaryStatValue}>{formatCurrency(portfolioData.totals?.totalDividendIncome || 0)}</Text>
                </View>
                <View style={styles.portfolioSummaryStat}>
                  <Text style={styles.portfolioSummaryStatLabel}>Avg. Yield</Text>
                  <Text style={styles.portfolioSummaryStatValue}>{formatPercentage(portfolioData.totals?.averageYield || 0)}</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      );
    }

    // Calculate target portfolio requirements
    const targetIncome = parseFloat(incomeTarget);
    const dividendYield = riskProfile === "custom" ? parseFloat(customYield) : riskProfiles[riskProfile].dividendYield;
    const requiredInvestment = calculateInvestmentNeeded();
    const currentPortfolioValue = portfolioData.totals?.currentValue || 0;
    const currentAnnualIncome = portfolioData.totals?.totalDividendIncome || 0;
    const gap = requiredInvestment - currentPortfolioValue;
    const incomeGap = targetIncome - currentAnnualIncome;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialIcons name="compare" size={24} color={colors.primary} style={styles.headerIcon} />
            <Title style={{ color: colors.text }}>Portfolio Comparison</Title>
          </View>

          <View style={styles.comparisonContainer}>
            <Text style={styles.comparisonTitle}>Current vs Target Portfolio:</Text>

            <View style={styles.comparisonRow}>
              <View style={styles.comparisonCard}>
                <Text style={styles.comparisonCardTitle}>Current Portfolio</Text>
                <Text style={styles.comparisonCardValue}>{formatCurrency(currentPortfolioValue)}</Text>
                <Text style={styles.comparisonCardIncome}>{formatCurrency(currentAnnualIncome)}/year</Text>
              </View>

              <View style={styles.comparisonArrow}>
                <MaterialIcons name="arrow-forward" size={24} color={colors.primary} />
              </View>

              <View style={styles.comparisonCard}>
                <Text style={styles.comparisonCardTitle}>Target Portfolio</Text>
                <Text style={styles.comparisonCardValue}>{formatCurrency(requiredInvestment)}</Text>
                <Text style={styles.comparisonCardIncome}>{formatCurrency(targetIncome)}/year</Text>
              </View>
            </View>

            <View style={styles.gapAnalysis}>
              <Text style={styles.gapAnalysisTitle}>Gap Analysis:</Text>

              <View style={styles.gapItem}>
                <Text style={styles.gapLabel}>Investment Gap</Text>
                <Text style={[styles.gapValue, { color: gap > 0 ? colors.error : colors.success }]}>{gap > 0 ? `+${formatCurrency(gap)} needed` : `${formatCurrency(Math.abs(gap))} surplus`}</Text>
              </View>

              <View style={styles.gapItem}>
                <Text style={styles.gapLabel}>Income Gap</Text>
                <Text style={[styles.gapValue, { color: incomeGap > 0 ? colors.error : colors.success }]}>
                  {incomeGap > 0 ? `+${formatCurrency(incomeGap)}/year needed` : `${formatCurrency(Math.abs(incomeGap))}/year surplus`}
                </Text>
              </View>

              <View style={styles.gapItem}>
                <Text style={styles.gapLabel}>Progress</Text>
                <Text style={styles.gapValue}>{formatPercentage((currentPortfolioValue / requiredInvestment) * 100)} complete</Text>
              </View>
            </View>

            <View style={styles.recommendationsContainer}>
              <Text style={styles.recommendationsTitle}>Next Steps:</Text>

              {gap > 0 ? (
                <>
                  <View style={styles.recommendationItem}>
                    <MaterialIcons name="trending-up" size={16} color={colors.primary} />
                    <Text style={styles.recommendationText}>Invest {formatCurrency(gap)} more to reach your target</Text>
                  </View>
                  <View style={styles.recommendationItem}>
                    <MaterialIcons name="schedule" size={16} color={colors.primary} />
                    <Text style={styles.recommendationText}>
                      At {formatCurrency(gap / 12)}/month, you'll reach your target in {Math.ceil(gap / (gap / 12))} months
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.recommendationItem}>
                  <MaterialIcons name="check-circle" size={16} color={colors.success} />
                  <Text style={styles.recommendationText}>Congratulations! You've exceeded your target by {formatCurrency(Math.abs(gap))}</Text>
                </View>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEducationalContent = () => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialIcons name="school" size={24} color={colors.primary} style={styles.headerIcon} />
          <Title style={{ color: colors.text }}>Dividend Investing Guide</Title>
        </View>

        <View style={styles.educationSection}>
          <Text style={styles.educationTitle}>What is Dividend Investing?</Text>
          <Text style={styles.educationText}>
            Dividend investing focuses on stocks that pay regular dividends to shareholders. These payments provide a steady income stream and can be reinvested for compound growth.
          </Text>
        </View>

        <View style={styles.educationSection}>
          <Text style={styles.educationTitle}>Key Metrics to Understand:</Text>
          <View style={styles.metricItem}>
            <Text style={styles.metricName}>Dividend Yield</Text>
            <Text style={styles.metricDescription}>Annual dividend payment as a percentage of stock price</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricName}>Payout Ratio</Text>
            <Text style={styles.metricDescription}>Percentage of earnings paid as dividends</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricName}>Dividend Growth Rate</Text>
            <Text style={styles.metricDescription}>Annual percentage increase in dividend payments</Text>
          </View>
        </View>

        <View style={styles.educationSection}>
          <Text style={styles.educationTitle}>Risk Profiles Explained:</Text>
          {Object.entries(riskProfiles).map(([key, profile]) => (
            <View key={key} style={styles.riskProfileCard}>
              <View style={styles.riskProfileHeader}>
                <View style={[styles.riskProfileBadge, { backgroundColor: profile.color }]}>
                  <Text style={styles.riskProfileBadgeText}>{profile.label}</Text>
                </View>
                <Text style={styles.riskProfileYield}>{formatPercentage(profile.dividendYield)} Target Yield</Text>
              </View>
              <Text style={styles.riskProfileDescription}>{profile.description}</Text>
              <View style={styles.characteristicsList}>
                {profile.characteristics.map((char, index) => (
                  <View key={index} style={styles.characteristicItem}>
                    <MaterialIcons name="check" size={16} color={colors.success} />
                    <Text style={styles.characteristicText}>{char}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.educationSection}>
          <Text style={styles.educationTitle}>Investment Strategies:</Text>
          <View style={styles.strategyItem}>
            <Text style={styles.strategyName}>Dividend Aristocrats</Text>
            <Text style={styles.strategyDescription}>Companies that have increased dividends for 25+ consecutive years</Text>
          </View>
          <View style={styles.strategyItem}>
            <Text style={styles.strategyName}>High-Yield Strategy</Text>
            <Text style={styles.strategyDescription}>Focus on stocks with above-average dividend yields</Text>
          </View>
          <View style={styles.strategyItem}>
            <Text style={styles.strategyName}>Dividend Growth Strategy</Text>
            <Text style={styles.strategyDescription}>Invest in companies with strong dividend growth potential</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    tabContainer: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
      padding: 4,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 8,
      minHeight: 60,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 4,
    },
    activeTabText: {
      color: "white",
    },
    card: {
      margin: 16,
      backgroundColor: colors.surface,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    headerIcon: {
      marginRight: 12,
    },
    loadingIndicator: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: "auto",
    },
    loadingText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    input: {
      marginBottom: 16,
      backgroundColor: colors.background,
    },
    timeframeContainer: {
      marginBottom: 16,
    },
    timeframeLabel: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    timeframeChips: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    timeframeChip: {
      backgroundColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
    },
    timeframeChipText: {
      fontSize: 12,
      color: colors.text,
    },
    riskContainer: {
      marginBottom: 16,
    },
    riskLabel: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    riskChips: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    riskChip: {
      backgroundColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
    },
    riskChipText: {
      fontSize: 12,
      color: colors.text,
    },
    calculateButton: {
      marginTop: 8,
    },
    clearButton: {
      marginTop: 8,
    },
    resultCard: {
      margin: 16,
      backgroundColor: colors.surface,
    },
    resultHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    resultTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    investmentAmount: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.primary,
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
    healthScoreContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      marginBottom: 24,
    },
    scoreCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    scoreNumber: {
      fontSize: 24,
      fontWeight: "bold",
      color: "white",
    },
    scoreLabel: {
      fontSize: 10,
      color: "white",
    },
    gradeContainer: {
      alignItems: "center",
    },
    grade: {
      fontSize: 48,
      fontWeight: "bold",
      color: colors.primary,
    },
    gradeLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    portfolioStats: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 16,
    },
    statItem: {
      width: "50%",
      paddingVertical: 8,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
    },
    issuesContainer: {
      marginBottom: 16,
    },
    issuesTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    issueItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    issueText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 8,
    },
    recommendationsContainer: {
      marginTop: 16,
    },
    recommendationsTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    recommendationItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 8,
    },
    recommendationText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 8,
      flex: 1,
    },
    inflationContainer: {
      marginBottom: 16,
    },
    inflationTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 12,
    },
    inflationStats: {
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
    },
    inflationItem: {
      marginBottom: 8,
    },
    inflationLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    inflationValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
    scenariosTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 12,
    },
    scenarioCard: {
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    scenarioHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    scenarioBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    scenarioBadgeText: {
      fontSize: 12,
      fontWeight: "bold",
      color: "white",
    },
    scenarioInvestment: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.primary,
    },
    scenarioStats: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    scenarioStat: {
      alignItems: "center",
      flex: 1,
    },
    scenarioStatLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    scenarioStatValue: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.text,
    },
    educationSection: {
      marginBottom: 24,
    },
    educationTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 12,
    },
    educationText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    metricItem: {
      marginBottom: 12,
    },
    metricName: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    metricDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    riskProfileCard: {
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    riskProfileHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    riskProfileBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    riskProfileBadgeText: {
      fontSize: 12,
      fontWeight: "bold",
      color: "white",
    },
    riskProfileYield: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
    riskProfileDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    characteristicsList: {
      marginTop: 8,
    },
    characteristicItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    characteristicText: {
      fontSize: 12,
      color: colors.text,
      marginLeft: 8,
    },
    strategyItem: {
      marginBottom: 12,
    },
    strategyName: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    strategyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 16,
      color: colors.textSecondary,
    },
    emptyState: {
      alignItems: "center",
      padding: 32,
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
    },
    // New styles for enhanced calculator
    stepContainer: {
      marginBottom: 24,
    },
    stepHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    stepNumber: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    stepNumberText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    stepTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
    },
    stepDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
      lineHeight: 20,
    },
    customYieldContainer: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
    },
    customYieldLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    customYieldHelp: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
      fontStyle: "italic",
    },
    strategyInfo: {
      marginTop: 12,
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
    },
    strategyLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    strategyDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    strategyYield: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.primary,
    },
    mainResultContainer: {
      alignItems: "center",
      marginBottom: 24,
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
    },
    mainResultLabel: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    mainResultAmount: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.primary,
      marginBottom: 4,
    },
    mainResultSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
    detailsContainer: {
      marginBottom: 20,
    },
    detailsTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 12,
    },
    detailRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    detailItem: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    detailLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
    projectionsContainer: {
      marginBottom: 20,
    },
    projectionsTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 12,
    },
    projectionRow: {
      flexDirection: "row",
      marginBottom: 8,
    },
    projectionItem: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    projectionLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    projectionValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
    quickMathContainer: {
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    quickMathTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    quickMathText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: "monospace",
    },
    // New styles for investment frequency and reinvestment
    frequencyChips: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginBottom: 12,
    },
    frequencyChip: {
      backgroundColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
    },
    frequencyChipText: {
      fontSize: 12,
      color: colors.text,
    },
    frequencyInfo: {
      marginTop: 8,
    },
    frequencyDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    reinvestmentContainer: {
      marginTop: 12,
    },
    reinvestmentOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reinvestmentText: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginLeft: 12,
      flex: 1,
    },
    reinvestmentDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 12,
      flex: 1,
    },
    incomeTimeline: {
      marginTop: 16,
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.success,
    },
    incomeTimelineTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    incomeTimelineText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    noReinvestmentNote: {
      marginTop: 12,
      padding: 8,
      backgroundColor: colors.warning + "20",
      borderRadius: 6,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
    },
    noReinvestmentText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    strategyComparison: {
      marginTop: 16,
      padding: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    strategyComparisonTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    strategyComparisonText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    // New styles for scenario overview
    scenarioOverview: {
      marginBottom: 24,
    },
    scenarioOverviewTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
    },
    scenarioOverviewCard: {
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    scenarioOverviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    scenarioOverviewBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    scenarioOverviewBadgeText: {
      fontSize: 12,
      fontWeight: "bold",
      color: "white",
    },
    scenarioOverviewYield: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
    scenarioOverviewDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
      lineHeight: 20,
    },
    scenarioOverviewStats: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    scenarioOverviewStat: {
      alignItems: "center",
      flex: 1,
    },
    scenarioOverviewStatLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    scenarioOverviewStatValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
    scenarioExample: {
      marginTop: 16,
    },
    scenarioExampleTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    scenarioExampleText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    scenarioExampleCard: {
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    scenarioExampleHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    scenarioExampleLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
    scenarioExampleValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.primary,
    },
    scenarioExampleIncome: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    // New styles for portfolio comparison
    portfolioSummary: {
      marginBottom: 24,
    },
    portfolioSummaryTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
    },
    portfolioSummaryStats: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    portfolioSummaryStat: {
      alignItems: "center",
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    portfolioSummaryStatLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    portfolioSummaryStatValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
    },
    comparisonContainer: {
      marginBottom: 24,
    },
    comparisonTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
    },
    comparisonRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    comparisonCard: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    comparisonCardTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
    },
    comparisonCardValue: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.primary,
      marginBottom: 4,
    },
    comparisonCardIncome: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    comparisonArrow: {
      marginHorizontal: 16,
    },
    gapAnalysis: {
      marginBottom: 20,
    },
    gapAnalysisTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 12,
    },
    gapItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginBottom: 8,
    },
    gapLabel: {
      fontSize: 14,
      color: colors.text,
    },
    gapValue: {
      fontSize: 14,
      fontWeight: "bold",
    },
  });

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity key={tab.id} style={[styles.tab, activeTab === tab.id && styles.activeTab]} onPress={() => setActiveTab(tab.id)}>
            <MaterialIcons name={tab.icon} size={20} color={activeTab === tab.id ? "white" : colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {renderTabContent()}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading insights...</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default InsightsScreen;

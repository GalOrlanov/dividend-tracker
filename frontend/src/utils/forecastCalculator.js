// Utility functions for dividend reinvestment forecasting

/**
 * Calculate compound growth with dividend reinvestment
 * @param {number} initialInvestment - Initial portfolio value
 * @param {number} annualDividendYield - Annual dividend yield as percentage (e.g., 3.5 for 3.5%)
 * @param {number} years - Number of years to forecast
 * @param {number} dividendGrowthRate - Annual dividend growth rate as percentage (e.g., 5 for 5%)
 * @param {number} marketGrowthRate - Annual market growth rate as percentage (e.g., 7 for 7%)
 * @returns {Array} Array of yearly values
 */
export const calculateDividendReinvestmentForecast = (initialInvestment = 10000, annualDividendYield = 3.5, years = 10, dividendGrowthRate = 5, marketGrowthRate = 7) => {
  // Validate inputs
  if (!initialInvestment || initialInvestment <= 0) initialInvestment = 10000;
  if (!annualDividendYield || annualDividendYield < 0) annualDividendYield = 3.5;
  if (!years || years <= 0) years = 10;
  if (!dividendGrowthRate || dividendGrowthRate < 0) dividendGrowthRate = 5;
  if (!marketGrowthRate || marketGrowthRate < 0) marketGrowthRate = 7;

  const forecast = [];
  let currentValue = initialInvestment;
  let totalDividendsReceived = 0;
  let currentDividendYield = annualDividendYield;

  for (let year = 0; year <= years; year++) {
    if (year === 0) {
      // Initial state
      forecast.push({
        year,
        portfolioValue: currentValue,
        dividendsReceived: 0,
        totalDividendsReceived: 0,
        reinvestedAmount: 0,
      });
      continue;
    }

    // Calculate dividend income for this year
    const dividendIncome = currentValue * (currentDividendYield / 100);
    totalDividendsReceived += dividendIncome;

    // Reinvest dividends (buy more shares)
    const reinvestedAmount = dividendIncome;
    currentValue += reinvestedAmount;

    // Apply market growth to the entire portfolio
    currentValue *= 1 + marketGrowthRate / 100;

    // Apply dividend growth rate to future dividends
    currentDividendYield *= 1 + dividendGrowthRate / 100;

    forecast.push({
      year,
      portfolioValue: currentValue,
      dividendsReceived: dividendIncome,
      totalDividendsReceived,
      reinvestedAmount,
    });
  }

  return forecast;
};

/**
 * Calculate forecast with different scenarios
 * @param {number} initialInvestment - Initial portfolio value
 * @param {number} annualDividendYield - Annual dividend yield as percentage
 * @param {number} years - Number of years to forecast
 * @returns {Object} Object with different forecast scenarios
 */
export const calculateForecastScenarios = (initialInvestment, annualDividendYield, years = 10) => {
  const scenarios = {
    conservative: calculateDividendReinvestmentForecast(
      initialInvestment,
      annualDividendYield,
      years,
      3, // 3% dividend growth
      5 // 5% market growth
    ),
    moderate: calculateDividendReinvestmentForecast(
      initialInvestment,
      annualDividendYield,
      years,
      5, // 5% dividend growth
      7 // 7% market growth
    ),
    aggressive: calculateDividendReinvestmentForecast(
      initialInvestment,
      annualDividendYield,
      years,
      7, // 7% dividend growth
      9 // 9% market growth
    ),
  };

  return scenarios;
};

/**
 * Get chart data for forecast visualization
 * @param {Array} forecastData - Forecast data array
 * @returns {Object} Chart data object
 */
export const getForecastChartData = (forecastData) => {
  if (!forecastData || forecastData.length === 0) {
    return {
      labels: ["Y0"],
      datasets: [
        {
          data: [0],
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 3,
        },
        {
          data: [0],
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }

  const labels = forecastData.map((item) => `Y${item.year || 0}`);
  const portfolioValues = forecastData.map((item) => Math.round(item.portfolioValue || 0));
  const dividendIncome = forecastData.map((item) => Math.round(item.dividendsReceived || 0));

  return {
    labels,
    datasets: [
      {
        data: portfolioValues,
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, // Green for portfolio growth
        strokeWidth: 3,
      },
      {
        data: dividendIncome,
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // Blue for dividend income
        strokeWidth: 2,
      },
    ],
  };
};

/**
 * Calculate summary statistics for forecast
 * @param {Array} forecastData - Forecast data array
 * @returns {Object} Summary statistics
 */
export const getForecastSummary = (forecastData) => {
  if (!forecastData || forecastData.length === 0) {
    return {
      initialValue: 0,
      finalValue: 0,
      totalGrowth: 0,
      growthPercentage: 0,
      totalDividends: 0,
      years: 0,
      initialDividendIncome: 0,
      finalDividendIncome: 0,
      dividendGrowthPercentage: 0,
    };
  }

  const initialValue = forecastData[0]?.portfolioValue || 0;
  const finalValue = forecastData[forecastData.length - 1]?.portfolioValue || 0;
  const totalGrowth = finalValue - initialValue;
  const growthPercentage = initialValue > 0 ? ((finalValue - initialValue) / initialValue) * 100 : 0;
  const totalDividends = forecastData[forecastData.length - 1]?.totalDividendsReceived || 0;

  // Calculate dividend income values
  const initialDividendIncome = forecastData[1]?.dividendsReceived || 0; // First year dividend income
  const finalDividendIncome = forecastData[forecastData.length - 1]?.dividendsReceived || 0; // Last year dividend income
  const dividendGrowthPercentage = initialDividendIncome > 0 ? ((finalDividendIncome - initialDividendIncome) / initialDividendIncome) * 100 : 0;

  return {
    initialValue,
    finalValue,
    totalGrowth,
    growthPercentage,
    totalDividends,
    years: forecastData.length - 1,
    initialDividendIncome,
    finalDividendIncome,
    dividendGrowthPercentage,
  };
};

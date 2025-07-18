import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import FlashMessage from "react-native-flash-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Linking } from "react-native";
import authService from "./src/services/auth";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";

// Screens
import DashboardScreen from "./src/screens/DashboardScreen";
import DividendsScreen from "./src/screens/DividendsScreen";
import SearchScreen from "./src/screens/SearchScreen";
import AddDividendScreen from "./src/screens/AddDividendScreen";
import DividendDetailScreen from "./src/screens/DividendDetailScreen";
import InsightsScreen from "./src/screens/InsightsScreen";
import PortfolioScreen from "./src/screens/PortfolioScreen";
import AddStockScreen from "./src/screens/AddStockScreen";
import StockDetailScreen from "./src/screens/StockDetailScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import LoadingScreen from "./src/components/LoadingScreen";
import ForecastScreen from "./src/screens/ForecastScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

const Tab = createBottomTabNavigator();
const DashboardStack = createStackNavigator();
const DividendsStack = createStackNavigator();
const SearchStack = createStackNavigator();
const PortfolioStack = createStackNavigator();
const SettingsStack = createStackNavigator();
const AuthStack = createStackNavigator();

// Authentication Stack
function AuthStackScreen({ onLogin }) {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} initialParams={{ onLogin }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} initialParams={{ onLogin }} />
    </AuthStack.Navigator>
  );
}

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isDark, colors } = useTheme();

  // Stack Navigator Functions (moved inside AppContent to access theme context)
  function DashboardStackScreen({ onLogout }) {
    return (
      <DashboardStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <DashboardStack.Screen name="DashboardMain" component={DashboardScreen} initialParams={{ onLogout }} options={{ title: "Overview" }} />
        <DashboardStack.Screen name="Forecast" component={ForecastScreen} options={{ title: "Dividend Forecast" }} />
      </DashboardStack.Navigator>
    );
  }

  function DividendsStackScreen() {
    return (
      <DividendsStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <DividendsStack.Screen name="DividendsList" component={DividendsScreen} options={{ title: "My Dividends" }} />
        <DividendsStack.Screen name="AddDividend" component={AddDividendScreen} options={{ title: "Add Dividend" }} />
        <DividendsStack.Screen name="DividendDetail" component={DividendDetailScreen} options={{ title: "Dividend Details" }} />
      </DividendsStack.Navigator>
    );
  }

  function SearchStackScreen() {
    return (
      <SearchStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <SearchStack.Screen name="SearchStocks" component={SearchScreen} options={{ title: "Search Stocks" }} />
        <SearchStack.Screen name="AddStock" component={AddStockScreen} options={{ title: "Add to Portfolio" }} />
        <SearchStack.Screen name="StockDetail" component={StockDetailScreen} options={{ title: "Stock Details" }} />
      </SearchStack.Navigator>
    );
  }

  function PortfolioStackScreen() {
    return (
      <PortfolioStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <PortfolioStack.Screen name="PortfolioMain" component={PortfolioScreen} options={{ title: "Portfolio" }} />
        <PortfolioStack.Screen name="StockDetail" component={StockDetailScreen} options={{ title: "Stock Details" }} />
      </PortfolioStack.Navigator>
    );
  }

  function SettingsStackScreen({ onLogout }) {
    return (
      <SettingsStack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <SettingsStack.Screen name="SettingsMain" component={SettingsScreen} initialParams={{ onLogout }} options={{ title: "Settings" }} />
        <SettingsStack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
      </SettingsStack.Navigator>
    );
  }

  // Tab Navigator
  function TabNavigator({ onLogout }) {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === "Dashboard") {
              iconName = focused ? "view-dashboard" : "view-dashboard-outline";
            } else if (route.name === "Portfolio") {
              iconName = focused ? "wallet" : "wallet-outline";
            } else if (route.name === "Dividends") {
              iconName = focused ? "cash-multiple" : "cash-multiple";
            } else if (route.name === "Search") {
              iconName = focused ? "magnify" : "magnify";
            } else if (route.name === "Insights") {
              iconName = focused ? "lightbulb" : "lightbulb-outline";
            } else if (route.name === "Settings") {
              iconName = focused ? "cog" : "cog-outline";
            }

            return <Icon name={iconName} size={size} color={color} style={{ marginTop: -5 }} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: 5,
            paddingTop: 5,
            height: 90,
          },
          tabBarLabelStyle: {
            marginTop: 0,
            paddingBottom: 12,
          },
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardStackScreen} initialParams={{ onLogout }} options={{ headerShown: false, title: "Overview" }} />
        <Tab.Screen name="Portfolio" component={PortfolioStackScreen} options={{ headerShown: false, title: "Portfolio" }} />
        <Tab.Screen name="Search" component={SearchStackScreen} options={{ headerShown: false, title: "Search" }} />
        <Tab.Screen name="Insights" component={InsightsScreen} options={{ title: "Insights" }} />
        <Tab.Screen name="Settings" component={SettingsStackScreen} initialParams={{ onLogout }} options={{ headerShown: false, title: "Settings" }} />
      </Tab.Navigator>
    );
  }

  const checkAuth = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeepLink = async (url) => {
    console.log("Deep link received:", url);

    // Parse the URL to extract token and user data
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get("token");
    const userData = urlObj.searchParams.get("user");

    if (token && userData) {
      try {
        // Store the token
        await authService.setToken(token);

        // Set authentication state
        setIsAuthenticated(true);

        console.log("Successfully authenticated via deep link");
      } catch (error) {
        console.error("Deep link authentication error:", error);
      }
    }
  };

  useEffect(() => {
    // Check if user is authenticated on app start
    checkAuth();

    // Handle deep links when app is already running
    const subscription = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    // Handle deep links when app is opened from a link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <NavigationContainer>
        <StatusBar style={isDark ? "light" : "dark"} />
        <LoadingScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />
      {isAuthenticated ? <TabNavigator onLogout={handleLogout} /> : <AuthStackScreen onLogin={handleLogin} />}
      <FlashMessage position="top" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <PaperProvider>
        <AppContent />
      </PaperProvider>
    </ThemeProvider>
  );
}

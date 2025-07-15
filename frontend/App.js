import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Provider as PaperProvider, DefaultTheme } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import FlashMessage from "react-native-flash-message";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import authService from "./src/services/auth";

// Screens
import DashboardScreen from "./src/screens/DashboardScreen";
import DividendsScreen from "./src/screens/DividendsScreen";
import SearchScreen from "./src/screens/SearchScreen";
import AddDividendScreen from "./src/screens/AddDividendScreen";
import DividendDetailScreen from "./src/screens/DividendDetailScreen";
import CalendarScreen from "./src/screens/CalendarScreen";
import PortfolioScreen from "./src/screens/PortfolioScreen";
import AddStockScreen from "./src/screens/AddStockScreen";
import StockDetailScreen from "./src/screens/StockDetailScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import LoadingScreen from "./src/components/LoadingScreen";
import ForecastScreen from "./src/screens/ForecastScreen";

const Tab = createBottomTabNavigator();
const DashboardStack = createStackNavigator();
const DividendsStack = createStackNavigator();
const SearchStack = createStackNavigator();
const PortfolioStack = createStackNavigator();
const AuthStack = createStackNavigator();

// Custom theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#2196F3",
    accent: "#4CAF50",
    background: "#F5F5F5",
    surface: "#FFFFFF",
    text: "#212121",
    placeholder: "#757575",
  },
};

function DashboardStackScreen({ onLogout }) {
  return (
    <DashboardStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
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
          backgroundColor: theme.colors.primary,
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
          backgroundColor: theme.colors.primary,
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
          backgroundColor: theme.colors.primary,
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
          } else if (route.name === "Calendar") {
            iconName = focused ? "calendar" : "calendar-outline";
          }

          return <Icon name={iconName} size={size} color={color} style={{ marginTop: -6 }} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.placeholder,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: "#E0E0E0",
          paddingBottom: 5,
          paddingTop: 5,
          height: 80,
        },
        tabBarLabelStyle: {
          marginTop: -8,
          paddingBottom: 12,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
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
      <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: "Calendar" }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    // Check if user is authenticated on app start
    checkAuth();
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
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <StatusBar style="light" />
          <LoadingScreen />
        </NavigationContainer>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <StatusBar style="light" />
        {isAuthenticated ? <TabNavigator onLogout={handleLogout} /> : <AuthStackScreen onLogin={handleLogin} />}
        <FlashMessage position="top" />
      </NavigationContainer>
    </PaperProvider>
  );
}

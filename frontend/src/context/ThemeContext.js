import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import { lightColors, darkColors } from "../config/theme";

// Define ThemeType locally to avoid import issues
const ThemeType = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

// Create theme objects with fallback
const lightTheme = {
  colors: lightColors,
  dark: false,
};

const darkTheme = {
  colors: darkColors,
  dark: true,
};

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeType, setThemeType] = useState(ThemeType.SYSTEM);
  const [isDark, setIsDark] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Update theme when system color scheme changes
  useEffect(() => {
    if (themeType === ThemeType.SYSTEM) {
      setIsDark(systemColorScheme === "dark");
    }
  }, [themeType, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("theme_preference");
      if (savedTheme) {
        setThemeType(savedTheme);
        if (savedTheme === ThemeType.DARK) {
          setIsDark(true);
        } else if (savedTheme === ThemeType.LIGHT) {
          setIsDark(false);
        } else {
          // SYSTEM
          setIsDark(systemColorScheme === "dark");
        }
      } else {
        // Default to system
        setIsDark(systemColorScheme === "dark");
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
      // Fallback to system
      setIsDark(systemColorScheme === "dark");
    }
  };

  const setTheme = async (newThemeType) => {
    try {
      await AsyncStorage.setItem("theme_preference", newThemeType);
      setThemeType(newThemeType);

      if (newThemeType === ThemeType.DARK) {
        setIsDark(true);
      } else if (newThemeType === ThemeType.LIGHT) {
        setIsDark(false);
      } else {
        // SYSTEM
        setIsDark(systemColorScheme === "dark");
      }
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const toggleTheme = () => {
    const newThemeType = isDark ? ThemeType.LIGHT : ThemeType.DARK;
    setTheme(newThemeType);
  };

  const theme = isDark ? darkTheme : lightTheme;
  const colors = theme.colors;

  const value = {
    theme,
    colors,
    isDark,
    themeType,
    setTheme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

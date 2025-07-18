// Light Theme Colors
export const lightColors = {
  // Primary colors
  primary: "#2196F3",
  primaryDark: "#1976D2",
  primaryLight: "#BBDEFB",

  // Accent colors
  accent: "#4CAF50",
  accentDark: "#388E3C",
  accentLight: "#C8E6C9",

  // Background colors
  background: "#F5F5F5",
  surface: "#FFFFFF",
  card: "#FFFFFF",

  // Text colors
  text: "#212121",
  textSecondary: "#757575",
  textDisabled: "#BDBDBD",

  // Status colors
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",

  // Border and divider colors
  border: "#E0E0E0",
  divider: "#E0E0E0",

  // Chart colors
  chartPrimary: "#4CAF50",
  chartSecondary: "#2196F3",
  chartTertiary: "#FF9800",
  chartQuaternary: "#9C27B0",
  chartQuinary: "#FF5722",

  // Special colors
  overlay: "rgba(0, 0, 0, 0.5)",
  shadow: "rgba(0, 0, 0, 0.1)",

  // Calendar colors
  calendarBackground: "#FFFFFF",
  calendarText: "#2D4150",
  calendarSelected: "#2196F3",
  calendarToday: "#2196F3",
  calendarDisabled: "#D9E1E8",

  // Tab bar colors
  tabBar: "#FFFFFF",
  tabBarBorder: "#E0E0E0",
  tabBarActive: "#2196F3",
  tabBarInactive: "#757575",
};

// Dark Theme Colors
export const darkColors = {
  // Primary colors
  primary: "#90CAF9",
  primaryDark: "#64B5F6",
  primaryLight: "#E3F2FD",

  // Accent colors
  accent: "#81C784",
  accentDark: "#66BB6A",
  accentLight: "#C8E6C9",

  // Background colors
  background: "#121212",
  surface: "#1E1E1E",
  card: "#2D2D2D",

  // Text colors
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  textDisabled: "#666666",

  // Status colors
  success: "#81C784",
  warning: "#FFB74D",
  error: "#E57373",
  info: "#90CAF9",

  // Border and divider colors
  border: "#404040",
  divider: "#404040",

  // Chart colors
  chartPrimary: "#81C784",
  chartSecondary: "#90CAF9",
  chartTertiary: "#FFB74D",
  chartQuaternary: "#BA68C8",
  chartQuinary: "#FF8A65",

  // Special colors
  overlay: "rgba(0, 0, 0, 0.7)",
  shadow: "rgba(0, 0, 0, 0.3)",

  // Calendar colors
  calendarBackground: "#2D2D2D",
  calendarText: "#FFFFFF",
  calendarSelected: "#90CAF9",
  calendarToday: "#90CAF9",
  calendarDisabled: "#666666",

  // Tab bar colors
  tabBar: "#1E1E1E",
  tabBarBorder: "#404040",
  tabBarActive: "#90CAF9",
  tabBarInactive: "#B0B0B0",
};

// Create theme objects
export const lightTheme = {
  colors: lightColors,
  dark: false,
};

export const darkTheme = {
  colors: darkColors,
  dark: true,
};

// Theme context types
export const ThemeType = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

// Helper function to get theme colors
export const getThemeColors = (isDark = false) => {
  return isDark ? darkColors : lightColors;
};

// Helper function to get theme object
export const getTheme = (isDark = false) => {
  return isDark ? darkTheme : lightTheme;
};

// Common styles that can be used across components
export const commonStyles = {
  container: (colors) => ({
    flex: 1,
    backgroundColor: colors.background,
  }),

  card: (colors) => ({
    backgroundColor: colors.surface,
    borderRadius: 8,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  }),

  text: (colors) => ({
    color: colors.text,
  }),

  textSecondary: (colors) => ({
    color: colors.textSecondary,
  }),

  divider: (colors) => ({
    backgroundColor: colors.divider,
    height: 1,
  }),

  input: (colors) => ({
    backgroundColor: colors.surface,
    borderColor: colors.border,
  }),

  button: (colors) => ({
    backgroundColor: colors.primary,
  }),

  buttonOutlined: (colors) => ({
    borderColor: colors.primary,
  }),
};

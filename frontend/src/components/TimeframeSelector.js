import React, { useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { useTheme } from "../context/ThemeContext";

const TimeframeSelector = ({ selectedTimeframe, onTimeframeChange, timeframes = ["7d", "1m", "3m", "6m", "1y", "5y"], disabled = false }) => {
  const [pressedButton, setPressedButton] = useState(null);
  const theme = useTheme();
  const colors = theme?.colors || {
    primary: "#2196F3",
    surface: "#FFFFFF",
    text: "#212121",
    textSecondary: "#757575",
    border: "#E0E0E0",
  };

  const getTimeframeLabel = (timeframe) => {
    switch (timeframe) {
      case "7d":
        return "7D";
      case "1m":
        return "1M";
      case "3m":
        return "3M";
      case "6m":
        return "6M";
      case "1y":
        return "1Y";
      case "5y":
        return "5Y";
      default:
        return timeframe;
    }
  };

  const handleTimeframePress = (timeframe) => {
    console.log("🕒 TimeframeSelector: Button pressed", { timeframe, disabled, hasCallback: !!onTimeframeChange });

    if (!disabled && onTimeframeChange) {
      console.log("🕒 TimeframeSelector: Calling onTimeframeChange with", timeframe);
      onTimeframeChange(timeframe);
    } else {
      console.log("🕒 TimeframeSelector: Button press ignored", { disabled, hasCallback: !!onTimeframeChange });
    }
  };

  const handlePressIn = (timeframe) => {
    setPressedButton(timeframe);
  };

  const handlePressOut = () => {
    setPressedButton(null);
  };

  console.log("🕒 TimeframeSelector: Rendering", { selectedTimeframe, timeframes, disabled });

  return (
    <View style={styles.container}>
      {timeframes.map((timeframe) => {
        const isSelected = selectedTimeframe === timeframe;
        const isPressed = pressedButton === timeframe;

        return (
          <TouchableOpacity
            key={timeframe}
            style={[
              styles.button,
              {
                borderColor: colors.border,
                backgroundColor: isSelected ? colors.primary : colors.surface,
                opacity: disabled ? 0.6 : isPressed ? 0.8 : 1,
                transform: [{ scale: isPressed ? 0.95 : 1 }],
              },
            ]}
            onPress={() => handleTimeframePress(timeframe)}
            onPressIn={() => handlePressIn(timeframe)}
            onPressOut={handlePressOut}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: isSelected ? colors.surface : colors.textSecondary,
                  fontWeight: isSelected ? "600" : "500",
                },
              ]}
            >
              {getTimeframeLabel(timeframe)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = {
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "500",
  },
};

export default TimeframeSelector;

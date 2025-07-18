import React, { useMemo } from "react";
import { View, Dimensions, TouchableOpacity } from "react-native";
import Svg, { Path, Text as SvgText, Circle, G } from "react-native-svg";
import * as d3 from "d3";

const { width } = Dimensions.get("window");

const D3PieChart = ({
  data = [],
  width: chartWidth = 200,
  height = 200,
  radius = 80,
  innerRadius = 0, // 0 for pie chart, > 0 for donut chart
  colors = {
    primary: "#2196F3",
    text: "#212121",
    textSecondary: "#757575",
    surface: "#FFFFFF",
  },
  onPress,
  showLabels = false,
  showCenterText = false,
  centerText = "",
  centerSubtext = "",
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((item, index) => ({
      value: parseFloat(item.value) || 0,
      label: item.label || item.text || `Item ${index}`,
      color: item.color || colors.primary,
      originalData: item,
    }));
  }, [data, colors.primary]);

  if (chartData.length === 0) {
    return (
      <View style={{ width: chartWidth, height, justifyContent: "center", alignItems: "center" }}>
        <SvgText fontSize={14} fill={colors.textSecondary}>
          No data available
        </SvgText>
      </View>
    );
  }

  // Calculate center
  const centerX = chartWidth / 2;
  const centerY = height / 2;

  // Create pie generator
  const pie = d3
    .pie()
    .value((d) => d.value)
    .sort(null);

  // Create arc generator
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(radius);

  // Generate pie data
  const pieData = pie(chartData);

  // Calculate total for percentages
  const total = d3.sum(chartData, (d) => d.value);

  return (
    <Svg width={chartWidth} height={height}>
      {/* Pie slices */}
      {pieData.map((slice, i) => {
        const [centroidX, centroidY] = arc.centroid(slice);
        const percentage = ((slice.value / total) * 100).toFixed(1);

        return (
          <TouchableOpacity
            key={`slice-${i}`}
            onPress={() => onPress && onPress(chartData[i], i)}
            style={{
              position: "absolute",
              left: centerX + centroidX - 10,
              top: centerY + centroidY - 10,
              width: 20,
              height: 20,
            }}
          >
            <Path d={arc(slice)} fill={slice.data.color} stroke={colors.surface} strokeWidth={2} />
          </TouchableOpacity>
        );
      })}

      {/* Labels */}
      {showLabels &&
        pieData.map((slice, i) => {
          const [centroidX, centroidY] = arc.centroid(slice);
          const percentage = ((slice.value / total) * 100).toFixed(1);

          return (
            <G key={`label-${i}`}>
              <SvgText x={centerX + centroidX} y={centerY + centroidY} fontSize={12} fill={colors.text} textAnchor="middle" dominantBaseline="middle">
                {percentage}%
              </SvgText>
            </G>
          );
        })}

      {/* Center text for donut chart */}
      {showCenterText && innerRadius > 0 && (
        <G>
          <SvgText x={centerX} y={centerY - 8} fontSize={16} fontWeight="bold" fill={colors.text} textAnchor="middle" dominantBaseline="middle">
            {centerText}
          </SvgText>
          <SvgText x={centerX} y={centerY + 8} fontSize={12} fill={colors.textSecondary} textAnchor="middle" dominantBaseline="middle">
            {centerSubtext}
          </SvgText>
        </G>
      )}
    </Svg>
  );
};

export default D3PieChart;

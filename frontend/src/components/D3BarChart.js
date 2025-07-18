import React, { useMemo } from "react";
import { View, Dimensions, TouchableOpacity } from "react-native";
import Svg, { Rect, Text as SvgText, Line, G } from "react-native-svg";
import * as d3 from "d3";

const { width } = Dimensions.get("window");

const D3BarChart = ({
  data = [],
  width: chartWidth = width - 32,
  height = 200,
  colors = {
    primary: "#2196F3",
    text: "#212121",
    textSecondary: "#757575",
    border: "#E0E0E0",
    surface: "#FFFFFF",
  },
  onPress,
  showGrid = true,
  showLabels = true,
  barBorderRadius = 4,
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((item, index) => ({
      x: index,
      y: parseFloat(item.value) || 0,
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

  // D3 scales
  const xScale = d3
    .scaleBand()
    .domain(chartData.map((d) => d.x))
    .range([60, chartWidth - 40])
    .padding(0.2);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(chartData, (d) => d.y) * 1.1])
    .range([height - 60, 40]);

  // Grid lines
  const yTicks = yScale.ticks(5);

  return (
    <Svg width={chartWidth} height={height}>
      {/* Grid lines */}
      {showGrid && (
        <G>
          {yTicks.map((tick, i) => (
            <Line key={`y-grid-${i}`} x1={60} y1={yScale(tick)} x2={chartWidth - 40} y2={yScale(tick)} stroke={colors.border} strokeWidth={0.5} opacity={0.3} />
          ))}
        </G>
      )}

      {/* Y-axis labels */}
      {showLabels && (
        <G>
          {yTicks.map((tick, i) => (
            <SvgText key={`y-label-${i}`} x={55} y={yScale(tick) + 4} fontSize={10} fill={colors.textSecondary} textAnchor="end">
              ${tick.toFixed(0)}
            </SvgText>
          ))}
        </G>
      )}

      {/* Bars */}
      {chartData.map((item, i) => {
        const barWidth = xScale.bandwidth();
        const barHeight = height - 60 - yScale(item.y);
        const barX = xScale(item.x);
        const barY = yScale(item.y);

        return (
          <TouchableOpacity
            key={`bar-${i}`}
            onPress={() => onPress && onPress(item.originalData, i)}
            style={{
              position: "absolute",
              left: barX,
              top: barY,
              width: barWidth,
              height: barHeight,
            }}
          >
            <Rect x={barX} y={barY} width={barWidth} height={barHeight} fill={item.color} rx={barBorderRadius} ry={barBorderRadius} />
          </TouchableOpacity>
        );
      })}

      {/* X-axis labels */}
      {showLabels && (
        <G>
          {chartData.map((item, i) => (
            <SvgText key={`x-label-${i}`} x={xScale(item.x) + xScale.bandwidth() / 2} y={height - 35} fontSize={10} fill={colors.textSecondary} textAnchor="middle">
              {item.label}
            </SvgText>
          ))}
        </G>
      )}
    </Svg>
  );
};

export default D3BarChart;

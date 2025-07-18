import React from "react";
import { Text } from "react-native";
import Animated, { useAnimatedProps } from "react-native-reanimated";

const AnimatedTextComponent = Animated.createAnimatedComponent(Text);

// Add text to the whitelist for animated props
Animated.addWhitelistedNativeProps({ text: true });

export const AnimatedText = ({ text, style, children, fallback = "Loading...", ...props }) => {
  const animatedProps = useAnimatedProps(() => {
    try {
      const textValue = text?.value?.toString() || children?.toString() || fallback;
      return {
        text: textValue,
      };
    } catch (error) {
      console.log("AnimatedText error:", error);
      return {
        text: fallback,
      };
    }
  });

  return <AnimatedTextComponent animatedProps={animatedProps} style={style} {...props} />;
};

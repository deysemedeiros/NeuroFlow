import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface AppButtonProps {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "gradient";
  size?: "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  iconLeft?: React.ReactNode;
}

export function AppButton({
  label,
  onPress,
  variant = "primary",
  size = "lg",
  loading,
  disabled,
  style,
  iconLeft,
}: AppButtonProps) {
  const colors = useColors();
  const heights = { md: 50, lg: 60 };
  const height = heights[size];

  const isGradient = variant === "gradient";

  const variantStyle = (() => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: colors.secondary,
          color: colors.secondaryForeground,
          border: "transparent",
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          color: colors.primary,
          border: colors.border,
        };
      case "gradient":
        return {
          backgroundColor: "transparent",
          color: "#FFFFFF",
          border: "transparent",
        };
      default:
        return {
          backgroundColor: colors.primary,
          color: colors.primaryForeground,
          border: "transparent",
        };
    }
  })();

  const inner = (
    <>
      {loading ? (
        <ActivityIndicator color={variantStyle.color} />
      ) : (
        <View style={styles.row}>
          {iconLeft}
          <Text style={[styles.label, { color: variantStyle.color }]}>
            {label}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      style={({ pressed }) => [
        styles.wrapper,
        {
          height,
          opacity: disabled ? 0.55 : pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        variant !== "ghost" && styles.shadow,
        variant !== "ghost" &&
          Platform.OS === "web" &&
          ({
            boxShadow:
              "0 2px 6px rgba(124,106,174,0.10), 0 12px 28px rgba(124,106,174,0.14)",
          } as unknown as ViewStyle),
        style,
      ]}
    >
      {isGradient ? (
        <LinearGradient
          colors={[colors.softPurple, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, { height }]}
        >
          {inner}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.button,
            {
              height,
              backgroundColor: variantStyle.backgroundColor,
              borderColor: variantStyle.border,
              borderWidth: variant === "ghost" ? 1.5 : 0,
            },
          ]}
        >
          {inner}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 999,
    overflow: "hidden",
  },
  button: {
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  shadow: {
    shadowColor: "#7C6AAE",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
});

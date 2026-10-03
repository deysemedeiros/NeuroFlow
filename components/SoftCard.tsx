import React from "react";
import { Platform, StyleSheet, View, ViewProps, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";

interface SoftCardProps extends ViewProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  background?: string;
  padding?: number;
  elevated?: boolean;
}

export function SoftCard({
  children,
  style,
  background,
  padding = 22,
  elevated = true,
  ...rest
}: SoftCardProps) {
  const colors = useColors();
  return (
    <View
      {...rest}
      style={[
        styles.card,
        elevated && styles.shadow,
        Platform.OS === "web" && elevated && webShadow,
        {
          backgroundColor: background ?? colors.card,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const webShadow = {
  boxShadow:
    "0 1px 2px rgba(124,106,174,0.04), 0 8px 24px rgba(124,106,174,0.07)",
} as unknown as ViewStyle;

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
  },
  shadow: {
    shadowColor: "#7C6AAE",
    shadowOpacity: 0.06,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
});

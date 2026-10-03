import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export function WaveBackground() {
  const colors = useColors();

  const blobs: {
    colors: [string, string];
    size: number;
    top?: number | string;
    bottom?: number;
    left?: number;
    right?: number;
    opacity: number;
  }[] = [
    {
      colors: [colors.lilac + "00", colors.lilac + "FF"],
      size: 420,
      top: -200,
      right: -160,
      opacity: 0.45,
    },
    {
      colors: [colors.aqua + "00", colors.aqua + "FF"],
      size: 360,
      top: 160,
      left: -180,
      opacity: 0.35,
    },
    {
      colors: [colors.mint + "00", colors.mint + "FF"],
      size: 480,
      bottom: -240,
      right: -140,
      opacity: 0.3,
    },
  ];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {blobs.map((b, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: b.top as number,
            bottom: b.bottom,
            left: b.left,
            right: b.right,
            opacity: b.opacity,
          }}
        >
          <LinearGradient
            colors={b.colors}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{
              width: b.size,
              height: b.size,
              borderRadius: b.size,
            }}
          />
        </View>
      ))}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.background, opacity: 0.55 },
        ]}
      />
    </View>
  );
}

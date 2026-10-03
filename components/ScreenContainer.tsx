import React from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { WaveBackground } from "./WaveBackground";

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  bottomPadding?: number;
  paddingTop?: number;
}

export function ScreenContainer({
  children,
  scroll = true,
  contentStyle,
  bottomPadding = 120,
  paddingTop,
}: ScreenContainerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = paddingTop ?? insets.top + 12;

  const inner = (
    <View
      style={[
        {
          paddingTop: topPad,
          paddingBottom: bottomPadding + insets.bottom,
          paddingHorizontal: 22,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <WaveBackground />
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={styles.flex}>{inner}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
});

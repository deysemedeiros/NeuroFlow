import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/AppButton";
import { WaveBackground } from "@/components/WaveBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function SplashScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { auth, loading } = useAuth();
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoLift = useRef(new Animated.Value(12)).current;
  const titleFade = useRef(new Animated.Value(0)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const fade = titleFade;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoFade, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoLift, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleFade, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(buttonFade, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [logoFade, logoLift, titleFade, buttonFade, float]);

  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <WaveBackground />

      <Animated.View
        style={[
          styles.center,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 32,
          },
        ]}
      >
        <View style={styles.logoArea}>
          <Animated.View
            style={{
              opacity: logoFade,
              transform: [
                { translateY: Animated.add(translateY, logoLift) },
              ],
              alignItems: "center",
            }}
          >
            <View
              style={[styles.logoGlow, { backgroundColor: colors.lilac }]}
            />
            <Image
              source={require("@/assets/images/neuroflow-logo.png")}
              resizeMode="contain"
              style={{
                width: Math.min(width * 0.62, 280),
                height: Math.min(width * 0.62, 280),
              }}
            />
          </Animated.View>

          <Animated.View style={{ opacity: titleFade, alignItems: "center" }}>
            <View style={styles.titleRow}>
              <Text style={[styles.titleNeuro, { color: colors.foreground }]}>
                Neuro
              </Text>
              <Text style={[styles.titleFlow, { color: colors.primary }]}>
                Flow
              </Text>
            </View>

            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Seu fluxo mental,{"\n"}no seu ritmo.
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.buttonArea, { opacity: buttonFade }]}>
          <AppButton
            label={auth ? "Continuar" : "Começar"}
            disabled={loading}
            onPress={() => router.replace(auth ? "/(tabs)/inicio" : "/login")}
            variant="gradient"
          />
          <Text style={[styles.footer, { color: colors.mutedForeground }]}>
            Bem-vindo(a) ao seu espaço de calma
          </Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  logoGlow: {
    position: "absolute",
    width: "85%",
    height: "85%",
    top: "8%",
    borderRadius: 999,
    opacity: 0.35,
    transform: [{ scale: 1.05 }],
  },
  titleRow: {
    flexDirection: "row",
    marginTop: 32,
    justifyContent: "center",
  },
  titleNeuro: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  titleFlow: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
    marginTop: 4,
  },
  buttonArea: {
    width: "100%",
    alignItems: "center",
    gap: 16,
  },
  footer: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});

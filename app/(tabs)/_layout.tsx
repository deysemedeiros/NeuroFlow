import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { BookOpen, Heart, Home, Target, User } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export default function TabLayout() {
  const colors = useColors();
  const isWeb = Platform.OS === "web";
  const isIOS = Platform.OS === "ios";

  return (
    <Tabs
      initialRouteName="inicio"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          marginBottom: isWeb ? 6 : 0,
        },
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: isWeb ? 16 : 20,
          marginHorizontal: 16,
          borderRadius: 28,
          height: isWeb ? 70 : 72,
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.border,
          paddingTop: 10,
          paddingBottom: isWeb ? 12 : 16,
          shadowColor: "#7C6AAE",
          shadowOpacity: 0.12,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
          overflow: "hidden",
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.card, borderRadius: 28 },
              ]}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => <Home size={20} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="diario"
        options={{
          title: "Diário",
          tabBarIcon: ({ color }) => <BookOpen size={20} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="metas"
        options={{
          title: "Metas",
          tabBarIcon: ({ color }) => <Target size={20} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="profissionais"
        options={{
          title: "Profissionais",
          tabBarIcon: ({ color }) => <Heart size={20} color={color} strokeWidth={1.8} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <User size={20} color={color} strokeWidth={1.8} />,
        }}
      />
    </Tabs>
  );
}

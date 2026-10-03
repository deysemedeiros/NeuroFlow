import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/AppButton";
import { WaveBackground } from "@/components/WaveBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";

const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === "true";

// Contas criadas pelo seed em supabase/banco.sql
const DEMO_ACCOUNTS = [
  { label: "Paciente", email: "lucas@neuroflow.app" },
  { label: "Responsável", email: "ana@neuroflow.app" },
  { label: "Clínico", email: "rafael@neuroflow.app" },
];
const DEMO_PASSWORD = "Senha@123";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleForgot = async () => {
    const trimmedEmail = email.trim();
    setInfo(null);
    if (!trimmedEmail) {
      setError("Digite seu e-mail acima para receber o link de redefinição.");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
    if (resetError) {
      setError(resetError.message);
    } else {
      setError(null);
      setInfo("Se este e-mail estiver cadastrado, você receberá um link para redefinir a senha.");
    }
  };

  const handleLogin = () => doLogin(email.trim(), senha);

  const doLogin = async (trimmedEmail: string, password: string) => {
    if (!trimmedEmail || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await login(trimmedEmail, password);
      router.replace("/(tabs)/inicio");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao fazer login";
      if (msg === "conta_pendente") {
        setError("⏳ Seu cadastro ainda está sendo revisado. Aguarde a aprovação do administrador.");
      } else if (msg === "conta_rejeitada") {
        setError("✕ Seu acesso foi negado. Entre em contato com o administrador.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <WaveBackground />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoArea}>
          <Image
            source={require("@/assets/images/neuroflow-logo.png")}
            resizeMode="contain"
            style={styles.logo}
          />
          <View style={styles.titleRow}>
            <Text style={[styles.titleNeuro, { color: colors.foreground }]}>Neuro</Text>
            <Text style={[styles.titleFlow, { color: colors.primary }]}>Flow</Text>
          </View>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Seu fluxo mental, no seu ritmo.
          </Text>
        </View>

        <View style={styles.formArea}>
          <Text style={[styles.welcome, { color: colors.foreground }]}>
            Bem-vindo de volta
          </Text>

          <View style={styles.fields}>
            <View
              style={[
                styles.inputWrapper,
                { backgroundColor: colors.card, borderColor: error && !email ? "#E57373" : colors.border },
                Platform.OS === "web" && webInputShadow,
              ]}
            >
              <TextInput
                placeholder="E-mail"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(null); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, { color: colors.foreground }]}
              />
            </View>

            <View
              style={[
                styles.inputWrapper,
                styles.inputRow,
                { backgroundColor: colors.card, borderColor: error && !senha ? "#E57373" : colors.border },
                Platform.OS === "web" && webInputShadow,
              ]}
            >
              <TextInput
                placeholder="Senha"
                placeholderTextColor={colors.mutedForeground}
                value={senha}
                onChangeText={(v) => { setSenha(v); setError(null); }}
                secureTextEntry={!senhaVisivel}
                style={[styles.input, styles.inputFlex, { color: colors.foreground }]}
              />
              <Pressable onPress={() => setSenhaVisivel(!senhaVisivel)} hitSlop={8}>
                {senhaVisivel ? (
                  <EyeOff size={18} color={colors.mutedForeground} strokeWidth={1.8} />
                ) : (
                  <Eye size={18} color={colors.mutedForeground} strokeWidth={1.8} />
                )}
              </Pressable>
            </View>

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: "#FFF0F0", borderColor: "#FFCCCC" }]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {info ? (
              <View style={[styles.errorBox, { backgroundColor: colors.mint, borderColor: "#BFE0D0" }]}>
                <Text style={[styles.errorText, { color: "#234A3D" }]}>{info}</Text>
              </View>
            ) : null}

            <Pressable style={styles.forgotRow} onPress={handleForgot}>
              <Text style={[styles.forgotText, { color: colors.primary }]}>
                Esqueceu a senha?
              </Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [
              styles.enterBtn,
              { opacity: pressed || loading ? 0.85 : 1 },
            ]}
          >
            <LinearGradient
              colors={["#9ED0C9", "#C5B4E3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.enterGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.enterLabel}>Entrar</Text>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Ainda não tem conta?{" "}
            </Text>
            <Pressable onPress={() => router.push("/register")}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>Criar conta</Text>
            </Pressable>
          </View>

          {DEMO_MODE ? (
            <View style={[styles.demoBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.demoTitle, { color: colors.foreground }]}>
                Testar sem cadastro
              </Text>
              <Text style={[styles.demoSub, { color: colors.mutedForeground }]}>
                Entre com uma conta de demonstração:
              </Text>
              <View style={styles.demoRow}>
                {DEMO_ACCOUNTS.map((acc) => (
                  <Pressable
                    key={acc.email}
                    disabled={loading}
                    onPress={() => {
                      setEmail(acc.email);
                      setSenha(DEMO_PASSWORD);
                      doLogin(acc.email, DEMO_PASSWORD);
                    }}
                    style={({ pressed }) => [
                      styles.demoChip,
                      { backgroundColor: colors.secondary, opacity: pressed || loading ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={[styles.demoChipText, { color: colors.secondaryForeground }]}>
                      {acc.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const webInputShadow = {
  boxShadow: "0 1px 2px rgba(124,106,174,0.04), 0 4px 12px rgba(124,106,174,0.07)",
} as unknown as object;

const styles = StyleSheet.create({
  demoBox: { marginTop: 20, borderWidth: 1, borderRadius: 20, padding: 16, gap: 4 },
  demoTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  demoSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 },
  demoRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  demoChip: { flexGrow: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999, alignItems: "center" },
  demoChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  root: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 28, justifyContent: "space-between" },
  logoArea: { alignItems: "center", gap: 4 },
  logo: { width: 120, height: 120 },
  titleRow: { flexDirection: "row", marginTop: 4 },
  titleNeuro: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  titleFlow: { fontSize: 30, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  tagline: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20, marginTop: 2 },
  formArea: { gap: 16 },
  welcome: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 4 },
  fields: { gap: 12 },
  inputWrapper: { borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 18, height: 56, justifyContent: "center" },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: { fontSize: 15, fontFamily: "Inter_400Regular" },
  inputFlex: { flex: 1 },
  errorBox: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#C0392B", textAlign: "center" },
  forgotRow: { alignItems: "flex-end" },
  forgotText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  enterBtn: { borderRadius: 999, overflow: "hidden" },
  enterGradient: { height: 56, alignItems: "center", justifyContent: "center" },
  enterLabel: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  footerLink: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});

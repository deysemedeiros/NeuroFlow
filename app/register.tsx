import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

import { WaveBackground } from "@/components/WaveBackground";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import type { TipoUsuario } from "@/types";

const TIPOS: { key: TipoUsuario; label: string; desc: string }[] = [
  { key: "Paciente",   label: "Paciente",    desc: "Acompanho minha saúde mental" },
  { key: "Responsavel",label: "Responsável", desc: "Cuido de alguém com TDAH" },
  { key: "Clinico",    label: "Clínico",     desc: "Profissional de saúde" },
];

function parseDateBR(val: string): string | null {
  const m = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [nome,               setNome]               = useState("");
  const [email,              setEmail]              = useState("");
  const [dataNasc,           setDataNasc]           = useState("");
  const [senha,              setSenha]              = useState("");
  const [confirmarSenha,     setConfirmarSenha]     = useState("");
  const [tipoUsuario,        setTipoUsuario]        = useState<TipoUsuario>("Paciente");

  // Paciente
  const [diagnostico,        setDiagnostico]        = useState("");
  // Clínico
  const [registro,           setRegistro]           = useState("");
  const [especialidade,      setEspecialidade]      = useState("");

  const [senhaVisivel,       setSenhaVisivel]       = useState(false);
  const [confirmarVisivel,   setConfirmarVisivel]   = useState(false);
  const [loading,            setLoading]            = useState(false);
  const [error,              setError]              = useState<string | null>(null);
  const [done,               setDone]               = useState(false);
  const [doneMode,           setDoneMode]           = useState<"pronto" | "pendente" | "confirmar">("pronto");

  const clear = () => setError(null);

  const handleRegister = async () => {
    const trimNome  = nome.trim();
    const trimEmail = email.trim();

    if (!trimNome || !trimEmail || !senha || !confirmarSenha) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    let dataNascFormatted: string | null = null;
    if (dataNasc.trim()) {
      dataNascFormatted = parseDateBR(dataNasc.trim());
      if (!dataNascFormatted) {
        setError("Data de nascimento inválida. Use o formato DD/MM/AAAA.");
        return;
      }
    }

    if (tipoUsuario === "Clinico" && !registro.trim()) {
      setError("Informe o registro profissional (CRM/CRP/CRO).");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Criar conta no Supabase Auth.
      //    O perfil (usuarios + paciente/responsavel/clinico) é criado no banco
      //    pelo gatilho `handle_new_user` a partir destes metadados — assim
      //    funciona mesmo quando a confirmação de e-mail está ativada.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimEmail,
        password: senha,
        options: {
          data: {
            nome:                  trimNome,
            tipo_usuario:          tipoUsuario,
            data_nascimento:       dataNascFormatted,
            diagnostico:           tipoUsuario === "Paciente" ? diagnostico.trim() || null : null,
            registro_profissional: tipoUsuario === "Clinico" ? registro.trim() || null : null,
            especialidade:         tipoUsuario === "Clinico" ? especialidade.trim() || null : null,
          },
        },
      });

      if (signUpError) {
        setError(
          signUpError.message === "User already registered"
            ? "Este e-mail já está cadastrado."
            : signUpError.message,
        );
        return;
      }

      // 2. Sem sessão = o projeto exige confirmação por e-mail.
      if (!data.session) {
        setDoneMode("confirmar");
        setDone(true);
        return;
      }

      // 3. Com sessão: descobre se a conta já está ativa ou aguarda aprovação.
      const { data: perfil } = await supabase
        .from("usuarios")
        .select("status")
        .eq("id", data.session.user.id)
        .single();
      setDoneMode(perfil?.status === "pendente" ? "pendente" : "pronto");
      await supabase.auth.signOut();

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  // ──────────── Tela de confirmação ────────────
  if (done) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <WaveBackground />
        <View style={[styles.doneBox, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
          <View style={[styles.doneIcon, { backgroundColor: "#E2CEF1" }]}>
            <Text style={styles.doneEmoji}>{doneMode === "pronto" ? "🎉" : doneMode === "confirmar" ? "✉️" : "📋"}</Text>
          </View>
          <Text style={[styles.doneTitle, { color: colors.foreground }]}>
            {doneMode === "pronto" ? "Conta criada!" : "Cadastro enviado!"}
          </Text>
          {doneMode === "pronto" ? (
            <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
              Tudo certo. Agora é só entrar{"\n"}com seu e-mail e senha.
            </Text>
          ) : doneMode === "confirmar" ? (
            <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
              Enviamos um link de confirmação{"\n"}para{" "}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                {email.trim()}
              </Text>
              .{"\n"}Confirme e depois faça login.
            </Text>
          ) : (
            <Text style={[styles.doneSub, { color: colors.mutedForeground }]}>
              Seu cadastro está sendo revisado.{"\n"}
              Você receberá acesso assim que o{"\n"}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                administrador aprovar
              </Text>
              {" "}sua conta.
            </Text>
          )}
          <Pressable
            onPress={() => router.replace("/login")}
            style={({ pressed }) => [styles.doneBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={styles.doneBtnText}>Ir para o Login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ──────────── Formulário ────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <WaveBackground />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.headerRow, { paddingTop: insets.top + 12, paddingHorizontal: 24 }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ArrowLeft size={18} color={colors.foreground} strokeWidth={2} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Criar conta</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Comece sua jornada de autocuidado
        </Text>

        {/* ── Dados básicos ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Dados pessoais</Text>
          <View style={styles.fields}>
            <Field
              placeholder="Nome completo *"
              value={nome}
              onChangeText={(v) => { setNome(v); clear(); }}
              autoCapitalize="words"
              colors={colors}
            />
            <Field
              placeholder="E-mail *"
              value={email}
              onChangeText={(v) => { setEmail(v); clear(); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              colors={colors}
            />
            <Field
              placeholder="Data de nascimento (DD/MM/AAAA)"
              value={dataNasc}
              onChangeText={(v) => { setDataNasc(formatDateInput(v)); clear(); }}
              keyboardType="number-pad"
              colors={colors}
            />
          </View>
        </View>

        {/* ── Tipo de perfil ── */}
        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Perfil de acesso *</Text>
        <View style={styles.tipoGrid}>
          {TIPOS.map((t) => {
            const active = tipoUsuario === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => { setTipoUsuario(t.key); clear(); }}
                style={({ pressed }) => [
                  styles.tipoCard,
                  {
                    backgroundColor: active ? colors.secondary : colors.card,
                    borderColor:     active ? colors.softPurple : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={[styles.tipoTitle, { color: active ? colors.softPurple : colors.foreground }]}>
                  {t.label}
                </Text>
                <Text style={[styles.tipoDesc, { color: colors.mutedForeground }]}>
                  {t.desc}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Campos condicionais ── */}
        {tipoUsuario === "Paciente" && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Informações clínicas</Text>
            <View style={styles.fields}>
              <Field
                placeholder="Diagnóstico (ex: TDAH, Autismo)"
                value={diagnostico}
                onChangeText={(v) => { setDiagnostico(v); clear(); }}
                autoCapitalize="sentences"
                colors={colors}
              />
            </View>
          </View>
        )}

        {tipoUsuario === "Clinico" && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Dados profissionais</Text>
            <View style={styles.fields}>
              <Field
                placeholder="Registro profissional (CRM/CRP/CRO) *"
                value={registro}
                onChangeText={(v) => { setRegistro(v); clear(); }}
                autoCapitalize="characters"
                colors={colors}
              />
              <Field
                placeholder="Especialidade (ex: Neuropsicologia)"
                value={especialidade}
                onChangeText={(v) => { setEspecialidade(v); clear(); }}
                autoCapitalize="sentences"
                colors={colors}
              />
            </View>
          </View>
        )}

        {/* ── Senha ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Segurança</Text>
          <View style={styles.fields}>
            <PasswordField
              placeholder="Senha (mín. 6 caracteres) *"
              value={senha}
              onChangeText={(v) => { setSenha(v); clear(); }}
              visible={senhaVisivel}
              onToggle={() => setSenhaVisivel(!senhaVisivel)}
              colors={colors}
            />
            <PasswordField
              placeholder="Confirmar senha *"
              value={confirmarSenha}
              onChangeText={(v) => { setConfirmarSenha(v); clear(); }}
              visible={confirmarVisivel}
              onToggle={() => setConfirmarVisivel(!confirmarVisivel)}
              colors={colors}
            />
          </View>
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: "#FFF0F0", borderColor: "#FFCCCC" }]}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          style={({ pressed }) => [styles.submitBtn, { opacity: pressed || loading ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={["#9ED0C9", "#C5B4E3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.submitLabel}>Criar conta</Text>}
          </LinearGradient>
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Já tem conta?{" "}
          </Text>
          <Pressable onPress={() => router.replace("/login")}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Entrar</Text>
          </Pressable>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Componentes auxiliares ──────────────────────────────────────────────────

type ColorsType = ReturnType<typeof import("@/hooks/useColors").useColors>;

function Field({
  placeholder, value, onChangeText, colors, keyboardType, autoCapitalize, autoCorrect,
}: {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  colors: ColorsType;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
  autoCapitalize?: React.ComponentProps<typeof TextInput>["autoCapitalize"];
  autoCorrect?: boolean;
}) {
  return (
    <View
      style={[
        styles.inputWrapper,
        { backgroundColor: colors.card, borderColor: colors.border },
        Platform.OS === "web" && webShadow,
      ]}
    >
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        style={[styles.input, { color: colors.foreground }]}
      />
    </View>
  );
}

function PasswordField({
  placeholder, value, onChangeText, visible, onToggle, colors,
}: {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
  colors: ColorsType;
}) {
  return (
    <View
      style={[
        styles.inputWrapper,
        styles.inputRow,
        { backgroundColor: colors.card, borderColor: colors.border },
        Platform.OS === "web" && webShadow,
      ]}
    >
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        style={[styles.input, styles.inputFlex, { color: colors.foreground }]}
      />
      <Pressable onPress={onToggle} hitSlop={8}>
        {visible
          ? <EyeOff size={18} color={colors.mutedForeground} strokeWidth={1.8} />
          : <Eye    size={18} color={colors.mutedForeground} strokeWidth={1.8} />}
      </Pressable>
    </View>
  );
}

const webShadow = {
  boxShadow: "0 1px 2px rgba(124,106,174,0.04), 0 4px 12px rgba(124,106,174,0.07)",
} as unknown as object;

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  headerRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scroll: { paddingHorizontal: 24, paddingTop: 12, gap: 14 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 4 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  fields: { gap: 10 },
  inputWrapper: {
    borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, height: 52, justifyContent: "center",
  },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: { fontSize: 14, fontFamily: "Inter_400Regular" },
  inputFlex: { flex: 1 },
  tipoGrid: { gap: 8 },
  tipoCard: { borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 12, gap: 2 },
  tipoTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  tipoDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  errorBox: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#C0392B", textAlign: "center" },
  submitBtn: { borderRadius: 999, overflow: "hidden", marginTop: 4 },
  submitGradient: { height: 54, alignItems: "center", justifyContent: "center" },
  submitLabel: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  footerRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  footerLink: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  // done screen
  doneBox: { flex: 1, paddingHorizontal: 28, alignItems: "center", justifyContent: "center", gap: 20 },
  doneIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  doneEmoji: { fontSize: 36 },
  doneTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  doneSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24 },
  doneBtn: { borderRadius: 999, paddingHorizontal: 36, paddingVertical: 16, marginTop: 8 },
  doneBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});

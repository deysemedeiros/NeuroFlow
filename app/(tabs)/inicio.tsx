import { useRouter } from "expo-router";
import {
  BarChart2,
  BookOpen,
  Droplet,
  Meh,
  Moon,
  Smile,
  Sun,
  Target,
  TrendingUp,
  User,
  Wind,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SoftCard } from "@/components/SoftCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { fetchDiarioEntries, fetchPlanos, insertDiarioEntry } from "@/lib/db";
import type { DiarioEntry, PlanoItem } from "@/types";

type MoodKey = "cansado" | "triste" | "bem" | "melhorando";

interface Mood {
  key: MoodKey;
  label: string;
  Icon: LucideIcon;
  bg: string;
  fg: string;
}

function firstName(nome: string): string {
  return nome.split(" ")[0] ?? nome;
}

function greetingByHour(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function entriesThisWeek(entries: DiarioEntry[]): number {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  return entries.filter((e) => new Date(e.dataRegistro) >= weekAgo).length;
}

export default function InicioScreen() {
  const colors = useColors();
  const router = useRouter();
  const { auth } = useAuth();

  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [moodMsg, setMoodMsg] = useState<string | null>(null);
  const [diarioEntries, setDiarioEntries] = useState<DiarioEntry[]>([]);
  const [planos, setPlanos] = useState<PlanoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const moods: Mood[] = [
    { key: "cansado",    label: "Cansado",    Icon: Moon,  bg: "#E2CEF1", fg: "#5C3A8A" },
    { key: "triste",     label: "Triste",     Icon: Meh,   bg: "#F5E0B5", fg: "#8B5E00" },
    { key: "bem",        label: "Bem",        Icon: Smile, bg: "#C0F8C9", fg: "#1E6B35" },
    { key: "melhorando", label: "Melhorando", Icon: Sun,   bg: "#FAE565", fg: "#6B4D00" },
  ];

  const fetchData = useCallback(async () => {
    if (!auth) return;
    const { usuario } = auth;
    if (usuario.tipoUsuario !== "Paciente") {
      setLoading(false);
      return;
    }
    try {
      const [entries, plans] = await Promise.all([
        fetchDiarioEntries(usuario.id),
        fetchPlanos({ idPaciente: usuario.id }),
      ]);
      setDiarioEntries(entries);
      setPlanos(plans);
    } catch {
      // graceful degradation
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const registerMood = async (m: Mood) => {
    setSelectedMood(m.key);
    if (!auth || auth.usuario.tipoUsuario !== "Paciente") return;
    try {
      const entry = await insertDiarioEntry(auth.usuario.id, m.label);
      setDiarioEntries((prev) => [entry, ...prev]);
      setMoodMsg(`"${m.label}" registrado no seu diário.`);
    } catch {
      setMoodMsg("Não foi possível salvar agora. Tente novamente.");
    }
    setTimeout(() => setMoodMsg(null), 2500);
  };

  const usuario = auth?.usuario;
  const isPaciente = usuario?.tipoUsuario === "Paciente";
  const weekCount = entriesThisWeek(diarioEntries);
  const activePlano = planos.find((p) => p.status === "Ativo") ?? planos[0];

  return (
    <ScreenContainer>
      <View style={styles.greetingRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.hello, { color: colors.foreground }]}>
            {greetingByHour()},{" "}
            {usuario ? firstName(usuario.nome) : "…"}
          </Text>
          <Text style={[styles.helloSub, { color: colors.mutedForeground }]}>
            Como você está se sentindo hoje?
          </Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
          {usuario?.fotoUrl ? (
            <Image source={{ uri: usuario.fotoUrl }} style={styles.avatarImage} />
          ) : (
            <User size={22} color={colors.softPurple} strokeWidth={1.8} />
          )}
        </View>
      </View>

      <View style={styles.moodGrid}>
        {moods.map((m) => {
          const MoodIcon = m.Icon;
          const active = selectedMood === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => registerMood(m)}
              accessibilityRole="button"
              accessibilityLabel={`Registrar humor: ${m.label}`}
              style={({ pressed }) => [
                styles.moodChip,
                {
                  backgroundColor: m.bg,
                  borderColor: active ? m.fg : "transparent",
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <MoodIcon size={22} color={m.fg} strokeWidth={1.8} />
              <Text style={[styles.moodLabel, { color: m.fg }]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {moodMsg ? (
        <Text style={[styles.moodMsg, { color: colors.mutedForeground }]}>{moodMsg}</Text>
      ) : null}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.softPurple} />
        </View>
      ) : (
        <>
          <SoftCard style={styles.cardSpacing}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Seu dia
            </Text>
            {isPaciente && activePlano?.objetivos ? (
              <DayItem Icon={Target} color={colors.primary} text={activePlano.objetivos} />
            ) : (
              <DayItem Icon={Target} color={colors.primary} text="Nenhum plano ativo no momento" />
            )}
            <DayItem Icon={Droplet} color="#7BB8C7" text="Lembrete: beber água" />
            <DayItem Icon={BookOpen} color={colors.softPurple} text="Reserve 10 min para leitura" />
          </SoftCard>

          <SoftCard style={styles.cardSpacing}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              Seu progresso
            </Text>
            {isPaciente ? (
              <>
                <DayItem
                  Icon={TrendingUp}
                  color="#D49A6A"
                  text={
                    weekCount === 0
                      ? "Nenhum registro esta semana — comece hoje!"
                      : weekCount === 1
                        ? "1 registro de emoção esta semana"
                        : `${weekCount} registros de emoção esta semana`
                  }
                />
                <DayItem
                  Icon={BarChart2}
                  color={colors.softPurple}
                  text={
                    diarioEntries.length === 0
                      ? "Registre sua primeira emoção no Diário"
                      : `${diarioEntries.length} registro${diarioEntries.length > 1 ? "s" : ""} no total`
                  }
                />
              </>
            ) : (
              <DayItem Icon={TrendingUp} color="#D49A6A" text="Acompanhe o progresso dos seus pacientes" />
            )}
          </SoftCard>
        </>
      )}

      <View style={{ marginTop: 24 }}>
        <AppButton
          label="Respirar por 2 minutos"
          variant="gradient"
          iconLeft={<Wind size={18} color="#fff" strokeWidth={1.8} />}
          onPress={() => router.push("/respirar")}
        />
      </View>
    </ScreenContainer>
  );
}

function DayItem({ Icon, color, text }: { Icon: LucideIcon; color: string; text: string }) {
  const colors = useColors();
  const ItemIcon = Icon;
  return (
    <View style={styles.dayItem}>
      <View style={[styles.dayIcon, { backgroundColor: color + "22" }]}>
        <ItemIcon size={16} color={color} strokeWidth={1.8} />
      </View>
      <Text style={[styles.dayText, { color: colors.foreground }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  greetingRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  hello: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  helloSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 6 },
  avatar: { width: 46, height: 46, borderRadius: 999, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImage: { width: 46, height: 46, borderRadius: 999 },
  moodGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
  moodChip: {
    flexBasis: "47%", flexGrow: 1, borderRadius: 22, paddingVertical: 18,
    alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5,
  },
  moodMsg: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center", marginTop: 4 },
  moodLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardSpacing: { marginTop: 18 },
  cardTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 14 },
  loadingBox: { marginTop: 32, alignItems: "center" },
  dayItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  dayIcon: { width: 32, height: 32, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  dayText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
});

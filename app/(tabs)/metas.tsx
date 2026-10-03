import AsyncStorage from "@react-native-async-storage/async-storage";
import { Book, Check, ClipboardList, Droplet, Minus, Moon, Plus, Wind } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/ScreenContainer";
import { SoftCard } from "@/components/SoftCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { fetchPlanos } from "@/lib/db";
import type { PlanoItem } from "@/types";

interface GoalDef {
  id: string;
  label: string;
  total: number;
  Icon: LucideIcon;
  color: string;
}

interface GoalProgress {
  id: string;
  progress: number;
}

const GOAL_DEFS: GoalDef[] = [
  { id: "1", label: "Ler 10 minutos por dia", total: 7, Icon: Book, color: "#B4A3D9" },
  { id: "2", label: "Beber 2L de água", total: 7, Icon: Droplet, color: "#7BB8C7" },
  { id: "3", label: "Caminhar pela manhã", total: 7, Icon: Wind, color: "#85C8A8" },
  { id: "4", label: "Meditar antes de dormir", total: 7, Icon: Moon, color: "#D49A6A" },
];

const INITIAL_PROGRESS: GoalProgress[] = [
  { id: "1", progress: 0 },
  { id: "2", progress: 0 },
  { id: "3", progress: 0 },
  { id: "4", progress: 0 },
];

/** Chave da semana atual (segunda-feira), para zerar o progresso toda semana. */
function weekKey(): string {
  const d = new Date();
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

const STATUS_COLORS: Record<string, string> = {
  Ativo: "#3F7765",
  Concluído: "#7BB8C7",
  Suspenso: "#D49A6A",
};

const STATUS_BG: Record<string, string> = {
  Ativo: "#C9E8DC",
  Concluído: "#BFE3E8",
  Suspenso: "#F5E4C8",
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function MetasScreen() {
  const colors = useColors();
  const { auth } = useAuth();

  const [progresses, setProgresses] = useState<GoalProgress[]>(INITIAL_PROGRESS);
  const [planos, setPlanos] = useState<PlanoItem[]>([]);
  const [loadingPlanos, setLoadingPlanos] = useState(true);

  const isPaciente = auth?.usuario.tipoUsuario === "Paciente";
  const storageKey = auth ? `neuroflow:metas:${auth.usuario.id}:${weekKey()}` : null;
  const [hydrated, setHydrated] = useState(false);

  // Progresso das metas fica salvo no dispositivo (AsyncStorage / localStorage na web).
  useEffect(() => {
    if (!storageKey) return;
    AsyncStorage.getItem(storageKey)
      .then((raw) => {
        if (raw) setProgresses(JSON.parse(raw) as GoalProgress[]);
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !hydrated) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(progresses)).catch(() => {});
  }, [storageKey, hydrated, progresses]);

  const loadPlanos = useCallback(async () => {
    if (!auth) return;
    const { usuario } = auth;
    try {
      let data: PlanoItem[] = [];
      if (usuario.tipoUsuario === "Paciente") {
        data = await fetchPlanos({ idPaciente: usuario.id });
      } else if (usuario.tipoUsuario === "Clinico") {
        data = await fetchPlanos({ idClinico: usuario.id });
      }
      setPlanos(data);
    } catch {
      // graceful
    } finally {
      setLoadingPlanos(false);
    }
  }, [auth]);

  useEffect(() => {
    loadPlanos();
  }, [loadPlanos]);

  const tick = (id: string) =>
    setProgresses((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const def = GOAL_DEFS.find((d) => d.id === id);
        return { ...p, progress: Math.min(def?.total ?? p.progress, p.progress + 1) };
      }),
    );

  const untick = (id: string) =>
    setProgresses((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        return { ...p, progress: Math.max(0, p.progress - 1) };
      }),
    );

  const totalProgress = INITIAL_PROGRESS.reduce((s, p) => {
    const cur = progresses.find((x) => x.id === p.id);
    return s + (cur?.progress ?? p.progress);
  }, 0);
  const totalMax = GOAL_DEFS.reduce((s, d) => s + d.total, 0);

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: colors.foreground }]}>Metas</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Pequenos passos, grandes resultados.
      </Text>

      {loadingPlanos ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.softPurple} />
        </View>
      ) : planos.length > 0 ? (
        <>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            {isPaciente ? "PLANO TERAPÊUTICO" : "PLANOS DOS PACIENTES"}
          </Text>
          {planos.map((p) => (
            <SoftCard key={p.id} background={colors.secondary} style={{ marginBottom: 12 }}>
              <View style={styles.planoHeader}>
                <View style={[styles.planoIcon, { backgroundColor: colors.lilac }]}>
                  <ClipboardList size={16} color={colors.softPurple} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  {p.dataInicio && (
                    <Text style={[styles.planoDate, { color: colors.mutedForeground }]}>
                      Desde {formatDate(p.dataInicio)}
                    </Text>
                  )}
                  {p.status && (
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[p.status] ?? colors.mint }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[p.status] ?? "#3F7765" }]}>
                        {p.status}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              {p.objetivos && (
                <Text style={[styles.planoObjetivo, { color: colors.foreground }]}>
                  {p.objetivos}
                </Text>
              )}
            </SoftCard>
          ))}
        </>
      ) : null}

      <SoftCard background={colors.secondary} style={{ marginTop: planos.length > 0 ? 8 : 24 }}>
        <Text style={[styles.summaryLabel, { color: colors.softPurple }]}>ESTA SEMANA</Text>
        <Text style={[styles.summaryValue, { color: colors.foreground }]}>
          {totalProgress} de {totalMax} cumpridas
        </Text>
        <View style={styles.summaryBar}>
          <View
            style={[
              styles.summaryFill,
              { backgroundColor: colors.softPurple, width: `${Math.round((totalProgress / totalMax) * 100)}%` },
            ]}
          />
        </View>
        <Text style={[styles.summaryFooter, { color: colors.mutedForeground }]}>
          {totalProgress >= totalMax
            ? "Parabéns! Todas as metas cumpridas!"
            : "Continue assim, você está indo muito bem."}
        </Text>
      </SoftCard>

      <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 22 }]}>
        METAS DIÁRIAS
      </Text>
      {GOAL_DEFS.map((def) => {
        const p = progresses.find((x) => x.id === def.id) ?? { progress: 0 };
        const pct = (p.progress / def.total) * 100;
        const done = p.progress >= def.total;
        const GoalIcon = def.Icon;
        return (
          <SoftCard key={def.id} style={{ marginTop: 10 }}>
            <View style={styles.goalRow}>
              <View style={[styles.goalIcon, { backgroundColor: def.color + "22" }]}>
                <GoalIcon size={18} color={def.color} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.goalLabel, { color: colors.foreground }]}>{def.label}</Text>
                <Text style={[styles.goalSub, { color: colors.mutedForeground }]}>
                  {p.progress} de {def.total} dias
                </Text>
              </View>
              <View style={styles.goalBtns}>
                <Pressable
                  onPress={() => untick(def.id)}
                  disabled={p.progress === 0}
                  style={({ pressed }) => [
                    styles.tickBtn,
                    { backgroundColor: colors.muted, opacity: pressed || p.progress === 0 ? 0.4 : 1 },
                  ]}
                >
                  <Minus size={14} color={colors.mutedForeground} strokeWidth={2.5} />
                </Pressable>
                <Pressable
                  onPress={() => tick(def.id)}
                  disabled={done}
                  style={({ pressed }) => [
                    styles.tickBtn,
                    { backgroundColor: done ? colors.mint : colors.muted, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  {done ? (
                    <Check size={16} color="#3F7765" strokeWidth={2.5} />
                  ) : (
                    <Plus size={16} color={colors.mutedForeground} strokeWidth={2} />
                  )}
                </Pressable>
              </View>
            </View>
            <View style={styles.goalBar}>
              <View style={[styles.goalFill, { backgroundColor: def.color, width: `${pct}%` }]} />
            </View>
          </SoftCard>
        );
      })}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 6 },
  loadingBox: { marginTop: 24, alignItems: "center" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: 10 },
  planoHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  planoIcon: { width: 32, height: 32, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  planoDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  planoObjetivo: { fontSize: 14, fontFamily: "Inter_500Medium", lineHeight: 20 },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  summaryValue: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 6 },
  summaryBar: { height: 8, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.6)", marginTop: 14, overflow: "hidden" },
  summaryFill: { height: "100%", borderRadius: 999 },
  summaryFooter: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 12 },
  goalRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  goalIcon: { width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  goalLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  goalSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  goalBtns: { flexDirection: "row", gap: 6 },
  tickBtn: { width: 36, height: 36, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  goalBar: { height: 6, borderRadius: 999, backgroundColor: "#F1ECF8", marginTop: 14, overflow: "hidden" },
  goalFill: { height: "100%", borderRadius: 999 },
});

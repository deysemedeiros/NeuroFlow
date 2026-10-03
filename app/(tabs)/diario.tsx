import {
  AlertCircle,
  Award,
  Check,
  Cloud,
  CloudRain,
  Edit3,
  Minus,
  Moon,
  Smile,
  Sun,
} from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SoftCard } from "@/components/SoftCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { deleteDiarioEntry, fetchDiarioEntries, insertDiarioEntry } from "@/lib/db";
import type { DiarioEntry } from "@/types";

interface EmotionDef {
  key: string;
  label: string;
  Icon: LucideIcon;
  color: string;
}

const EMOTION_DEFS: EmotionDef[] = [
  { key: "Feliz", label: "Feliz", Icon: Smile, color: "#F5C572" },
  { key: "Ansioso", label: "Ansioso", Icon: AlertCircle, color: "#D49A6A" },
  { key: "Cansado", label: "Cansado", Icon: Moon, color: "#B4A3D9" },
  { key: "Calmo", label: "Calmo", Icon: Cloud, color: "#7BB8C7" },
  { key: "Frustrado", label: "Frustrado", Icon: CloudRain, color: "#A78BBE" },
  { key: "Motivado", label: "Motivado", Icon: Sun, color: "#E8B86A" },
];

// Humores registrados pela tela Início — só para exibir no histórico.
const EXTRA_DEFS: EmotionDef[] = [
  { key: "Bem", label: "Bem", Icon: Smile, color: "#5FAF7A" },
  { key: "Triste", label: "Triste", Icon: CloudRain, color: "#C9A24A" },
  { key: "Melhorando", label: "Melhorando", Icon: Sun, color: "#D9B530" },
];
const ALL_DEFS = [...EMOTION_DEFS, ...EXTRA_DEFS];

interface LevelInfo {
  title: string;
  subtitle: string;
  pct: number;
}

function calcLevel(total: number): LevelInfo {
  if (total === 0) {
    return { title: "Iniciante", subtitle: "Registre sua primeira emoção", pct: 0 };
  }
  if (total < 5) {
    return { title: "Explorador", subtitle: `${total} de 5 registros para o próximo nível`, pct: total / 5 };
  }
  if (total < 15) {
    return { title: "Praticante", subtitle: `${total} de 15 registros para o próximo nível`, pct: total / 15 };
  }
  return { title: "Experiente", subtitle: "Você tem consistência emocional incrível!", pct: 1 };
}

export default function DiarioScreen() {
  const colors = useColors();
  const { auth } = useAuth();

  const [entries, setEntries] = useState<DiarioEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isPaciente = auth?.usuario.tipoUsuario === "Paciente";

  const loadEntries = useCallback(async () => {
    if (!auth || !isPaciente) {
      setLoadingEntries(false);
      return;
    }
    try {
      const data = await fetchDiarioEntries(auth.usuario.id);
      setEntries(data);
    } catch {
      // graceful
    } finally {
      setLoadingEntries(false);
    }
  }, [auth, isPaciente]);

  // Recarrega ao voltar para a aba (ex.: humor registrado na tela Início).
  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries]),
  );

  const register = async () => {
    if (!selected || !auth || !isPaciente) return;
    setSaving(true);
    try {
      const entry = await insertDiarioEntry(auth.usuario.id, selected);
      setEntries((prev) => [entry, ...prev]);
      setConfirmed(true);
      setTimeout(() => {
        setOpen(false);
        setConfirmed(false);
        setSelected(null);
        setSaving(false);
      }, 1400);
    } catch {
      setSaving(false);
    }
  };

  const removeEntry = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteDiarioEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // ignore — entry stays in list
    } finally {
      setDeletingId(null);
    }
  };

  const level = calcLevel(entries.length);

  const todayEntries = entries.filter((e) => {
    const d = new Date(e.dataRegistro);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  });

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Diário emocional
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Organize sua rotina com leveza.
      </Text>

      {!isPaciente ? (
        <SoftCard style={{ marginTop: 24 }}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            Diário emocional
          </Text>
          <Text style={[styles.nonPacienteText, { color: colors.mutedForeground }]}>
            Esta seção é destinada a pacientes. Aqui eles registram suas emoções ao longo do tempo.
          </Text>
        </SoftCard>
      ) : (
        <>
          {todayEntries.length > 0 && (
            <SoftCard background={colors.mint} style={{ marginTop: 24 }}>
              <View style={styles.suggestionHeader}>
                <View style={[styles.tagDot, { backgroundColor: "#3F7765" }]} />
                <Text style={[styles.suggestionTag, { color: "#3F7765" }]}>Hoje</Text>
              </View>
              <Text style={[styles.suggestionText, { color: "#234A3D" }]}>
                {todayEntries.length === 1
                  ? `Você se sentiu "${todayEntries[0]?.sentimento}" hoje.`
                  : `Você fez ${todayEntries.length} registros hoje.`}
              </Text>
            </SoftCard>
          )}

          {entries.length > 0 && (
            <SoftCard style={{ marginTop: todayEntries.length > 0 ? 14 : 24 }}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                Histórico recente
              </Text>
              {entries.slice(0, 5).map((e) => {
                const def = ALL_DEFS.find((d) => d.key === e.sentimento);
                const EmotionIcon = def?.Icon ?? Smile;
                const emColor = def?.color ?? colors.softPurple;
                const date = new Date(e.dataRegistro);
                const label = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
                return (
                  <View key={e.id} style={styles.historyRow}>
                    <View style={[styles.historyDot, { backgroundColor: emColor + "33" }]}>
                      <EmotionIcon size={14} color={emColor} strokeWidth={1.8} />
                    </View>
                    <Text style={[styles.historyEmotion, { color: colors.foreground }]}>
                      {e.sentimento ?? "—"}
                    </Text>
                    <Text style={[styles.historyDate, { color: colors.mutedForeground }]}>
                      {label}
                    </Text>
                    <Pressable
                      onPress={() => removeEntry(e.id)}
                      disabled={deletingId === e.id}
                      hitSlop={8}
                      style={({ pressed }) => [
                        styles.removeBtn,
                        { backgroundColor: "#FFF0F0", opacity: pressed || deletingId === e.id ? 0.5 : 1 },
                      ]}
                    >
                      {deletingId === e.id ? (
                        <ActivityIndicator size={10} color="#C0392B" />
                      ) : (
                        <Minus size={12} color="#C0392B" strokeWidth={2.5} />
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </SoftCard>
          )}

          {loadingEntries ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={colors.softPurple} />
            </View>
          ) : (
            <SoftCard style={{ marginTop: 14 }}>
              <View style={styles.levelRow}>
                <View style={[styles.levelBadge, { backgroundColor: colors.secondary }]}>
                  <Award size={20} color={colors.softPurple} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.levelTitle, { color: colors.foreground }]}>
                    {level.title}
                  </Text>
                  <Text style={[styles.levelSub, { color: colors.mutedForeground }]}>
                    {level.subtitle}
                  </Text>
                </View>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { backgroundColor: colors.softPurple, width: `${Math.round(level.pct * 100)}%` },
                  ]}
                />
              </View>
            </SoftCard>
          )}

          <View style={{ marginTop: 24 }}>
            <AppButton
              label="Registrar emoção"
              variant="primary"
              iconLeft={<Edit3 size={18} color="#fff" strokeWidth={1.8} />}
              onPress={() => setOpen(true)}
            />
          </View>
        </>
      )}

      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.background }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            {confirmed ? (
              <View style={styles.confirmBox}>
                <View style={[styles.confirmIcon, { backgroundColor: colors.mint }]}>
                  <Check size={28} color="#3F7765" strokeWidth={2.5} />
                </View>
                <Text style={[styles.confirmText, { color: colors.foreground }]}>
                  Emoção registrada
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
                  Como você se sente?
                </Text>
                <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                  Escolha uma emoção para registrar agora
                </Text>
                <View style={styles.emotionGrid}>
                  {EMOTION_DEFS.map((e) => {
                    const isSel = selected === e.key;
                    const EmIcon = e.Icon;
                    return (
                      <Pressable
                        key={e.key}
                        onPress={() => setSelected(e.key)}
                        style={({ pressed }) => [
                          styles.emotionChip,
                          {
                            backgroundColor: isSel ? e.color + "33" : colors.card,
                            borderColor: isSel ? e.color : colors.border,
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                      >
                        <EmIcon size={20} color={e.color} strokeWidth={1.8} />
                        <Text style={[styles.emotionLabel, { color: colors.foreground }]}>
                          {e.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={{ marginTop: 24 }}>
                  <AppButton
                    label={saving ? "Salvando…" : "Salvar"}
                    variant="gradient"
                    disabled={!selected || saving}
                    onPress={register}
                  />
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 6 },
  cardTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold", marginBottom: 12 },
  nonPacienteText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  suggestionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  tagDot: { width: 8, height: 8, borderRadius: 999 },
  suggestionTag: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.4, textTransform: "uppercase" },
  suggestionText: { fontSize: 15, fontFamily: "Inter_500Medium", lineHeight: 22 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 7 },
  historyDot: { width: 30, height: 30, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  historyEmotion: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  historyDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  removeBtn: { width: 26, height: 26, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  loadingBox: { marginTop: 24, alignItems: "center" },
  levelRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  levelBadge: { width: 44, height: 44, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  levelTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  levelSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  progressBarTrack: { height: 8, borderRadius: 999, backgroundColor: "#ECE7F5", overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 999 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(45,42,61,0.35)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 44, height: 5, borderRadius: 999, backgroundColor: "#D6CFE6", alignSelf: "center", marginBottom: 18 },
  sheetTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  sheetSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 4, marginBottom: 20 },
  emotionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  emotionChip: { flexBasis: "30%", flexGrow: 1, paddingVertical: 16, borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 6, borderWidth: 1.5 },
  emotionLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  confirmBox: { alignItems: "center", paddingVertical: 32, gap: 18 },
  confirmIcon: { width: 72, height: 72, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  confirmText: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
});

import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check, MapPin, Video } from "lucide-react-native";
import React, { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppButton } from "@/components/AppButton";
import { SoftCard } from "@/components/SoftCard";
import { WaveBackground } from "@/components/WaveBackground";
import { useColors } from "@/hooks/useColors";

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Próximos 7 dias a partir de amanhã. */
function nextDays(count = 7) {
  const base = new Date();
  return Array.from({ length: count }, (_, i) => {
    const dt = new Date(base);
    dt.setDate(base.getDate() + i + 1);
    return { d: WEEKDAY_LABELS[dt.getDay()], n: dt.getDate() };
  });
}
const TIMES = ["09:00", "10:30", "13:00", "14:30", "16:00", "18:00"];

type AttendanceType = "online" | "presencial";

const ATTENDANCE_OPTS: { k: AttendanceType; label: string; Icon: typeof Video }[] = [
  { k: "online", label: "Online", Icon: Video },
  { k: "presencial", label: "Presencial", Icon: MapPin },
];

export default function AgendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string; specialty?: string; initials?: string; fotoUrl?: string }>();

  const DAYS = React.useMemo(() => nextDays(), []);
  const [day, setDay] = useState(0);
  const [time, setTime] = useState("10:30");
  const [type, setType] = useState<AttendanceType>("online");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const confirm = () => {
    setConfirmed(true);
    setTimeout(() => router.back(), 1500);
  };

  if (confirmed) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <WaveBackground />
        <View style={[styles.successWrap, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={[styles.successCircle, { backgroundColor: colors.mint }]}>
            <Check size={42} color="#3F7765" strokeWidth={2.5} />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>
            Consulta agendada com sucesso
          </Text>
          <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
            Você receberá um lembrete antes do horário.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <WaveBackground />
      <View style={[styles.header, { paddingTop: insets.top + 12, paddingHorizontal: 22 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 }]}
        >
          <ArrowLeft size={20} color={colors.foreground} strokeWidth={1.8} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Agendar consulta</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 12, paddingBottom: insets.bottom + 140 }}
      >
        <SoftCard>
          <View style={styles.proRow}>
            <View style={[styles.proAvatar, { backgroundColor: colors.lilac }]}>
              {params.fotoUrl ? (
                <Image source={{ uri: params.fotoUrl }} style={styles.proAvatarImage} />
              ) : (
                <Text style={styles.proInitials}>{params.initials ?? "CR"}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.proName, { color: colors.foreground }]}>
                {params.name ?? "Dra. Camila Rocha"}
              </Text>
              <Text style={[styles.proSpecialty, { color: colors.softPurple }]}>
                {params.specialty ?? "Psicóloga"}
              </Text>
            </View>
          </View>
        </SoftCard>

        <Text style={[styles.section, { color: colors.foreground }]}>Selecione a data</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {DAYS.map((dt, i) => {
            const active = day === i;
            return (
              <Pressable
                key={i}
                onPress={() => setDay(i)}
                style={({ pressed }) => [
                  styles.dayChip,
                  { backgroundColor: active ? colors.softPurple : colors.card, borderColor: active ? colors.softPurple : colors.border, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={[styles.dayLabel, { color: active ? "rgba(255,255,255,0.85)" : colors.mutedForeground }]}>{dt.d}</Text>
                <Text style={[styles.dayNum, { color: active ? "#fff" : colors.foreground }]}>{dt.n}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={[styles.section, { color: colors.foreground }]}>Selecione o horário</Text>
        <View style={styles.timeGrid}>
          {TIMES.map((t) => {
            const active = time === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTime(t)}
                style={({ pressed }) => [
                  styles.timeChip,
                  { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={[styles.timeText, { color: active ? "#fff" : colors.foreground }]}>{t}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: colors.foreground }]}>Tipo de atendimento</Text>
        <View style={styles.typeRow}>
          {ATTENDANCE_OPTS.map((opt) => {
            const active = type === opt.k;
            return (
              <Pressable
                key={opt.k}
                onPress={() => setType(opt.k)}
                style={({ pressed }) => [
                  styles.typeChip,
                  { backgroundColor: active ? colors.secondary : colors.card, borderColor: active ? colors.softPurple : colors.border, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <opt.Icon size={18} color={active ? colors.softPurple : colors.mutedForeground} strokeWidth={1.8} />
                <Text style={[styles.typeText, { color: active ? colors.softPurple : colors.foreground }]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.section, { color: colors.foreground }]}>Observações</Text>
        <View style={[styles.textarea, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Escreva algo que queira compartilhar antes da consulta"
            placeholderTextColor={colors.mutedForeground}
            multiline
            style={[styles.textareaInput, { color: colors.foreground }]}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: colors.background + "EE" }]}>
        <AppButton label="Confirmar agendamento" variant="gradient" onPress={confirm} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  closeBtn: { width: 40, height: 40, borderRadius: 999, alignItems: "center", justifyContent: "center", shadowColor: "#7C6AAE", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  proRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  proAvatar: { width: 52, height: 52, borderRadius: 999, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  proAvatarImage: { width: 52, height: 52, borderRadius: 999 },
  proInitials: { fontFamily: "Inter_600SemiBold", color: "#4A4660", fontSize: 15 },
  proName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  proSpecialty: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  section: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginTop: 24, marginBottom: 12 },
  dayChip: { width: 60, paddingVertical: 14, borderRadius: 18, borderWidth: 1, alignItems: "center", gap: 4 },
  dayLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase" },
  dayNum: { fontSize: 18, fontFamily: "Inter_700Bold" },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeChip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, borderWidth: 1 },
  timeText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  typeRow: { flexDirection: "row", gap: 12 },
  typeChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 18, borderWidth: 1.5 },
  typeText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  textarea: { minHeight: 110, borderRadius: 20, borderWidth: 1, padding: 16 },
  textareaInput: { fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 80, textAlignVertical: "top" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 14 },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 18 },
  successCircle: { width: 96, height: 96, borderRadius: 999, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center", marginTop: 8 },
  successSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
});

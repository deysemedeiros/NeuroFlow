import { useRouter } from "expo-router";
import { ArrowRight, Search, Stethoscope } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/ScreenContainer";
import { SoftCard } from "@/components/SoftCard";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { fetchClinicos } from "@/lib/db";
import type { ClinicoItem } from "@/types";

const AVATAR_COLORS = [
  "#DDD0F0", "#BFE3E8", "#C9E8DC", "#F5DC8A", "#F5C0C0", "#C0D8F5",
];

function initials(nome: string): string {
  const parts = nome.replace(/^(Dr\.|Dra\.)?\s*/i, "").trim().split(" ");
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function avatarColorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!;
}

const FILTERS = ["Todos", "Psicólogo", "Psiquiatra", "Neurologista", "Neuropsicologia", "Infantil", "Adulto"];

export default function ProfissionaisScreen() {
  const colors = useColors();
  const router = useRouter();
  const { auth } = useAuth();

  const [clinicos, setClinicos] = useState<ClinicoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");

  const loadClinicos = useCallback(async () => {
    if (!auth) return;
    try {
      const data = await fetchClinicos();
      setClinicos(data);
    } catch {
      // graceful — empty list
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    loadClinicos();
  }, [loadClinicos]);

  const filtered = useMemo(() => {
    return clinicos.filter((c) => {
      const especialidade = c.especialidade?.toLowerCase() ?? "";
      const matchFilter = filter === "Todos" || especialidade.includes(filter.toLowerCase());
      const q = query.trim().toLowerCase();
      const matchQuery = !q || c.nome.toLowerCase().includes(q) || especialidade.includes(q);
      return matchFilter && matchQuery;
    });
  }, [clinicos, query, filter]);

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Profissionais disponíveis
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Encontre apoio com acolhimento e praticidade.
      </Text>

      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Search size={18} color={colors.mutedForeground} strokeWidth={1.8} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar profissional"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 14 }}
        contentContainerStyle={styles.chipRow}
      >
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={({ pressed }) => [
                styles.filterChip,
                {
                  backgroundColor: active ? colors.softPurple : colors.card,
                  borderColor: active ? colors.softPurple : colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: active ? "#fff" : colors.mutedForeground }]}>
                {f}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={{ marginTop: 18 }}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={colors.softPurple} />
          </View>
        ) : filtered.length === 0 ? (
          <SoftCard>
            <View style={styles.emptyBox}>
              <Stethoscope size={32} color={colors.mutedForeground} strokeWidth={1.5} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {clinicos.length === 0
                  ? "Nenhum profissional cadastrado ainda."
                  : "Nenhum profissional encontrado."}
              </Text>
            </View>
          </SoftCard>
        ) : (
          filtered.map((c) => (
            <SoftCard key={c.id} style={{ marginBottom: 14 }}>
              <View style={styles.cardHead}>
                <View style={[styles.avatar, { backgroundColor: avatarColorFromId(c.id) }]}>
                  {c.fotoUrl ? (
                    <Image source={{ uri: c.fotoUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{initials(c.nome)}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{c.nome}</Text>
                  <Text style={[styles.specialty, { color: colors.softPurple }]}>
                    {c.especialidade ?? "Profissional de saúde"}
                  </Text>
                </View>
              </View>

              {c.registroProfissional && (
                <Text style={[styles.registro, { color: colors.mutedForeground }]}>
                  Registro: {c.registroProfissional}
                </Text>
              )}

              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/agendar",
                    params: {
                      name: c.nome,
                      specialty: c.especialidade ?? "",
                      initials: initials(c.nome),
                      fotoUrl: c.fotoUrl ?? "",
                    },
                  })
                }
                style={({ pressed }) => [
                  styles.bookBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.bookText}>Agendar</Text>
                <ArrowRight size={16} color="#fff" strokeWidth={2} />
              </Pressable>
            </SoftCard>
          ))
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 6, marginBottom: 22 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, height: 50, borderRadius: 999, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  chipRow: { gap: 8, paddingRight: 22 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  loadingBox: { paddingVertical: 48, alignItems: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 24, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 999, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImage: { width: 48, height: 48, borderRadius: 999 },
  avatarText: { fontFamily: "Inter_600SemiBold", color: "#4A4660", fontSize: 14 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  specialty: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  registro: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 12 },
  bookBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 999, marginTop: 8 },
  bookText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 },
});

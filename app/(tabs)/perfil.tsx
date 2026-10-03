import { useRouter } from "expo-router";
import { ChevronRight, LogOut } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SoftCard } from "@/components/SoftCard";
import { WaveBackground } from "@/components/WaveBackground";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { fetchLinkedPacientes } from "@/lib/db";
import type { UsuarioProfile } from "@/types";

function calcAge(dob: string | null): string | null {
  if (!dob) return null;
  const years = Math.floor(
    (Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25),
  );
  return `${years} anos`;
}

function getInitials(nome: string): string {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const TIPO_LABEL: Record<string, string> = {
  Paciente: "Paciente",
  Responsavel: "Responsável",
  Clinico: "Clínico",
};

export default function PerfilTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { auth, logout } = useAuth();
  const router = useRouter();

  const [perfis, setPerfis] = useState<UsuarioProfile[]>([]);
  const [loadingPerfis, setLoadingPerfis] = useState(false);

  const fetchPerfis = useCallback(async () => {
    if (!auth || auth.usuario.tipoUsuario !== "Responsavel") return;
    setLoadingPerfis(true);
    try {
      const data = await fetchLinkedPacientes(auth.usuario.id);
      setPerfis(data);
    } catch {
      setPerfis([]);
    } finally {
      setLoadingPerfis(false);
    }
  }, [auth]);

  useEffect(() => {
    fetchPerfis();
  }, [fetchPerfis]);

  useEffect(() => {
    if (!auth) {
      router.replace("/login");
    }
  }, [auth, router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const usuario = auth?.usuario;
  const age = calcAge(usuario?.dataNascimento ?? null);

  if (!auth) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <WaveBackground />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 12, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Meu Perfil
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}
        showsVerticalScrollIndicator={false}
      >
        <SoftCard style={styles.mainCard} padding={0}>
          <View style={styles.mainCardInner}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.lilac }]}>
              {usuario?.fotoUrl ? (
                <Image
                  source={{ uri: usuario.fotoUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                  {usuario ? getInitials(usuario.nome) : "?"}
                </Text>
              )}
            </View>

            <Text style={[styles.userName, { color: colors.foreground }]}>
              {usuario?.nome ?? "—"}
            </Text>

            <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
              {usuario?.email ?? ""}
            </Text>

            <View style={styles.tagsRow}>
              <View style={[styles.tag, { backgroundColor: "#FFF1DD" }]}>
                <Text style={[styles.tagText, { color: "#B07A3A" }]}>
                  {usuario ? TIPO_LABEL[usuario.tipoUsuario] : "—"}
                </Text>
              </View>
            </View>

            {(usuario?.diagnostico || age) && (
              <View style={styles.tagsRow}>
                {age && (
                  <View style={[styles.tag, { backgroundColor: colors.aqua }]}>
                    <Text style={[styles.tagText, { color: colors.tint }]}>{age}</Text>
                  </View>
                )}
                {usuario?.diagnostico && (
                  <View style={[styles.tag, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.tagText, { color: colors.softPurple }]}>
                      {usuario.diagnostico}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </SoftCard>

        {(loadingPerfis || perfis.length > 0) && (
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Trocar de perfil
          </Text>
        )}

        {loadingPerfis ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.softPurple} />
          </View>
        ) : (
          perfis.map((p) => {
            const pAge = calcAge(p.dataNascimento ?? null);
            return (
              <SoftCard key={p.id} style={styles.switchCard} padding={16}>
                <View style={styles.switchCardInner}>
                  <View style={[styles.switchAvatar, { backgroundColor: colors.mint }]}>
                    <Text style={[styles.switchInitials, { color: colors.tint }]}>
                      {getInitials(p.nome)}
                    </Text>
                  </View>

                  <View style={styles.switchInfo}>
                    <Text style={[styles.switchName, { color: colors.foreground }]}>
                      {p.nome}
                    </Text>
                    <View style={styles.tagsRow}>
                      <View style={[styles.tagSmall, { backgroundColor: colors.mint }]}>
                        <Text style={[styles.tagTextSmall, { color: colors.tint }]}>
                          {TIPO_LABEL[p.tipoUsuario]}
                        </Text>
                      </View>
                    </View>
                    {(pAge || p.diagnostico) && (
                      <Text style={[styles.switchSubtitle, { color: colors.mutedForeground }]}>
                        {[pAge, p.diagnostico].filter(Boolean).join(" · ")}
                      </Text>
                    )}
                  </View>

                  <ChevronRight size={18} color={colors.mutedForeground} strokeWidth={1.8} />
                </View>
              </SoftCard>
            );
          })
        )}

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            {
              borderColor: "#FFCCCC",
              backgroundColor: pressed ? "#FFF0F0" : "#FFF5F5",
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <LogOut size={18} color="#C0392B" strokeWidth={1.8} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const webShadow = {
  boxShadow: "0 1px 2px rgba(124,106,174,0.04), 0 8px 24px rgba(124,106,174,0.07)",
} as unknown as object;

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1, position: "relative",
  },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  avatarIconBtn: {
    position: "absolute", right: 24, bottom: 14, width: 38, height: 38,
    borderRadius: 19, borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  scroll: { paddingHorizontal: 20, paddingTop: 24, gap: 16 },
  mainCard: { alignItems: "center", borderRadius: 26, overflow: "hidden" },
  mainCardInner: { alignItems: "center", paddingVertical: 32, paddingHorizontal: 24, gap: 10, width: "100%" },
  avatarCircle: { width: 140, height: 140, borderRadius: 70, alignItems: "center", justifyContent: "center", marginBottom: 8, overflow: "hidden" },
  avatarImage: { width: 140, height: 140, borderRadius: 70 },
  avatarInitials: { fontSize: 48, fontFamily: "Inter_700Bold" },
  userName: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  userEmail: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -4 },
  tagsRow: { flexDirection: "row", gap: 8, justifyContent: "center", flexWrap: "wrap" },
  tag: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999 },
  tagText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 8 },
  loadingRow: { alignItems: "center", paddingVertical: 20 },
  switchCard: { borderRadius: 20 },
  switchCardInner: { flexDirection: "row", alignItems: "center", gap: 14 },
  switchAvatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  switchAvatarImage: { width: 56, height: 56, borderRadius: 28 },
  switchInitials: { fontSize: 18, fontFamily: "Inter_700Bold" },
  switchInfo: { flex: 1, gap: 4 },
  switchName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  tagSmall: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, alignSelf: "flex-start" },
  tagTextSmall: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  switchSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderRadius: 20, borderWidth: 1.5, paddingVertical: 16, marginTop: 8,
  },
  logoutText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#C0392B" },
});

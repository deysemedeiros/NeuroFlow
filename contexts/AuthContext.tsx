import React, { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { AuthState, TipoUsuario, UsuarioProfile } from "@/types";

interface AuthContextValue {
  auth: AuthState | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  auth: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

async function fetchUsuarioProfile(
  userId: string,
  email: string,
): Promise<UsuarioProfile> {
  const { data: u, error } = await supabase
    .from("usuarios")
    .select("id, nome, data_nascimento, tipo_usuario, foto_url, status")
    .eq("id", userId)
    .single();

  if (error || !u) throw new Error("Perfil não encontrado");
  if (u.status === "pendente") throw new Error("conta_pendente");
  if (u.status === "rejeitado") throw new Error("conta_rejeitada");

  let diagnostico: string | null = null;
  let pontuacaoGame: number | null = null;

  if ((u.tipo_usuario as TipoUsuario) === "Paciente") {
    const { data: p } = await supabase
      .from("paciente")
      .select("diagnostico, pontuacao_game")
      .eq("id", userId)
      .single();
    diagnostico = p?.diagnostico ?? null;
    pontuacaoGame = p?.pontuacao_game ?? null;
  }

  return {
    id: u.id,
    nome: u.nome,
    email,
    dataNascimento: u.data_nascimento ?? null,
    tipoUsuario: u.tipo_usuario as TipoUsuario,
    diagnostico,
    pontuacaoGame,
    fotoUrl: u.foto_url ?? null,
    status: u.status ?? "ativo",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // O login explícito já carrega o perfil (ver `login`), então aqui só
      // tratamos sessão restaurada, refresh de token e logout.
      if (!session) {
        setAuth(null);
        setLoading(false);
        return;
      }
      if (event === "SIGNED_IN") {
        setLoading(false);
        return;
      }
      if (event === "TOKEN_REFRESHED") {
        setAuth((prev) =>
          prev ? { ...prev, token: session.access_token } : prev,
        );
        setLoading(false);
        return;
      }
      // INITIAL_SESSION / USER_UPDATED: carrega o perfil fora do callback
      // (a doc do Supabase recomenda não aguardar chamadas dentro dele).
      setTimeout(async () => {
        try {
          const usuario = await fetchUsuarioProfile(
            session.user.id,
            session.user.email ?? "",
          );
          setAuth({ token: session.access_token, usuario });
        } catch {
          await supabase.auth.signOut();
          setAuth(null);
        } finally {
          setLoading(false);
        }
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.message === "Invalid login credentials") {
        throw new Error("E-mail ou senha incorretos.");
      }
      if (error.message === "Email not confirmed") {
        throw new Error("Confirme seu e-mail antes de entrar.");
      }
      throw new Error(error.message);
    }

    try {
      const usuario = await fetchUsuarioProfile(
        data.user.id,
        data.user.email ?? email,
      );
      setAuth({ token: data.session.access_token, usuario });
    } catch (err) {
      // Conta pendente/rejeitada ou sem perfil: não deixa a sessão aberta.
      await supabase.auth.signOut();
      throw err;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

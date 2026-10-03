import { supabase } from "./supabase";
import type { ClinicoItem, DiarioEntry, PlanoItem, UsuarioProfile } from "@/types";

export async function fetchDiarioEntries(idPaciente: string): Promise<DiarioEntry[]> {
  const { data, error } = await supabase
    .from("diario_emocoes")
    .select("id, id_paciente, data_registro, sentimento, descricao")
    .eq("id_paciente", idPaciente)
    .order("data_registro", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id: r.id,
    idPaciente: r.id_paciente,
    dataRegistro: r.data_registro,
    sentimento: r.sentimento ?? null,
    descricao: r.descricao ?? null,
  }));
}

export async function insertDiarioEntry(
  idPaciente: string,
  sentimento: string,
): Promise<DiarioEntry> {
  const { data, error } = await supabase
    .from("diario_emocoes")
    .insert({ id_paciente: idPaciente, sentimento })
    .select("id, id_paciente, data_registro, sentimento, descricao")
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    idPaciente: data.id_paciente,
    dataRegistro: data.data_registro,
    sentimento: data.sentimento ?? null,
    descricao: data.descricao ?? null,
  };
}

export async function deleteDiarioEntry(id: number): Promise<void> {
  const { error } = await supabase
    .from("diario_emocoes")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function fetchPlanos(filter: {
  idPaciente?: string;
  idClinico?: string;
}): Promise<PlanoItem[]> {
  let query = supabase
    .from("plano_terapeutico")
    .select("id, id_clinico, id_paciente, objetivos, data_inicio, status");

  if (filter.idPaciente) query = query.eq("id_paciente", filter.idPaciente);
  if (filter.idClinico) query = query.eq("id_clinico", filter.idClinico);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id: r.id,
    idClinico: r.id_clinico,
    idPaciente: r.id_paciente,
    objetivos: r.objetivos ?? null,
    dataInicio: r.data_inicio ?? null,
    status: r.status ?? null,
  }));
}

export async function fetchClinicos(): Promise<ClinicoItem[]> {
  const { data, error } = await supabase
    .from("clinico")
    .select("id, especialidade, registro_profissional, usuarios(nome, email, foto_url)");

  if (error) throw new Error(error.message);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    nome: r.usuarios?.nome ?? "",
    email: r.usuarios?.email ?? "",
    especialidade: r.especialidade ?? null,
    registroProfissional: r.registro_profissional ?? null,
    fotoUrl: r.usuarios?.foto_url ?? null,
  }));
}

export async function fetchLinkedPacientes(
  idResponsavel: string,
): Promise<UsuarioProfile[]> {
  const { data, error } = await supabase
    .from("paciente")
    .select(
      "id, diagnostico, pontuacao_game, usuarios(nome, email, data_nascimento, tipo_usuario, foto_url)",
    )
    .eq("id_responsavel", idResponsavel);

  if (error) throw new Error(error.message);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    nome: r.usuarios?.nome ?? "",
    email: r.usuarios?.email ?? "",
    dataNascimento: r.usuarios?.data_nascimento ?? null,
    tipoUsuario: r.usuarios?.tipo_usuario ?? "Paciente",
    diagnostico: r.diagnostico ?? null,
    pontuacaoGame: r.pontuacao_game ?? null,
    fotoUrl: r.usuarios?.foto_url ?? null,
    status: (r.usuarios?.status ?? "ativo") as import("@/types").StatusUsuario,
  }));
}

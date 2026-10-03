export type TipoUsuario = "Paciente" | "Responsavel" | "Clinico";
export type StatusPlano = "Ativo" | "Concluído" | "Suspenso";
export type StatusUsuario = "pendente" | "ativo" | "rejeitado";

export interface UsuarioProfile {
  id: string;
  nome: string;
  email: string;
  dataNascimento: string | null;
  tipoUsuario: TipoUsuario;
  diagnostico: string | null;
  pontuacaoGame: number | null;
  fotoUrl: string | null;
  status: StatusUsuario;
}

export interface AuthState {
  token: string;
  usuario: UsuarioProfile;
}

export interface DiarioEntry {
  id: number;
  idPaciente: string;
  dataRegistro: string;
  sentimento: string | null;
  descricao: string | null;
}

export interface PlanoItem {
  id: number;
  idClinico: string;
  idPaciente: string;
  objetivos: string | null;
  dataInicio: string | null;
  status: StatusPlano | null;
}

export interface ClinicoItem {
  id: string;
  nome: string;
  email: string;
  especialidade: string | null;
  registroProfissional: string | null;
  fotoUrl: string | null;
}

import {
  StatusAgendamento,
  TipoAgendamento,
  StatusPlanoAcao,
  StatusPesquisaCliente,
  StatusDenuncia,
  TipoOrigemPlanoAcao,
} from "@prisma/client";

export type TipoParticipanteAgendamento = "INTERNO" | "CLIENTE" | "OUTRO";
export type OrigemParticipanteAgendamento =
  | "CLIENTE_MASTER"
  | "COLABORADOR"
  | "MANUAL";

export type ParticipanteAgendamento = {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  tipo?: TipoParticipanteAgendamento;
  origem?: OrigemParticipanteAgendamento;
  origemId?: string | null;
};

export type ParticipanteClienteDisponivel = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  origem: "CLIENTE_MASTER" | "COLABORADOR";
  descricao: string;
};

export type Agendamento = {
  id?: string;
  planoAcaoId?: string | null;
  titulo: string;
  descricao?: string | null;
  dataHora: Date | string;
  duracaoMin?: number;
  local?: string | null;
  linkReuniao?: string | null;
  tipo?: TipoAgendamento;
  status?: StatusAgendamento;
  participantes?: ParticipanteAgendamento[];
};

export type ClienteResumoAgendamento = {
  id: string;
  nome: string;
  empresa: string | null;
};

export type AgendamentoResumo = {
  id: string;
  planoAcaoId: string | null;
  titulo: string;
  descricao: string | null;
  dataHora: Date;
  duracaoMin: number;
  local: string | null;
  linkReuniao: string | null;
  tipo: TipoAgendamento;
  status: StatusAgendamento;
  participantes: ParticipanteAgendamento[];
  criadoEm: Date;
  atualizadoEm: Date;
  avisoEmail?: string | null;
  planoAcao?: {
    id: string;
    titulo: string;
    status: StatusPlanoAcao;
    tipoOrigem: TipoOrigemPlanoAcao;
    pesquisa: {
      id: string;
      titulo: string;
      status: StatusPesquisaCliente;
      cliente: ClienteResumoAgendamento;
    } | null;
    denuncia: {
      id: string;
      protocolo: string;
      status: StatusDenuncia;
      cliente: ClienteResumoAgendamento;
    } | null;
  } | null;
};

export type AgendamentoDetalhado = AgendamentoResumo;

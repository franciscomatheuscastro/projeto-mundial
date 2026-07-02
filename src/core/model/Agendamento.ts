import {
  StatusAgendamento,
  TipoAgendamento,
  StatusPlanoAcao,
  StatusPesquisaCliente,
} from "@prisma/client";

export type ParticipanteAgendamento = {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  tipo?: "INTERNO" | "CLIENTE" | "OUTRO";
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
  criadoEm?: Date;
  atualizadoEm?: Date;
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
  planoAcao?: {
    id: string;
    titulo: string;
    status: StatusPlanoAcao;
    pesquisa: {
      id: string;
      titulo: string;
      status: StatusPesquisaCliente;
      cliente: {
        id: string;
        nome: string;
        empresa: string | null;
      };
    };
  } | null;
};

export type AgendamentoDetalhado = AgendamentoResumo;
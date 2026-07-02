import { StatusPlanoAcao, StatusPesquisaCliente } from "@prisma/client";

export type AcaoPlanoAcao = {
  id: string;
  titulo: string;
  descricao?: string | null;
  responsavel?: string | null;
  prioridade: "BAIXA" | "MEDIA" | "ALTA";
  prazo?: string | null;
  status: "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA";
};

export type PlanoAcao = {
  id?: string;
  pesquisaId: string;
  titulo: string;
  diagnostico?: string | null;
  objetivo?: string | null;
  conclusao?: string | null;
  status?: StatusPlanoAcao;
  acoes?: AcaoPlanoAcao[];
  criadoEm?: Date;
  atualizadoEm?: Date;
};

export type PlanoAcaoResumo = {
  id: string;
  pesquisaId: string;
  titulo: string;
  diagnostico: string | null;
  objetivo: string | null;
  conclusao: string | null;
  status: StatusPlanoAcao;
  criadoEm: Date;
  atualizadoEm: Date;
  totalAcoes: number;
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
};

export type PlanoAcaoDetalhado = PlanoAcaoResumo & {
  acoes: AcaoPlanoAcao[];
};
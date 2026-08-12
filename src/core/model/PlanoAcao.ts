import {
  GravidadeDenuncia,
  StatusDenuncia,
  StatusPlanoAcao,
  StatusPesquisaCliente,
  TipoModuloPesquisa,
  TipoOrigemPlanoAcao,
} from "@prisma/client";

export type PrioridadeAcao =
  | "BAIXA"
  | "MEDIA"
  | "ALTA";

export type StatusAcao =
  | "PENDENTE"
  | "EM_ANDAMENTO"
  | "CONCLUIDA";

export type AcaoPlanoAcao = {
  id: string;
  titulo: string;

  descricao?: string | null;
  responsavel?: string | null;

  prioridade: PrioridadeAcao;

  prazo?: string | null;

  status: StatusAcao;
};

export type PlanoAcao = {
  id?: string;

  tipoOrigem: TipoOrigemPlanoAcao;

  pesquisaId?: string | null;
  denunciaId?: string | null;

  titulo: string;

  diagnostico?: string | null;
  objetivo?: string | null;
  conclusao?: string | null;

  status?: StatusPlanoAcao;

  acoes?: AcaoPlanoAcao[];

  criadoEm?: Date;
  atualizadoEm?: Date;
};

export type PesquisaPlanoAcaoResumo = {
  id: string;

  titulo: string;

  status: StatusPesquisaCliente;

  tipo: TipoModuloPesquisa;

  cliente: {
    id: string;

    nome: string;

    empresa: string | null;
  };
};

export type DenunciaPlanoAcaoResumo = {
  id: string;

  protocolo: string;

  titulo: string;

  status: StatusDenuncia;

  gravidade: GravidadeDenuncia;

  cliente: {
    id: string;

    nome: string;

    empresa: string | null;
  };
};

export type PlanoAcaoResumo = {
  id: string;

  tipoOrigem: TipoOrigemPlanoAcao;

  pesquisaId: string | null;

  denunciaId: string | null;

  titulo: string;

  diagnostico: string | null;

  objetivo: string | null;

  conclusao: string | null;

  status: StatusPlanoAcao;

  criadoEm: Date;

  atualizadoEm: Date;

  totalAcoes: number;

  pesquisa: PesquisaPlanoAcaoResumo | null;

  denuncia: DenunciaPlanoAcaoResumo | null;
};

export type PlanoAcaoDetalhado =
  PlanoAcaoResumo & {
    acoes: AcaoPlanoAcao[];
  };

export function obterClientePlano(
  plano: PlanoAcaoResumo
) {
  if (
    plano.tipoOrigem ===
    TipoOrigemPlanoAcao.DENUNCIA
  ) {
    return (
      plano.denuncia?.cliente ??
      null
    );
  }

  return (
    plano.pesquisa?.cliente ??
    null
  );
}

export function obterOrigemPlano(
  plano: PlanoAcaoResumo
) {
  if (
    plano.tipoOrigem ===
      TipoOrigemPlanoAcao.DENUNCIA &&
    plano.denuncia
  ) {
    return {
      tipo:
        TipoOrigemPlanoAcao.DENUNCIA,

      titulo:
        plano.denuncia.titulo,

      identificador:
        plano.denuncia.protocolo,
    };
  }

  if (
    plano.pesquisa
  ) {
    return {
      tipo:
        plano.tipoOrigem,

      titulo:
        plano.pesquisa.titulo,

      identificador:
        plano.pesquisa.id,
    };
  }

  return null;
}
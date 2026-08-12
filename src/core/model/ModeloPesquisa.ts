import {
  TipoModuloPesquisa,
  TipoPergunta,
} from "@prisma/client";

export type PerguntaModelo = {
  id: string;
  titulo: string;
  descricao?: string | null;
  tipo: TipoPergunta;
  ordem: number;
  obrigatoria: boolean;
  opcoes: string[];
};

export type ModeloPesquisa = {
  id?: string;
  titulo: string;
  descricao?: string | null;

  tipo?: TipoModuloPesquisa;

  ativo?: boolean;
  modeloPadrao?: boolean;

  perguntas: PerguntaModelo[];

  criadoEm?: Date;
  atualizadoEm?: Date;
};

export type ModeloPesquisaComResumo =
  ModeloPesquisa & {
    id: string;
    tipo: TipoModuloPesquisa;

    totalPerguntas: number;
    totalPesquisas: number;
  };

export type ModeloPesquisaDetalhado =
  ModeloPesquisa & {
    id: string;
    tipo: TipoModuloPesquisa;
  };
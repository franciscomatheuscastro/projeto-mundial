import {
  TipoModuloPesquisa,
  TipoPergunta,
} from "@prisma/client";


export type SentidoPontuacao =
  | "POSITIVO"
  | "NEGATIVO";


export type MetodoAnalise =
  | "FAVORABILIDADE"
  | "DESEMPENHO"
  | "RISCO_PSICOSSOCIAL";


export type DimensaoModelo = {
  id: string;
  nome: string;
  descricao?: string | null;
  ordem: number;
  peso: number;
  fatorRisco?: string | null;
};


export type FaixaInterpretacaoModelo = {
  id: string;
  nome: string;
  minimo: number;
  maximo: number;
  classificacao: string;
  ordem: number;
};


export type ConfiguracaoAnaliseModelo = {
  metodo: MetodoAnalise;
  escalaMinima: number;
  escalaMaxima: number;
  favoravel: number[];
  neutro: number[];
  desfavoravel: number[];
  faixas: FaixaInterpretacaoModelo[];
};


export type PerguntaModelo = {
  id: string;
  titulo: string;
  descricao?: string | null;
  tipo: TipoPergunta;
  ordem: number;
  obrigatoria: boolean;
  opcoes: string[];
  dimensaoId?: string | null;
  sentidoPontuacao: SentidoPontuacao;
};


export type ModeloPesquisa = {
  id?: string;
  titulo: string;
  descricao?: string | null;
  tipo?: TipoModuloPesquisa;
  ativo?: boolean;
  modeloPadrao?: boolean;
  perguntas: PerguntaModelo[];
  dimensoes: DimensaoModelo[];
  configuracaoAnalise: ConfiguracaoAnaliseModelo;
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


export function criarConfiguracaoAnalisePadrao(
  tipo: TipoModuloPesquisa
): ConfiguracaoAnaliseModelo {
  if (
    tipo ===
    TipoModuloPesquisa.CLIMA
  ) {
    return {
      metodo: "FAVORABILIDADE",
      escalaMinima: 1,
      escalaMaxima: 5,
      favoravel: [4, 5],
      neutro: [3],
      desfavoravel: [1, 2],
      faixas: [],
    };
  }


  if (
    tipo ===
    TipoModuloPesquisa.AVALIACAO_DESEMPENHO
  ) {
    return {
      metodo: "DESEMPENHO",
      escalaMinima: 1,
      escalaMaxima: 5,
      favoravel: [],
      neutro: [],
      desfavoravel: [],
      faixas: [],
    };
  }


  return {
    metodo: "RISCO_PSICOSSOCIAL",
    escalaMinima: 1,
    escalaMaxima: 5,
    favoravel: [],
    neutro: [],
    desfavoravel: [],
    faixas: [],
  };
}

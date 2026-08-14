import {
  TipoModuloPesquisa,
  TipoPergunta,
} from "@prisma/client";


export type SentidoPontuacao =
  | "POSITIVO"
  | "NEGATIVO";


export type MetodoAnalise =
  | "FAVORABILIDADE"
  | "MATURIDADE"
  | "RISCO_PSICOSSOCIAL";


export type DimensaoModelo = {
  id: string;

  nome: string;

  descricao?: string | null;

  ordem: number;

  peso: number;

  /*
   * Mais utilizado no módulo psicossocial.
   * Pode ficar nulo nos demais.
   */
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

  /*
   * Quantidade mínima de respostas para permitir
   * um recorte por unidade/setor/cargo.
   */
  anonimatoMinimo: number;

  /*
   * Utilizados principalmente em Pesquisa de Clima.
   */
  favoravel: number[];

  neutro: number[];

  desfavoravel: number[];

  /*
   * Utilizado principalmente por Diagnóstico
   * e Avaliação Psicossocial.
   *
   * Não definimos faixas psicossociais automaticamente:
   * elas devem ser cadastradas conforme a metodologia
   * efetivamente utilizada.
   */
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

  /*
   * Estrutura analítica.
   */
  dimensaoId?: string | null;

  peso: number;

  /*
   * POSITIVO:
   * nota maior = resultado melhor.
   *
   * NEGATIVO:
   * nota maior = resultado pior e deverá ser
   * invertida pelo motor analítico.
   */
  sentidoPontuacao: SentidoPontuacao;

  /*
   * Opcional.
   * Útil principalmente no Psicossocial.
   */
  fatorRisco?: string | null;
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
      metodo:
        "FAVORABILIDADE",

      escalaMinima:
        1,

      escalaMaxima:
        5,

      anonimatoMinimo:
        5,

      favoravel: [
        4,
        5,
      ],

      neutro: [
        3,
      ],

      desfavoravel: [
        1,
        2,
      ],

      faixas: [],
    };
  }


  if (
    tipo ===
    TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL
  ) {
    return {
      metodo:
        "MATURIDADE",

      escalaMinima:
        1,

      escalaMaxima:
        5,

      anonimatoMinimo:
        5,

      favoravel: [],

      neutro: [],

      desfavoravel: [],

      faixas: [],
    };
  }


  return {
    metodo:
      "RISCO_PSICOSSOCIAL",

    escalaMinima:
      1,

    escalaMaxima:
      5,

    anonimatoMinimo:
      5,

    favoravel: [],

    neutro: [],

    desfavoravel: [],

    /*
     * Intencionalmente vazio.
     *
     * O sistema não deve inventar critérios
     * psicossociais. As faixas deverão ser
     * cadastradas conforme o instrumento.
     */
    faixas: [],
  };
}
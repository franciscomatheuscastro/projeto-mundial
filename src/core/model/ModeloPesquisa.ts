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

  /*
   * Peso analítico da dimensão.
   *
   * Exemplo:
   * Liderança = 2
   * Comunicação = 1
   *
   * Liderança terá o dobro da influência
   * no resultado consolidado.
   */
  peso: number;

  /*
   * Principalmente utilizado
   * em Avaliação Psicossocial.
   *
   * Exemplo:
   * Dimensão: Demandas
   * Fator de risco: Sobrecarga de trabalho
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

  /*
   * Escala utilizada nas perguntas NOTA.
   *
   * Exemplo:
   * 1 até 5
   */
  escalaMinima: number;

  escalaMaxima: number;


  /*
   * Utilizado principalmente
   * em Pesquisa de Clima.
   */
  favoravel: number[];

  neutro: number[];

  desfavoravel: number[];


  /*
   * Utilizado principalmente por
   * Diagnóstico Organizacional
   * e Avaliação Psicossocial.
   *
   * Exemplo:
   *
   * 0-39   -> CRITICO
   * 40-59  -> BAIXO
   * 60-74  -> MODERADO
   * 75-89  -> ALTO
   * 90-100 -> EXCELENCIA
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

  /*
   * Somente utilizado quando:
   *
   * tipo === MULTIPLA_ESCOLHA
   */
  opcoes: string[];


  /*
   * Dimensão analítica à qual
   * a pergunta pertence.
   */
  dimensaoId?: string | null;


  /*
   * POSITIVO:
   * nota maior = resultado melhor.
   *
   * NEGATIVO:
   * nota maior = resultado pior.
   *
   * O motor analítico fará a inversão
   * quando necessário.
   */
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
      metodo:
        "FAVORABILIDADE",

      escalaMinima:
        1,

      escalaMaxima:
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

    favoravel: [],

    neutro: [],

    desfavoravel: [],

    /*
     * Não criamos classificações
     * psicossociais automaticamente.
     *
     * Elas devem seguir a metodologia
     * utilizada pela Mundial.
     */
    faixas: [],
  };
}
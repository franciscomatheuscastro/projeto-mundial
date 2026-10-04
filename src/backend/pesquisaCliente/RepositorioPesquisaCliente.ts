import {
  randomUUID,
} from "crypto";

import {
  Prisma,
  StatusPesquisaCliente,
  TipoModuloPesquisa,
  TipoPergunta,
} from "@prisma/client";

import {
  prisma,
} from "@/src/lib/prisma";

import {
  ConfiguracaoAnaliseModelo,
  criarConfiguracaoAnalisePadrao,
  DimensaoModelo,
  FaixaInterpretacaoModelo,
} from "@/src/core/model/ModeloPesquisa";

import {
  PerguntaPesquisaCliente,
  PesquisaCliente,
  RespostaPesquisaCliente,
  RespostaPesquisaItem,
} from "@/src/core/model/PesquisaCliente";


/* =========================================================
 * TIPOS INTERNOS DOS MOTORES ANALÍTICOS
 * ======================================================= */

type ClassificacaoFavorabilidade =
  | "FAVORAVEL"
  | "NEUTRO"
  | "DESFAVORAVEL";


type AcumuladorClima = {
  id: string;
  nome: string;

  pesoDimensao: number;

  favoravel: number;
  neutro: number;
  desfavoravel: number;

  totalRespostas: number;
};



type DimensaoClimaSetor = {
  id: string;
  nome: string;
  totalRespostas: number;
  favoravel: number;
  neutro: number;
  desfavoravel: number;
};


type AnaliseClimaSetor = {
  setor: string;
  totalPesquisas: number;
  totalRespostas: number;
  indiceGeralClima: number | null;
  dimensoes: DimensaoClimaSetor[];
};


type AcumuladorScore = {
  id: string;
  nome: string;
  fatorRisco: string | null;

  pesoDimensao: number;

  soma: number;
  quantidade: number;

  totalRespostas: number;

  respondentes: Set<string>;
};


type DistribuicaoInformacaoAdicional = {
  valor: string;
  quantidade: number;
  percentual: number;
};


type InformacaoAdicionalRelatorio = {
  id: string;

  perguntaId: string;

  titulo: string;

  descricao: string | null;

  tipo: TipoPergunta;

  dimensao: {
    id: string;
    nome: string;
  } | null;

  totalRespostas: number;

  distribuicao: DistribuicaoInformacaoAdicional[];

  respostasTexto: string[];
};


type AcumuladorInformacaoAdicional = {
  id: string;

  perguntaId: string;

  titulo: string;

  descricao: string | null;

  tipo: TipoPergunta;

  dimensao: {
    id: string;
    nome: string;
  } | null;

  totalRespostas: number;

  distribuicao: Map<
    string,
    {
      valor: string;
      quantidade: number;
    }
  >;

  respostasTexto: string[];
};


type CelulaHeatmapPsicossocial = {
  fator: string;
  score: number | null;
  classificacao: string | null;
};


type LinhaHeatmapPsicossocial = {
  setor: string;
  totalRespondentes: number;
  fatores: CelulaHeatmapPsicossocial[];
};


type HeatmapPsicossocial = {
  fatores: string[];
  setores: LinhaHeatmapPsicossocial[];
};


const MINIMO_RESPOSTAS_FILTRO_SETOR =
  5;


type SetorRelatorioCliente = {
  nome: string;
  disponivel: boolean;
};


type MetodologiaAplicacaoRelatorio = {
  modeloId: string;
  modeloTitulo: string;
  metodo: ConfiguracaoAnaliseModelo["metodo"];
  escalaMinima: number;
  escalaMaxima: number;
  favoravel: number[];
  neutro: number[];
  desfavoravel: number[];
  faixas: FaixaInterpretacaoModelo[];
  dimensoes: {
    id: string;
    nome: string;
    peso: number;
    fatorRisco: string | null;
  }[];
  perguntasNota: number;
  perguntasInvertidas: number;
};


/* =========================================================
 * NORMALIZAÇÃO
 * ======================================================= */

function numeroSeguro(
  valor: unknown,
  padrao: number
) {
  const numero =
    Number(valor);

  return Number.isFinite(
    numero
  )
    ? numero
    : padrao;
}


function limitar(
  valor: number,
  minimo: number,
  maximo: number
) {
  return Math.min(
    maximo,
    Math.max(
      minimo,
      valor
    )
  );
}


function chaveTexto(
  valor: string
) {
  return valor
    .trim()
    .toLocaleLowerCase(
      "pt-BR"
    );
}


function normalizarSetoresCliente(
  valor: unknown
): string[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  const mapa =
    new Map<string, string>();

  for (const item of valor) {
    const nome =
      String(item ?? "").trim();

    if (!nome) {
      continue;
    }

    const chave =
      nome
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR");

    if (!mapa.has(chave)) {
      mapa.set(chave, nome);
    }
  }

  return Array.from(
    mapa.values()
  ).sort(
    (a, b) =>
      a.localeCompare(b, "pt-BR")
  );
}


function normalizarChaveSetor(
  valor: unknown
) {
  return String(
    valor ??
    ""
  )
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLocaleLowerCase(
      "pt-BR"
    );
}


function listarSetoresRelatorio(
  pesquisasBanco: any[],
  tipo: TipoModuloPesquisa
): string[] {
  const mapa =
    new Map<
      string,
      string
    >();


  const adicionar = (
    valor: unknown
  ) => {
    const nome =
      String(
        valor ??
        ""
      ).trim();


    if (
      !nome
    ) {
      return;
    }


    const chave =
      normalizarChaveSetor(
        nome
      );


    if (
      !chave ||
      mapa.has(
        chave
      )
    ) {
      return;
    }


    mapa.set(
      chave,
      nome
    );
  };


  for (
    const pesquisa
    of pesquisasBanco
  ) {
    if (
      tipo ===
      TipoModuloPesquisa.CLIMA
    ) {
      adicionar(
        pesquisa.setor
      );

      continue;
    }


    for (
      const resposta
      of pesquisa.respostas ||
      []
    ) {
      adicionar(
        resposta.setor
      );
    }
  }


  return Array.from(
    mapa.values()
  ).sort(
    (
      a,
      b
    ) =>
      a.localeCompare(
        b,
        "pt-BR"
      )
  );
}


function contarRespostasPorSetor(
  pesquisasBanco: any[],
  tipo: TipoModuloPesquisa
): Map<string, number> {
  const mapa =
    new Map<
      string,
      number
    >();


  const adicionar = (
    setor: unknown,
    quantidade = 1
  ) => {
    const chave =
      normalizarChaveSetor(
        setor
      );


    if (
      !chave ||
      quantidade <=
        0
    ) {
      return;
    }


    mapa.set(
      chave,
      (
        mapa.get(
          chave
        ) ||
        0
      ) +
      quantidade
    );
  };


  for (
    const pesquisa
    of pesquisasBanco
  ) {
    if (
      tipo ===
      TipoModuloPesquisa.CLIMA
    ) {
      adicionar(
        pesquisa.setor,
        (
          pesquisa.respostas ||
          []
        ).length
      );

      continue;
    }


    for (
      const resposta
      of pesquisa.respostas ||
      []
    ) {
      adicionar(
        resposta.setor,
        1
      );
    }
  }


  return mapa;
}


function filtrarPesquisasPorSetor(
  pesquisasBanco: any[],
  tipo: TipoModuloPesquisa,
  setor?: string
) {
  const chaveFiltro =
    normalizarChaveSetor(
      setor
    );


  if (
    !chaveFiltro
  ) {
    return pesquisasBanco;
  }


  /*
   * CLIMA:
   * o setor pertence à própria aplicação.
   */
  if (
    tipo ===
    TipoModuloPesquisa.CLIMA
  ) {
    return pesquisasBanco.filter(
      pesquisa =>
        normalizarChaveSetor(
          pesquisa.setor
        ) ===
        chaveFiltro
    );
  }


  /*
   * DESEMPENHO / PSICOSSOCIAL:
   * o setor pertence à resposta.
   *
   * Mantemos somente as respostas do setor selecionado
   * e descartamos aplicações que ficaram sem respostas
   * após o recorte.
   */
  return pesquisasBanco
    .map(
      pesquisa => ({
        ...pesquisa,

        respostas:
          (
            pesquisa.respostas ||
            []
          ).filter(
            (
              resposta: any
            ) =>
              normalizarChaveSetor(
                resposta.setor
              ) ===
              chaveFiltro
          ),
      })
    )
    .filter(
      pesquisa =>
        pesquisa.respostas.length >
        0
    );
}


function resolverSetorAplicacao(
  valor: unknown,
  setoresCliente: unknown
): string | null {
  const setorInformado =
    String(
      valor ??
      ""
    ).trim();


  /*
   * Sem setor significa aplicação
   * para toda a empresa.
   */
  if (
    !setorInformado
  ) {
    return null;
  }


  const setores =
    normalizarSetoresCliente(
      setoresCliente
    );


  const normalizarChave = (
    texto: string
  ) =>
    texto
      .normalize(
        "NFD"
      )
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .trim()
      .toLocaleLowerCase(
        "pt-BR"
      );


  const chaveInformada =
    normalizarChave(
      setorInformado
    );


  const setorEncontrado =
    setores.find(
      setor =>
        normalizarChave(
          setor
        ) ===
        chaveInformada
    );


  if (
    !setorEncontrado
  ) {
    throw new Error(
      "O setor selecionado não pertence ao cliente."
    );
  }


  /*
   * Retorna exatamente o nome cadastrado
   * no cliente, preservando acentuação
   * e capitalização.
   */
  return setorEncontrado;
}


/* =========================================================
 * NORMALIZAÇÃO DAS DIMENSÕES
 * ======================================================= */

function normalizarDimensoes(
  dimensoes: unknown
): DimensaoModelo[] {
  if (
    !Array.isArray(
      dimensoes
    )
  ) {
    return [];
  }


  return dimensoes
    .map(
      (
        dimensao,
        index
      ) => {
        const item =
          dimensao as Partial<DimensaoModelo>;


        return {
          id:
            item.id ||
            randomUUID(),

          nome:
            item.nome?.trim() ||
            `Dimensão ${index + 1}`,

          descricao:
            item.descricao?.trim() ||
            null,

          ordem:
            item.ordem ||
            index + 1,

          peso:
            Math.max(
              0,
              numeroSeguro(
                item.peso,
                1
              )
            ),

          fatorRisco:
            item.fatorRisco?.trim() ||
            null,
        };
      }
    )
    .sort(
      (
        a,
        b
      ) =>
        a.ordem -
        b.ordem
    );
}


function normalizarFaixas(
  faixas: unknown
): FaixaInterpretacaoModelo[] {
  if (
    !Array.isArray(
      faixas
    )
  ) {
    return [];
  }


  return faixas
    .map(
      (
        faixa,
        index
      ) => {
        const item =
          faixa as Partial<FaixaInterpretacaoModelo>;


        return {
          id:
            item.id ||
            randomUUID(),

          nome:
            item.nome?.trim() ||
            item.classificacao?.trim() ||
            `Faixa ${index + 1}`,

          minimo:
            numeroSeguro(
              item.minimo,
              0
            ),

          maximo:
            numeroSeguro(
              item.maximo,
              100
            ),

          classificacao:
            item.classificacao?.trim() ||
            `FAIXA_${index + 1}`,

          ordem:
            item.ordem ||
            index + 1,
        };
      }
    )
    .sort(
      (
        a,
        b
      ) =>
        a.ordem -
        b.ordem
    );
}


function normalizarArrayNumerico(
  valor: unknown
): number[] {
  if (
    !Array.isArray(
      valor
    )
  ) {
    return [];
  }


  return valor
    .map(
      item =>
        Number(
          item
        )
    )
    .filter(
      item =>
        Number.isFinite(
          item
        )
    );
}


function normalizarConfiguracaoAnalise(
  configuracao: unknown,
  tipo: TipoModuloPesquisa
): ConfiguracaoAnaliseModelo {
  const padrao =
    criarConfiguracaoAnalisePadrao(
      tipo
    );


  if (
    !configuracao ||
    typeof configuracao !==
      "object" ||
    Array.isArray(
      configuracao
    )
  ) {
    return {
      ...padrao,

      /*
       * O anonimato mínimo deixou de fazer parte
       * da regra analítica. Mantemos qualquer campo
       * legado apenas fora da lógica deste repositório.
       */
    } as ConfiguracaoAnaliseModelo;
  }


  const item =
    configuracao as Partial<ConfiguracaoAnaliseModelo>;


  return {
    metodo:
      tipo ===
      TipoModuloPesquisa.CLIMA
        ? "FAVORABILIDADE"
        : tipo ===
            TipoModuloPesquisa.AVALIACAO_DESEMPENHO
          ? "DESEMPENHO"
          : "RISCO_PSICOSSOCIAL",

    escalaMinima:
      numeroSeguro(
        item.escalaMinima,
        padrao.escalaMinima
      ),

    escalaMaxima:
      numeroSeguro(
        item.escalaMaxima,
        padrao.escalaMaxima
      ),

    favoravel:
      tipo ===
      TipoModuloPesquisa.CLIMA
        ? normalizarArrayNumerico(
            item.favoravel
          )
        : [],

    neutro:
      tipo ===
      TipoModuloPesquisa.CLIMA
        ? normalizarArrayNumerico(
            item.neutro
          )
        : [],

    desfavoravel:
      tipo ===
      TipoModuloPesquisa.CLIMA
        ? normalizarArrayNumerico(
            item.desfavoravel
          )
        : [],

    faixas:
      normalizarFaixas(
        item.faixas
      ),
  } as ConfiguracaoAnaliseModelo;
}


function normalizarPerguntas(
  perguntas: unknown,
  dimensoes: DimensaoModelo[] = []
): PerguntaPesquisaCliente[] {
  if (
    !Array.isArray(
      perguntas
    )
  ) {
    return [];
  }


  const idsDimensoes =
    new Set(
      dimensoes.map(
        dimensao =>
          dimensao.id
      )
    );


  return perguntas.map(
    (
      pergunta,
      index
    ) => {
      const item =
        pergunta as Partial<PerguntaPesquisaCliente>;


      const dimensaoId =
        item.dimensaoId &&
        (
          dimensoes.length ===
            0 ||
          idsDimensoes.has(
            item.dimensaoId
          )
        )
          ? item.dimensaoId
          : null;


      const tipo =
        item.tipo ||
        TipoPergunta.NOTA;


      return {
        id:
          item.id ||
          randomUUID(),

        titulo:
          item.titulo?.trim() ||
          "Nova pergunta",

        descricao:
          item.descricao?.trim() ||
          null,

        tipo,

        ordem:
          item.ordem ||
          index + 1,

        obrigatoria:
          item.obrigatoria ??
          true,

        /*
         * Opções só fazem sentido para
         * perguntas de múltipla escolha.
         */
        opcoes:
          tipo ===
            TipoPergunta.MULTIPLA_ESCOLHA &&
          Array.isArray(
            item.opcoes
          )
            ? item.opcoes
                .map(
                  opcao =>
                    String(
                      opcao
                    ).trim()
                )
                .filter(
                  Boolean
                )
            : [],

        dimensaoId,

        /*
         * A orientação continua pertencendo à pergunta,
         * pois uma afirmação pode ser positiva ou negativa.
         */
        sentidoPontuacao:
          item.sentidoPontuacao ===
          "NEGATIVO"
            ? "NEGATIVO"
            : "POSITIVO",
      } as PerguntaPesquisaCliente;
    }
  );
}


function normalizarRespostas(
  respostas: unknown
): RespostaPesquisaItem[] {
  if (
    !Array.isArray(
      respostas
    )
  ) {
    return [];
  }


  return respostas.map(
    resposta => {
      const item =
        resposta as Partial<RespostaPesquisaItem>;


      return {
        id:
          item.id ||
          randomUUID(),

        perguntaId:
          item.perguntaId ||
          "",

        valor:
          String(
            item.valor ??
            ""
          ).trim(),
      };
    }
  );
}


function criarDataInicio(
  data?: string
): Date | undefined {
  if (
    !data
  ) {
    return undefined;
  }


  const resultado =
    new Date(
      `${data}T00:00:00-03:00`
    );


  return Number.isNaN(
    resultado.getTime()
  )
    ? undefined
    : resultado;
}


function criarDataFim(
  data?: string
): Date | undefined {
  if (
    !data
  ) {
    return undefined;
  }


  const resultado =
    new Date(
      `${data}T23:59:59.999-03:00`
    );


  return Number.isNaN(
    resultado.getTime()
  )
    ? undefined
    : resultado;
}


/* =========================================================
 * FUNÇÕES DE CÁLCULO
 * ======================================================= */

/*
 * Converte uma nota da escala original para 0–100.
 *
 * 1 em escala 1–5 = 0
 * 3 = 50
 * 5 = 100
 */
function normalizarNotaPercentual(
  valor: number,
  escalaMinima: number,
  escalaMaxima: number
) {
  if (
    escalaMaxima <=
    escalaMinima
  ) {
    return 0;
  }


  const nota =
    limitar(
      valor,
      escalaMinima,
      escalaMaxima
    );


  return (
    (
      nota -
      escalaMinima
    ) /
    (
      escalaMaxima -
      escalaMinima
    )
  ) * 100;
}


/*
 * Inverte a nota dentro da própria escala.
 *
 * Exemplo 1–5:
 *
 * 1 -> 5
 * 2 -> 4
 * 3 -> 3
 * 4 -> 2
 * 5 -> 1
 */
function inverterNota(
  valor: number,
  minimo: number,
  maximo: number
) {
  return (
    minimo +
    maximo -
    valor
  );
}


/*
 * Para CLIMA e DIAGNÓSTICO:
 * quanto maior o resultado final, melhor.
 */
function notaOrientadaPositivamente(
  valor: number,
  pergunta: PerguntaPesquisaCliente,
  configuracao: ConfiguracaoAnaliseModelo
) {
  if (
    pergunta.sentidoPontuacao ===
    "NEGATIVO"
  ) {
    return inverterNota(
      valor,
      configuracao.escalaMinima,
      configuracao.escalaMaxima
    );
  }


  return valor;
}


/*
 * Para PSICOSSOCIAL:
 * quanto maior o resultado final, maior a exposição.
 *
 * Pergunta negativa:
 * "Tenho volume excessivo de trabalho."
 * nota alta = maior risco.
 *
 * Pergunta positiva:
 * "Recebo apoio da liderança."
 * nota alta = menor risco.
 * Logo precisa ser invertida.
 */
function notaOrientadaParaRisco(
  valor: number,
  pergunta: PerguntaPesquisaCliente,
  configuracao: ConfiguracaoAnaliseModelo
) {
  if (
    pergunta.sentidoPontuacao ===
    "POSITIVO"
  ) {
    return inverterNota(
      valor,
      configuracao.escalaMinima,
      configuracao.escalaMaxima
    );
  }


  return valor;
}


function encontrarFaixa(
  score: number,
  faixas: FaixaInterpretacaoModelo[]
) {
  const encontrada =
    faixas.find(
      faixa =>
        score >=
          faixa.minimo &&
        score <=
          faixa.maximo
    );


  return encontrada
    ? {
        nome:
          encontrada.nome,

        classificacao:
          encontrada.classificacao,
      }
    : null;
}


function assinaturaFaixas(
  faixas: FaixaInterpretacaoModelo[]
) {
  return JSON.stringify(
    [...faixas]
      .sort(
        (
          a,
          b
        ) =>
          a.ordem -
          b.ordem
      )
      .map(
        faixa => ({
          minimo:
            faixa.minimo,

          maximo:
            faixa.maximo,

          classificacao:
            faixa.classificacao,
        })
      )
  );
}


/*
 * Só usamos faixas no consolidado se todas as
 * aplicações estiverem usando exatamente as mesmas.
 *
 * Isso evita comparar/classificar instrumentos
 * metodologicamente diferentes como se fossem iguais.
 */
function obterFaixasCompativeis(
  pesquisasBanco: any[]
): FaixaInterpretacaoModelo[] {
  if (
    pesquisasBanco.length ===
    0
  ) {
    return [];
  }


  const configuracoes =
    pesquisasBanco.map(
      pesquisa =>
        normalizarConfiguracaoAnalise(
          pesquisa.configuracaoAnalise,
          pesquisa.tipo
        )
    );


  const primeira =
    configuracoes[0]
      .faixas;


  if (
    primeira.length ===
    0
  ) {
    return [];
  }


  const assinatura =
    assinaturaFaixas(
      primeira
    );


  const todasCompativeis =
    configuracoes.every(
      configuracao =>
        assinaturaFaixas(
          configuracao.faixas
        ) ===
        assinatura
    );


  return todasCompativeis
    ? primeira
    : [];
}



/* =========================================================
 * TRANSPARÊNCIA METODOLÓGICA
 * ======================================================= */

function montarMetodologiaAplicacao(
  pesquisa: any
): MetodologiaAplicacaoRelatorio {
  const dimensoes =
    normalizarDimensoes(
      pesquisa.dimensoes
    );

  const perguntas =
    normalizarPerguntas(
      pesquisa.perguntas,
      dimensoes
    );

  const configuracao =
    normalizarConfiguracaoAnalise(
      pesquisa.configuracaoAnalise,
      pesquisa.tipo
    );

  const perguntasNota =
    perguntas.filter(
      pergunta =>
        pergunta.tipo ===
        TipoPergunta.NOTA
    );

  /*
   * CLIMA / DESEMPENHO:
   * NEGATIVO é invertido para orientar o resultado positivamente.
   *
   * PSICOSSOCIAL:
   * POSITIVO é invertido para orientar o resultado para risco.
   */
  const perguntasInvertidas =
    perguntasNota.filter(
      pergunta =>
        pesquisa.tipo ===
        TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
          ? pergunta.sentidoPontuacao ===
            "POSITIVO"
          : pergunta.sentidoPontuacao ===
            "NEGATIVO"
    ).length;

  return {
    modeloId:
      pesquisa.modeloId ||
      pesquisa.modelo?.id ||
      "modelo",

    modeloTitulo:
      pesquisa.modelo?.titulo ||
      "Instrumento aplicado",

    metodo:
      configuracao.metodo,

    escalaMinima:
      configuracao.escalaMinima,

    escalaMaxima:
      configuracao.escalaMaxima,

    favoravel:
      configuracao.favoravel,

    neutro:
      configuracao.neutro,

    desfavoravel:
      configuracao.desfavoravel,

    faixas:
      configuracao.faixas,

    dimensoes:
      dimensoes.map(
        dimensao => ({
          id:
            dimensao.id,

          nome:
            dimensao.nome,

          peso:
            dimensao.peso,

          fatorRisco:
            dimensao.fatorRisco ||
            null,
        })
      ),

    perguntasNota:
      perguntasNota.length,

    perguntasInvertidas,
  };
}


/* =========================================================
 * INFORMAÇÕES ADICIONAIS
 * ======================================================= */

/*
 * Perguntas não quantitativas são consolidadas separadamente.
 *
 * IMPORTANTE:
 * - NÃO entram nos scores dos módulos;
 * - NÃO alteram favorabilidade;
 * - NÃO alteram maturidade;
 * - NÃO alteram risco psicossocial.
 *
 * SIM_NAO / MULTIPLA_ESCOLHA
 * -> distribuição por alternativa.
 *
 * TEXTO / TEXTO_LONGO
 * -> respostas qualitativas.
 */
function montarInformacoesAdicionais(
  pesquisasBanco: any[]
): InformacaoAdicionalRelatorio[] {
  const mapa =
    new Map<
      string,
      AcumuladorInformacaoAdicional
    >();


  for (
    const pesquisa
    of pesquisasBanco
  ) {
    const dimensoes =
      normalizarDimensoes(
        pesquisa.dimensoes
      );


    const perguntas =
      normalizarPerguntas(
        pesquisa.perguntas,
        dimensoes
      );


    const mapaDimensoes =
      new Map(
        dimensoes.map(
          dimensao => [
            dimensao.id,
            dimensao,
          ]
        )
      );


    const perguntasAdicionais =
      perguntas.filter(
        pergunta =>
          pergunta.tipo !==
          TipoPergunta.NOTA
      );


    const mapaPerguntas =
      new Map(
        perguntasAdicionais.map(
          pergunta => [
            pergunta.id,
            pergunta,
          ]
        )
      );


    /*
     * Criamos primeiro os acumuladores das perguntas.
     * Isso mantém a estrutura consistente mesmo antes
     * de percorrer as respostas.
     */
    for (
      const pergunta
      of perguntasAdicionais
    ) {
      const dimensao =
        pergunta.dimensaoId
          ? mapaDimensoes.get(
              pergunta.dimensaoId
            )
          : null;


      /*
       * A chave consolida a mesma pergunta entre
       * diferentes aplicações do mesmo modelo.
       */
      const chave =
        [
          pesquisa.modeloId ||
            "modelo",

          pergunta.tipo,

          chaveTexto(
            pergunta.titulo
          ),

          chaveTexto(
            dimensao?.nome ||
            ""
          ),
        ].join(
          "::"
        );


      if (
        !mapa.has(
          chave
        )
      ) {
        mapa.set(
          chave,
          {
            id:
              `${pesquisa.modeloId || "modelo"}-${pergunta.id}`,

            perguntaId:
              pergunta.id,

            titulo:
              pergunta.titulo,

            descricao:
              pergunta.descricao ||
              null,

            tipo:
              pergunta.tipo,

            dimensao:
              dimensao
                ? {
                    id:
                      dimensao.id,

                    nome:
                      dimensao.nome,
                  }
                : null,

            totalRespostas:
              0,

            distribuicao:
              new Map(),

            respostasTexto:
              [],
          }
        );
      }
    }


    /*
     * Agora consolidamos as respostas efetivamente recebidas.
     */
    for (
      const respostaPesquisa
      of pesquisa.respostas
    ) {
      const respostas =
        normalizarRespostas(
          respostaPesquisa.respostas
        );


      for (
        const resposta
        of respostas
      ) {
        const pergunta =
          mapaPerguntas.get(
            resposta.perguntaId
          );


        if (
          !pergunta
        ) {
          continue;
        }


        const valor =
          resposta.valor.trim();


        if (
          !valor
        ) {
          continue;
        }


        const dimensao =
          pergunta.dimensaoId
            ? mapaDimensoes.get(
                pergunta.dimensaoId
              )
            : null;


        const chave =
          [
            pesquisa.modeloId ||
              "modelo",

            pergunta.tipo,

            chaveTexto(
              pergunta.titulo
            ),

            chaveTexto(
              dimensao?.nome ||
              ""
            ),
          ].join(
            "::"
          );


        const acumulador =
          mapa.get(
            chave
          );


        if (
          !acumulador
        ) {
          continue;
        }


        acumulador.totalRespostas++;


        /*
         * SIM / NÃO e múltipla escolha:
         * distribuição quantitativa complementar.
         */
        if (
          pergunta.tipo ===
            TipoPergunta.SIM_NAO ||
          pergunta.tipo ===
            TipoPergunta.MULTIPLA_ESCOLHA
        ) {
          const chaveValor =
            chaveTexto(
              valor
            );


          const atual =
            acumulador.distribuicao.get(
              chaveValor
            ) || {
              valor,
              quantidade:
                0,
            };


          atual.quantidade++;


          acumulador.distribuicao.set(
            chaveValor,
            atual
          );


          continue;
        }


        /*
         * Texto curto e texto longo:
         * preservamos cada resposta para leitura qualitativa.
         */
        if (
          pergunta.tipo ===
            TipoPergunta.TEXTO ||
          pergunta.tipo ===
            TipoPergunta.TEXTO_LONGO
        ) {
          acumulador.respostasTexto.push(
            valor
          );
        }
      }
    }
  }


  return Array.from(
    mapa.values()
  )
    .filter(
      item =>
        item.totalRespostas >
        0
    )
    .map(
      item => {
        const distribuicao =
          Array.from(
            item.distribuicao.values()
          )
            .map(
              opcao => ({
                valor:
                  opcao.valor,

                quantidade:
                  opcao.quantidade,

                percentual:
                  item.totalRespostas >
                  0
                    ? (
                        opcao.quantidade /
                        item.totalRespostas
                      ) *
                      100
                    : 0,
              })
            )
            .sort(
              (
                a,
                b
              ) => {
                /*
                 * Para SIM_NAO, mantemos SIM antes de NÃO.
                 */
                if (
                  item.tipo ===
                  TipoPergunta.SIM_NAO
                ) {
                  const ordem = (
                    valor: string
                  ) => {
                    const normalizado =
                      chaveTexto(
                        valor
                      );


                    if (
                      normalizado ===
                      "sim"
                    ) {
                      return 0;
                    }


                    if (
                      normalizado ===
                        "não" ||
                      normalizado ===
                        "nao"
                    ) {
                      return 1;
                    }


                    return 2;
                  };


                  return (
                    ordem(
                      a.valor
                    ) -
                    ordem(
                      b.valor
                    )
                  );
                }


                /*
                 * Múltipla escolha:
                 * alternativas mais escolhidas primeiro.
                 */
                return (
                  b.quantidade -
                  a.quantidade
                );
              }
            );


        return {
          id:
            item.id,

          perguntaId:
            item.perguntaId,

          titulo:
            item.titulo,

          descricao:
            item.descricao,

          tipo:
            item.tipo,

          dimensao:
            item.dimensao,

          totalRespostas:
            item.totalRespostas,

          distribuicao,

          respostasTexto:
            item.respostasTexto,
        };
      }
    )
    .sort(
      (
        a,
        b
      ) =>
        a.titulo.localeCompare(
          b.titulo,
          "pt-BR"
        )
    );
}


/* =========================================================
 * COMPATIBILIDADE COM RELATÓRIOS ANTIGOS
 * ======================================================= */

function calcularIndicadoresNotas(
  perguntasRaw: unknown,
  respostasPesquisa: {
    respostas: unknown;
  }[]
) {
  const perguntas =
    normalizarPerguntas(
      perguntasRaw
    );


  const perguntasNota =
    new Set(
      perguntas
        .filter(
          pergunta =>
            pergunta.tipo ===
            TipoPergunta.NOTA
        )
        .map(
          pergunta =>
            pergunta.id
        )
    );


  let soma =
    0;

  let quantidade =
    0;


  for (
    const respostaPesquisa
    of respostasPesquisa
  ) {
    const respostas =
      normalizarRespostas(
        respostaPesquisa.respostas
      );


    for (
      const resposta
      of respostas
    ) {
      if (
        !perguntasNota.has(
          resposta.perguntaId
        )
      ) {
        continue;
      }


      const valor =
        Number(
          resposta.valor
        );


      if (
        !Number.isFinite(
          valor
        )
      ) {
        continue;
      }


      soma +=
        valor;

      quantidade++;
    }
  }


  return {
    soma,

    quantidade,

    media:
      quantidade >
      0
        ? soma /
          quantidade
        : null,
  };
}


/* =========================================================
 * MOTOR DE CLIMA
 * ======================================================= */

function classificarFavorabilidade(
  valor: number,
  configuracao: ConfiguracaoAnaliseModelo
): ClassificacaoFavorabilidade | null {
  if (
    configuracao.favoravel.includes(
      valor
    )
  ) {
    return "FAVORAVEL";
  }


  if (
    configuracao.neutro.includes(
      valor
    )
  ) {
    return "NEUTRO";
  }


  if (
    configuracao.desfavoravel.includes(
      valor
    )
  ) {
    return "DESFAVORAVEL";
  }


  return null;
}


function analisarPesquisaClima(
  pesquisa: any
) {
  const dimensoes =
    normalizarDimensoes(
      pesquisa.dimensoes
    );


  const perguntas =
    normalizarPerguntas(
      pesquisa.perguntas,
      dimensoes
    );


  const configuracao =
    normalizarConfiguracaoAnalise(
      pesquisa.configuracaoAnalise,
      TipoModuloPesquisa.CLIMA
    );


  const mapaDimensoes =
    new Map<
      string,
      AcumuladorClima
    >();


  for (
    const dimensao
    of dimensoes
  ) {
    mapaDimensoes.set(
      dimensao.id,
      {
        id:
          dimensao.id,

        nome:
          dimensao.nome,

        pesoDimensao:
          Math.max(
            0,
            numeroSeguro(
              dimensao.peso,
              1
            )
          ),

        favoravel:
          0,

        neutro:
          0,

        desfavoravel:
          0,

        totalRespostas:
          0,
      }
    );
  }


  const mapaPerguntas =
    new Map(
      perguntas.map(
        pergunta => [
          pergunta.id,
          pergunta,
        ]
      )
    );


  const comentariosAbertos: string[] =
    [];


  for (
    const respostaPesquisa
    of pesquisa.respostas
  ) {
    const respostas =
      normalizarRespostas(
        respostaPesquisa.respostas
      );


    for (
      const resposta
      of respostas
    ) {
      const pergunta =
        mapaPerguntas.get(
          resposta.perguntaId
        );


      if (
        !pergunta
      ) {
        continue;
      }


      if (
        pergunta.tipo ===
          TipoPergunta.TEXTO ||
        pergunta.tipo ===
          TipoPergunta.TEXTO_LONGO
      ) {
        const texto =
          resposta.valor.trim();


        if (
          texto
        ) {
          comentariosAbertos.push(
            texto
          );
        }

        continue;
      }


      if (
        pergunta.tipo !==
          TipoPergunta.NOTA ||
        !pergunta.dimensaoId
      ) {
        continue;
      }


      const dimensao =
        mapaDimensoes.get(
          pergunta.dimensaoId
        );


      if (
        !dimensao
      ) {
        continue;
      }


      const valorOriginal =
        Number(
          resposta.valor
        );


      if (
        !Number.isFinite(
          valorOriginal
        )
      ) {
        continue;
      }


      const valorOrientado =
        notaOrientadaPositivamente(
          valorOriginal,
          pergunta,
          configuracao
        );


      const classificacao =
        classificarFavorabilidade(
          valorOrientado,
          configuracao
        );


      if (
        !classificacao
      ) {
        continue;
      }


      dimensao.totalRespostas++;


      if (
        classificacao ===
        "FAVORAVEL"
      ) {
        dimensao.favoravel++;
      }


      if (
        classificacao ===
        "NEUTRO"
      ) {
        dimensao.neutro++;
      }


      if (
        classificacao ===
        "DESFAVORAVEL"
      ) {
        dimensao.desfavoravel++;
      }
    }
  }


  const dimensoesResultado =
    Array.from(
      mapaDimensoes.values()
    )
      .filter(
        dimensao =>
          dimensao.totalRespostas >
          0
      )
      .map(
        dimensao => ({
          id:
            dimensao.id,

          nome:
            dimensao.nome,

          pesoDimensao:
            dimensao.pesoDimensao,

          totalRespostas:
            dimensao.totalRespostas,

          favoravel:
            (
              dimensao.favoravel /
              dimensao.totalRespostas
            ) *
            100,

          neutro:
            (
              dimensao.neutro /
              dimensao.totalRespostas
            ) *
            100,

          desfavoravel:
            (
              dimensao.desfavoravel /
              dimensao.totalRespostas
            ) *
            100,

          favoravelQuantidade:
            dimensao.favoravel,

          neutroQuantidade:
            dimensao.neutro,

          desfavoravelQuantidade:
            dimensao.desfavoravel,
        })
      );


  const pesoTotal =
    dimensoesResultado.reduce(
      (
        total,
        dimensao
      ) =>
        total +
        dimensao.pesoDimensao,
      0
    );


  const indiceGeralClima =
    pesoTotal >
    0
      ? dimensoesResultado.reduce(
          (
            total,
            dimensao
          ) =>
            total +
            dimensao.favoravel *
              dimensao.pesoDimensao,
          0
        ) /
        pesoTotal
      : null;


  return {
    indiceGeralClima,

    dimensoes:
      dimensoesResultado,

    comentariosAbertos,
  };
}


function montarAnaliseClima(
  pesquisasBanco: any[]
) {
  const mapaDimensoes =
    new Map<
      string,
      {
        id: string;
        nome: string;

        pesoDimensao: number;

        favoravelQuantidade: number;
        neutroQuantidade: number;
        desfavoravelQuantidade: number;

        totalRespostas: number;
      }
    >();


  const comentariosAbertos: string[] =
    [];


  const historico: {
    rotulo: string;
    indice: number;
  }[] =
    [];


  for (
    const pesquisa
    of [...pesquisasBanco].reverse()
  ) {
    const resultado =
      analisarPesquisaClima(
        pesquisa
      );


    comentariosAbertos.push(
      ...resultado.comentariosAbertos
    );


    if (
      resultado.indiceGeralClima !==
      null
    ) {
      historico.push({
        rotulo:
          pesquisa.titulo,

        indice:
          resultado.indiceGeralClima,
      });
    }


    for (
      const dimensao
      of resultado.dimensoes
    ) {
      const chave =
        chaveTexto(
          dimensao.nome
        );


      const atual =
        mapaDimensoes.get(
          chave
        ) || {
          id:
            dimensao.id,

          nome:
            dimensao.nome,

          pesoDimensao:
            dimensao.pesoDimensao,

          favoravelQuantidade:
            0,

          neutroQuantidade:
            0,

          desfavoravelQuantidade:
            0,

          totalRespostas:
            0,
        };


      atual.favoravelQuantidade +=
        dimensao.favoravelQuantidade;

      atual.neutroQuantidade +=
        dimensao.neutroQuantidade;

      atual.desfavoravelQuantidade +=
        dimensao.desfavoravelQuantidade;

      atual.totalRespostas +=
        dimensao.totalRespostas;


      mapaDimensoes.set(
        chave,
        atual
      );
    }
  }


  const dimensoesComPeso =
    Array.from(
      mapaDimensoes.values()
    )
      .filter(
        item =>
          item.totalRespostas >
          0
      )
      .map(
        item => ({
          id:
            item.id,

          nome:
            item.nome,

          pesoDimensao:
            item.pesoDimensao,

          totalRespostas:
            item.totalRespostas,

          favoravel:
            (
              item.favoravelQuantidade /
              item.totalRespostas
            ) *
            100,

          neutro:
            (
              item.neutroQuantidade /
              item.totalRespostas
            ) *
            100,

          desfavoravel:
            (
              item.desfavoravelQuantidade /
              item.totalRespostas
            ) *
            100,
        })
      )
      .sort(
        (
          a,
          b
        ) =>
          b.favoravel -
          a.favoravel
      );


  const pesoTotal =
    dimensoesComPeso.reduce(
      (
        total,
        dimensao
      ) =>
        total +
        dimensao.pesoDimensao,
      0
    );


  const indiceGeralClima =
    pesoTotal >
    0
      ? dimensoesComPeso.reduce(
          (
            total,
            dimensao
          ) =>
            total +
            dimensao.favoravel *
              dimensao.pesoDimensao,
          0
        ) /
        pesoTotal
      : null;


  return {
    indiceGeralClima,

    dimensoes:
      dimensoesComPeso.map(
        ({
          pesoDimensao,
          ...dimensao
        }) =>
          dimensao
      ),

    comentariosAbertos,

    historico,
  };
}



/* =========================================================
 * CLIMA — ANÁLISE POR SETOR
 * ======================================================= */

/*
 * O setor pertence à própria PesquisaCliente.
 *
 * Portanto:
 * - a Mundial define o setor ao criar a aplicação;
 * - o respondente não seleciona setor;
 * - todas as respostas daquela aplicação pertencem
 *   ao setor vinculado à pesquisa.
 *
 * Aplicações sem setor representam "Toda a empresa" e
 * permanecem apenas no consolidado geral, pois não formam
 * um recorte setorial específico.
 */
function montarAnaliseClimaPorSetor(
  pesquisasBanco: any[]
): AnaliseClimaSetor[] {
  const grupos =
    new Map<
      string,
      {
        setor: string;
        pesquisas: any[];
      }
    >();


  for (
    const pesquisa
    of pesquisasBanco
  ) {
    const setor =
      String(
        pesquisa.setor ??
        ""
      ).trim();


    if (
      !setor
    ) {
      continue;
    }


    const chave =
      chaveTexto(
        setor
      );


    const atual =
      grupos.get(
        chave
      ) || {
        setor,
        pesquisas:
          [],
      };


    atual.pesquisas.push(
      pesquisa
    );


    grupos.set(
      chave,
      atual
    );
  }


  return Array.from(
    grupos.values()
  )
    .map(
      grupo => {
        const analise =
          montarAnaliseClima(
            grupo.pesquisas
          );


        const totalRespostas =
          grupo.pesquisas.reduce(
            (
              total,
              pesquisa
            ) =>
              total +
              pesquisa.respostas.length,
            0
          );


        return {
          setor:
            grupo.setor,

          totalPesquisas:
            grupo.pesquisas.length,

          totalRespostas,

          indiceGeralClima:
            analise.indiceGeralClima,

          dimensoes:
            analise.dimensoes,
        };
      }
    )
    .filter(
      setor =>
        setor.totalRespostas >
        0
    )
    .sort(
      (
        a,
        b
      ) =>
        (
          b.indiceGeralClima ??
          -1
        ) -
        (
          a.indiceGeralClima ??
          -1
        ) ||
        a.setor.localeCompare(
          b.setor,
          "pt-BR"
        )
    );
}


/* =========================================================
 * MOTOR DE AVALIAÇÃO DE DESEMPENHO
 * ======================================================= */

function analisarPesquisaDesempenho(
  pesquisa: any
) {
  const dimensoes =
    normalizarDimensoes(
      pesquisa.dimensoes
    );


  const perguntas =
    normalizarPerguntas(
      pesquisa.perguntas,
      dimensoes
    );


  const configuracao =
    normalizarConfiguracaoAnalise(
      pesquisa.configuracaoAnalise,
      TipoModuloPesquisa.AVALIACAO_DESEMPENHO
    );


  const mapaPerguntas =
    new Map(
      perguntas.map(
        pergunta => [
          pergunta.id,
          pergunta,
        ]
      )
    );


  const mapaDimensoes =
    new Map<
      string,
      AcumuladorScore
    >();


  for (
    const dimensao
    of dimensoes
  ) {
    mapaDimensoes.set(
      dimensao.id,
      {
        id:
          dimensao.id,

        nome:
          dimensao.nome,

        fatorRisco:
          dimensao.fatorRisco ??
          null,

        pesoDimensao:
          Math.max(
            0,
            numeroSeguro(
              dimensao.peso,
              1
            )
          ),

        soma:
          0,

        quantidade:
          0,

        totalRespostas:
          0,

        respondentes:
          new Set<string>(),
      }
    );
  }


  for (
    const respostaPesquisa
    of pesquisa.respostas
  ) {
    const respostas =
      normalizarRespostas(
        respostaPesquisa.respostas
      );


    for (
      const resposta
      of respostas
    ) {
      const pergunta =
        mapaPerguntas.get(
          resposta.perguntaId
        );


      if (
        !pergunta ||
        pergunta.tipo !==
          TipoPergunta.NOTA ||
        !pergunta.dimensaoId
      ) {
        continue;
      }


      const dimensao =
        mapaDimensoes.get(
          pergunta.dimensaoId
        );


      if (
        !dimensao
      ) {
        continue;
      }


      const valor =
        Number(
          resposta.valor
        );


      if (
        !Number.isFinite(
          valor
        )
      ) {
        continue;
      }


      const orientado =
        notaOrientadaPositivamente(
          valor,
          pergunta,
          configuracao
        );


      const score =
        normalizarNotaPercentual(
          orientado,
          configuracao.escalaMinima,
          configuracao.escalaMaxima
        );


      dimensao.soma +=
        score;

      dimensao.quantidade++;

      dimensao.totalRespostas++;

      dimensao.respondentes.add(
        respostaPesquisa.id
      );
    }
  }


  const dimensoesResultado =
    Array.from(
      mapaDimensoes.values()
    )
      .filter(
        item =>
          item.quantidade >
          0
      )
      .map(
        item => {
          const score =
            item.soma /
            item.quantidade;


          const faixa =
            encontrarFaixa(
              score,
              configuracao.faixas
            );


          return {
            id:
              item.id,

            nome:
              item.nome,

            score,

            pesoDimensao:
              item.pesoDimensao,

            classificacao:
              faixa?.classificacao ||
              faixa?.nome ||
              "SEM_CLASSIFICACAO",

            totalRespostas:
              item.totalRespostas,
          };
        }
      );


  const pesoGeral =
    dimensoesResultado.reduce(
      (
        total,
        dimensao
      ) =>
        total +
        dimensao.pesoDimensao,
      0
    );


  const somaGeral =
    dimensoesResultado.reduce(
      (
        total,
        dimensao
      ) =>
        total +
        dimensao.score *
          dimensao.pesoDimensao,
      0
    );


  return {
    scoreDesempenho:
      pesoGeral >
      0
        ? somaGeral /
          pesoGeral
        : null,

    dimensoes:
      dimensoesResultado,

    somaGeral,

    pesoGeral,
  };
}


function montarAnaliseDesempenho(
  pesquisasBanco: any[]
) {
  const mapaDimensoes =
    new Map<
      string,
      {
        id: string;
        nome: string;

        somaPonderada: number;
        pesoTotal: number;

        totalRespostas: number;
      }
    >();


  let somaGeral =
    0;

  let pesoGeral =
    0;


  for (
    const pesquisa
    of pesquisasBanco
  ) {
    const resultado =
      analisarPesquisaDesempenho(
        pesquisa
      );


    somaGeral +=
      resultado.somaGeral;

    pesoGeral +=
      resultado.pesoGeral;


    for (
      const dimensao
      of resultado.dimensoes
    ) {
      const chave =
        chaveTexto(
          dimensao.nome
        );


      const atual =
        mapaDimensoes.get(
          chave
        ) || {
          id:
            dimensao.id,

          nome:
            dimensao.nome,

          somaPonderada:
            0,

          pesoTotal:
            0,

          totalRespostas:
            0,
        };


      atual.somaPonderada +=
        dimensao.score *
        dimensao.pesoDimensao;

      atual.pesoTotal +=
        dimensao.pesoDimensao;

      atual.totalRespostas +=
        dimensao.totalRespostas;


      mapaDimensoes.set(
        chave,
        atual
      );
    }
  }


  const faixas =
    obterFaixasCompativeis(
      pesquisasBanco
    );


  const dimensoes =
    Array.from(
      mapaDimensoes.values()
    )
      .filter(
        item =>
          item.pesoTotal >
          0
      )
      .map(
        item => {
          const score =
            item.somaPonderada /
            item.pesoTotal;


          const faixa =
            encontrarFaixa(
              score,
              faixas
            );


          return {
            id:
              item.id,

            nome:
              item.nome,

            score,

            classificacao:
              faixa?.classificacao ||
              faixa?.nome ||
              "SEM CLASSIFICAÇÃO",

            totalRespostas:
              item.totalRespostas,
          };
        }
      )
      .sort(
        (
          a,
          b
        ) =>
          b.score -
          a.score
      );


  const quantidade =
    dimensoes.length;


  const tamanhoGrupo =
    quantidade >
    0
      ? Math.max(
          1,
          Math.ceil(
            quantidade /
            3
          )
        )
      : 0;


  const forcas =
    dimensoes
      .slice(
        0,
        tamanhoGrupo
      )
      .map(
        item =>
          item.nome
      );


  const prioridades =
    dimensoes
      .slice(
        Math.max(
          tamanhoGrupo,
          quantidade -
            tamanhoGrupo
        )
      )
      .map(
        item =>
          item.nome
      );


  const nomesForcas =
    new Set(
      forcas
    );


  const nomesPrioridades =
    new Set(
      prioridades
    );


  const pontosAtencao =
    dimensoes
      .filter(
        item =>
          !nomesForcas.has(
            item.nome
          ) &&
          !nomesPrioridades.has(
            item.nome
          )
      )
      .map(
        item =>
          item.nome
      );


  return {
    scoreDesempenho:
      pesoGeral >
      0
        ? somaGeral /
          pesoGeral
        : null,

    dimensoes,

    forcas,

    pontosAtencao,

    prioridades,
  };
}


/* =========================================================
 * MOTOR PSICOSSOCIAL
 * ======================================================= */

function analisarPesquisaPsicossocial(
  pesquisa: any
) {
  const dimensoes =
    normalizarDimensoes(
      pesquisa.dimensoes
    );


  const perguntas =
    normalizarPerguntas(
      pesquisa.perguntas,
      dimensoes
    );


  const configuracao =
    normalizarConfiguracaoAnalise(
      pesquisa.configuracaoAnalise,
      TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
    );


  const mapaPerguntas =
    new Map(
      perguntas.map(
        pergunta => [
          pergunta.id,
          pergunta,
        ]
      )
    );


  const mapaDimensoes =
    new Map<
      string,
      AcumuladorScore
    >();


  for (
    const dimensao
    of dimensoes
  ) {
    mapaDimensoes.set(
      dimensao.id,
      {
        id:
          dimensao.id,

        nome:
          dimensao.nome,

        fatorRisco:
          dimensao.fatorRisco ??
          null,

        pesoDimensao:
          Math.max(
            0,
            numeroSeguro(
              dimensao.peso,
              1
            )
          ),

        soma:
          0,

        quantidade:
          0,

        totalRespostas:
          0,

        respondentes:
          new Set<string>(),
      }
    );
  }


  for (
    const respostaPesquisa
    of pesquisa.respostas
  ) {
    const respostas =
      normalizarRespostas(
        respostaPesquisa.respostas
      );


    for (
      const resposta
      of respostas
    ) {
      const pergunta =
        mapaPerguntas.get(
          resposta.perguntaId
        );


      if (
        !pergunta ||
        pergunta.tipo !==
          TipoPergunta.NOTA ||
        !pergunta.dimensaoId
      ) {
        continue;
      }


      const dimensao =
        mapaDimensoes.get(
          pergunta.dimensaoId
        );


      if (
        !dimensao
      ) {
        continue;
      }


      const valor =
        Number(
          resposta.valor
        );


      if (
        !Number.isFinite(
          valor
        )
      ) {
        continue;
      }


      const orientado =
        notaOrientadaParaRisco(
          valor,
          pergunta,
          configuracao
        );


      const score =
        normalizarNotaPercentual(
          orientado,
          configuracao.escalaMinima,
          configuracao.escalaMaxima
        );


      dimensao.soma +=
        score;

      dimensao.quantidade++;

      dimensao.totalRespostas++;

      dimensao.respondentes.add(
        respostaPesquisa.id
      );
    }
  }


  return {
    faixas:
      configuracao.faixas,

    fatores:
      Array.from(
        mapaDimensoes.values()
      )
        .filter(
          item =>
            item.quantidade >
            0
        )
        .map(
          item => ({
            id:
              item.id,

            nome:
              item.nome,

            fatorRisco:
              item.fatorRisco,

            pesoDimensao:
              item.pesoDimensao,

            score:
              item.soma /
              item.quantidade,

            totalRespostas:
              item.respondentes.size,

            totalItensRespondidos:
              item.totalRespostas,

            respondentes:
              item.respondentes,
          })
        ),
  };
}


function montarAnalisePsicossocial(
  pesquisasBanco: any[]
) {
  const mapaFatores =
    new Map<
      string,
      {
        id: string;
        nome: string;
        fatorRisco: string | null;

        somaPonderada: number;
        pesoTotal: number;

        respondentes: Set<string>;
      }
    >();


  for (
    const pesquisa
    of pesquisasBanco
  ) {
    const resultado =
      analisarPesquisaPsicossocial(
        pesquisa
      );


    for (
      const fator
      of resultado.fatores
    ) {
      const nomeChave =
        fator.fatorRisco ||
        fator.nome;


      const chave =
        chaveTexto(
          nomeChave
        );


      const atual =
        mapaFatores.get(
          chave
        ) || {
          /*
           * O relatório consolidado é agrupado pelo fator de risco
           * (ou pelo nome da dimensão quando não houver fator).
           *
           * Não usamos diretamente fator.id aqui, pois o mesmo id
           * de dimensão pode existir em snapshots diferentes com
           * nomes/fatores de risco distintos. Isso gerava ids
           * duplicados no array final e, consequentemente, keys
           * duplicadas no React.
           */
          id:
            `${fator.id}::${chave}`,

          nome:
            fator.nome,

          fatorRisco:
            fator.fatorRisco,

          somaPonderada:
            0,

          pesoTotal:
            0,

          respondentes:
            new Set<string>(),
        };


      atual.somaPonderada +=
        fator.score *
        fator.pesoDimensao;

      atual.pesoTotal +=
        fator.pesoDimensao;


      for (
        const respondente
        of fator.respondentes
      ) {
        atual.respondentes.add(
          respondente
        );
      }


      mapaFatores.set(
        chave,
        atual
      );
    }
  }


  const faixas =
    obterFaixasCompativeis(
      pesquisasBanco
    );


  const fatores =
    Array.from(
      mapaFatores.values()
    )
      .map(
        item => {
          const score =
            item.pesoTotal >
            0
              ? item.somaPonderada /
                item.pesoTotal
              : null;


          const faixa =
            score !==
            null
              ? encontrarFaixa(
                  score,
                  faixas
                )
              : null;


          return {
            id:
              item.id,

            nome:
              item.nome,

            fatorRisco:
              item.fatorRisco,

            score,

            classificacao:
              faixa?.classificacao ||
              faixa?.nome ||
              null,

            totalRespostas:
              item.respondentes.size,
          };
        }
      )
      .sort(
        (
          a,
          b
        ) =>
          (
            b.score ??
            -1
          ) -
          (
            a.score ??
            -1
          )
      );


  return {
    fatores,
  };
}



function montarDimensoesPsicossociais(
  pesquisasBanco: any[]
) {
  const mapaDimensoes =
    new Map<
      string,
      {
        id: string;
        nome: string;
        fatorRisco: string | null;
        somaPonderada: number;
        pesoTotal: number;
        respondentes: Set<string>;
      }
    >();


  for (
    const pesquisa
    of pesquisasBanco
  ) {
    const resultado =
      analisarPesquisaPsicossocial(
        pesquisa
      );


    for (
      const dimensao
      of resultado.fatores
    ) {
      const chave =
        chaveTexto(
          dimensao.nome
        );


      const atual =
        mapaDimensoes.get(
          chave
        ) || {
          id:
            `${dimensao.id}::${chave}`,

          nome:
            dimensao.nome,

          fatorRisco:
            dimensao.fatorRisco,

          somaPonderada:
            0,

          pesoTotal:
            0,

          respondentes:
            new Set<string>(),
        };


      atual.somaPonderada +=
        dimensao.score *
        dimensao.pesoDimensao;

      atual.pesoTotal +=
        dimensao.pesoDimensao;


      for (
        const respondente
        of dimensao.respondentes
      ) {
        atual.respondentes.add(
          `${pesquisa.id}:${respondente}`
        );
      }


      mapaDimensoes.set(
        chave,
        atual
      );
    }
  }


  const faixas =
    obterFaixasCompativeis(
      pesquisasBanco
    );


  return Array.from(
    mapaDimensoes.values()
  )
    .map(
      item => {
        const score =
          item.pesoTotal >
          0
            ? item.somaPonderada /
              item.pesoTotal
            : null;


        const faixa =
          score !==
          null
            ? encontrarFaixa(
                score,
                faixas
              )
            : null;


        return {
          id:
            item.id,

          nome:
            item.nome,

          fatorRisco:
            item.fatorRisco,

          score,

          classificacao:
            faixa?.classificacao ||
            faixa?.nome ||
            null,

          totalRespostas:
            item.respondentes.size,
        };
      }
    );
}



/* =========================================================
 * HEATMAP PSICOSSOCIAL — SETOR × FATOR
 * ======================================================= */

/*
 * O heatmap usa somente perguntas do tipo NOTA.
 *
 * Cada resposta é analisada individualmente:
 * 1. calcula-se o score de risco de cada dimensão;
 * 2. dimensões com o mesmo fator de risco são consolidadas;
 * 3. os resultados são agrupados pelo setor informado.
 *
 * Respostas sem setor continuam fazendo parte do relatório
 * geral, mas não entram no recorte por setor.
 */
function montarHeatmapPsicossocial(
  pesquisasBanco: any[]
): HeatmapPsicossocial {
  type AcumuladorCelula = {
    somaPonderada: number;
    pesoTotal: number;
  };


  type AcumuladorSetor = {
    setor: string;

    respondentes: Set<string>;

    fatores: Map<
      string,
      {
        nome: string;
        somaPonderada: number;
        pesoTotal: number;
      }
    >;
  };


  const setores =
    new Map<
      string,
      AcumuladorSetor
    >();


  const nomesFatores =
    new Map<
      string,
      string
    >();


  for (
    const pesquisa
    of pesquisasBanco
  ) {
    const dimensoes =
      normalizarDimensoes(
        pesquisa.dimensoes
      );


    const perguntas =
      normalizarPerguntas(
        pesquisa.perguntas,
        dimensoes
      );


    const configuracao =
      normalizarConfiguracaoAnalise(
        pesquisa.configuracaoAnalise,
        TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL
      );


    const mapaDimensoes =
      new Map(
        dimensoes.map(
          dimensao => [
            dimensao.id,
            dimensao,
          ]
        )
      );


    const mapaPerguntas =
      new Map(
        perguntas.map(
          pergunta => [
            pergunta.id,
            pergunta,
          ]
        )
      );


    for (
      const respostaPesquisa
      of pesquisa.respostas
    ) {
      const setor =
        String(
          respostaPesquisa.setor ??
          ""
        ).trim();


      /*
       * Sem setor não existe recorte confiável.
       * A resposta permanece no consolidado geral.
       */
      if (
        !setor
      ) {
        continue;
      }


      const chaveSetor =
        chaveTexto(
          setor
        );


      const atualSetor =
        setores.get(
          chaveSetor
        ) || {
          setor,

          respondentes:
            new Set<string>(),

          fatores:
            new Map(),
        };


      atualSetor.respondentes.add(
        `${pesquisa.id}:${respostaPesquisa.id}`
      );


      /*
       * Primeiro consolidamos todas as perguntas
       * respondidas dentro de cada dimensão.
       */
      const acumuladoresDimensao =
        new Map<
          string,
          {
            soma: number;
            quantidade: number;
          }
        >();


      const respostas =
        normalizarRespostas(
          respostaPesquisa.respostas
        );


      for (
        const resposta
        of respostas
      ) {
        const pergunta =
          mapaPerguntas.get(
            resposta.perguntaId
          );


        if (
          !pergunta ||
          pergunta.tipo !==
            TipoPergunta.NOTA ||
          !pergunta.dimensaoId
        ) {
          continue;
        }


        const dimensao =
          mapaDimensoes.get(
            pergunta.dimensaoId
          );


        if (
          !dimensao
        ) {
          continue;
        }


        const valor =
          Number(
            resposta.valor
          );


        if (
          !Number.isFinite(
            valor
          )
        ) {
          continue;
        }


        const orientado =
          notaOrientadaParaRisco(
            valor,
            pergunta,
            configuracao
          );


        const score =
          normalizarNotaPercentual(
            orientado,
            configuracao.escalaMinima,
            configuracao.escalaMaxima
          );


        const acumulador =
          acumuladoresDimensao.get(
            dimensao.id
          ) || {
            soma:
              0,

            quantidade:
              0,
          };


        acumulador.soma +=
          score;

        acumulador.quantidade++;


        acumuladoresDimensao.set(
          dimensao.id,
          acumulador
        );
      }


      /*
       * Depois transformamos as dimensões em fatores
       * e aplicamos o peso cadastrado na dimensão.
       */
      for (
        const [
          dimensaoId,
          acumulador,
        ]
        of acumuladoresDimensao
      ) {
        if (
          acumulador.quantidade <=
          0
        ) {
          continue;
        }


        const dimensao =
          mapaDimensoes.get(
            dimensaoId
          );


        if (
          !dimensao
        ) {
          continue;
        }


        const nomeFator =
          dimensao.fatorRisco ||
          dimensao.nome;


        const chaveFator =
          chaveTexto(
            nomeFator
          );


        nomesFatores.set(
          chaveFator,
          nomeFator
        );


        const peso =
          Math.max(
            0,
            numeroSeguro(
              dimensao.peso,
              1
            )
          );


        if (
          peso <=
          0
        ) {
          continue;
        }


        const scoreDimensao =
          acumulador.soma /
          acumulador.quantidade;


        const atualFator =
          atualSetor.fatores.get(
            chaveFator
          ) || {
            nome:
              nomeFator,

            somaPonderada:
              0,

            pesoTotal:
              0,
          };


        atualFator.somaPonderada +=
          scoreDimensao *
          peso;

        atualFator.pesoTotal +=
          peso;


        atualSetor.fatores.set(
          chaveFator,
          atualFator
        );
      }


      setores.set(
        chaveSetor,
        atualSetor
      );
    }
  }


  const faixas =
    obterFaixasCompativeis(
      pesquisasBanco
    );


  const fatoresOrdenados =
    Array.from(
      nomesFatores.entries()
    )
      .sort(
        (
          a,
          b
        ) =>
          a[1].localeCompare(
            b[1],
            "pt-BR"
          )
      );


  const linhas =
    Array.from(
      setores.values()
    )
      .map(
        setor => ({
          setor:
            setor.setor,

          totalRespondentes:
            setor.respondentes.size,

          fatores:
            fatoresOrdenados.map(
              ([
                chaveFator,
                nomeFator,
              ]) => {
                const acumulador =
                  setor.fatores.get(
                    chaveFator
                  );


                const score =
                  acumulador &&
                  acumulador.pesoTotal >
                    0
                    ? acumulador.somaPonderada /
                      acumulador.pesoTotal
                    : null;


                const faixa =
                  score !==
                    null
                    ? encontrarFaixa(
                        score,
                        faixas
                      )
                    : null;


                return {
                  fator:
                    nomeFator,

                  score,

                  classificacao:
                    faixa?.classificacao ||
                    faixa?.nome ||
                    null,
                };
              }
            ),
        })
      )
      .sort(
        (
          a,
          b
        ) =>
          b.totalRespondentes -
          a.totalRespondentes ||
          a.setor.localeCompare(
            b.setor,
            "pt-BR"
          )
      );


  return {
    fatores:
      fatoresOrdenados.map(
        ([
          ,
          nome,
        ]) =>
          nome
      ),

    setores:
      linhas,
  };
}


/* =========================================================
 * REPOSITÓRIO
 * ======================================================= */

export default class RepositorioPesquisaCliente {
  static async salvar(
    pesquisa: PesquisaCliente,
    tipoEsperado: TipoModuloPesquisa =
      TipoModuloPesquisa.CLIMA
  ) {
    const titulo =
      pesquisa.titulo?.trim();


    if (
      !titulo
    ) {
      throw new Error(
        "Título é obrigatório."
      );
    }


    if (
      !pesquisa.clienteId
    ) {
      throw new Error(
        "Cliente é obrigatório."
      );
    }


    if (
      !pesquisa.modeloId
    ) {
      throw new Error(
        "Modelo é obrigatório."
      );
    }


    const [
      cliente,
      modelo,
    ] =
      await Promise.all([
        prisma.cliente.findUnique({
          where: {
            id:
              pesquisa.clienteId,
          },
        }),

        prisma.modeloPesquisa.findUnique({
          where: {
            id:
              pesquisa.modeloId,
          },
        }),
      ]);


    if (
      !cliente
    ) {
      throw new Error(
        "Cliente não encontrado."
      );
    }


    if (
      !modelo
    ) {
      throw new Error(
        "Modelo não encontrado."
      );
    }


    if (
      modelo.tipo !==
      tipoEsperado
    ) {
      throw new Error(
        "O modelo selecionado pertence a outro módulo."
      );
    }


    const setorAplicacao =
      tipoEsperado ===
      TipoModuloPesquisa.CLIMA
        ? resolverSetorAplicacao(
            pesquisa.setor,
            cliente.setores
          )
        : null;


    const dimensoesModelo =
      normalizarDimensoes(
        modelo.dimensoes
      );


    const perguntasModelo =
      normalizarPerguntas(
        modelo.perguntas,
        dimensoesModelo
      );


    const configuracaoModelo =
      normalizarConfiguracaoAnalise(
        modelo.configuracaoAnalise,
        modelo.tipo
      );


    if (
      perguntasModelo.length ===
      0
    ) {
      throw new Error(
        "O modelo selecionado não possui perguntas."
      );
    }


    /*
     * EDIÇÃO
     */
    if (
      pesquisa.id
    ) {
      const atual =
        await prisma.pesquisaCliente.findUnique({
          where: {
            id:
              pesquisa.id,
          },

          include: {
            _count: {
              select: {
                respostas:
                  true,
              },
            },
          },
        });


      if (
        !atual
      ) {
        throw new Error(
          "Aplicação não encontrada."
        );
      }


      if (
        atual.tipo !==
        tipoEsperado
      ) {
        throw new Error(
          "Esta aplicação pertence a outro módulo."
        );
      }


      const possuiMovimento =
        atual._count.respostas >
        0;


      if (
        possuiMovimento &&
        atual.modeloId !==
          pesquisa.modeloId
      ) {
        throw new Error(
          "O modelo não pode ser alterado porque esta aplicação já possui respostas."
        );
      }


      if (
        possuiMovimento &&
        atual.clienteId !==
          pesquisa.clienteId
      ) {
        throw new Error(
          "O cliente não pode ser alterado porque esta aplicação já possui respostas."
        );
      }


      const manteveModelo =
        atual.modeloId ===
        pesquisa.modeloId;


      const dimensoes =
        manteveModelo
          ? normalizarDimensoes(
              atual.dimensoes
            )
          : dimensoesModelo;


      const perguntas =
        manteveModelo
          ? normalizarPerguntas(
              atual.perguntas,
              dimensoes
            )
          : perguntasModelo;


      const configuracaoAnalise =
        manteveModelo
          ? normalizarConfiguracaoAnalise(
              atual.configuracaoAnalise,
              atual.tipo
            )
          : configuracaoModelo;


      const resultado =
        await prisma.pesquisaCliente.update({
          where: {
            id:
              pesquisa.id,
          },

          data: {
            titulo,

            descricao:
              pesquisa.descricao?.trim() ||
              null,

            clienteId:
              pesquisa.clienteId,

            modeloId:
              pesquisa.modeloId,

            tipo:
              tipoEsperado,

            status:
              pesquisa.status ??
              atual.status,

            setor:
              setorAplicacao,

            perguntas:
              perguntas as unknown as Prisma.InputJsonValue,

            dimensoes:
              dimensoes as unknown as Prisma.InputJsonValue,

            configuracaoAnalise:
              configuracaoAnalise as unknown as Prisma.InputJsonValue,
          },

          include:
            this.includeCompleto(),
        });


      return this.formatarDetalhada(
        resultado
      );
    }


    /*
     * CRIAÇÃO / SNAPSHOT
     */
    const resultado =
      await prisma.pesquisaCliente.create({
        data: {
          titulo,

          descricao:
            pesquisa.descricao?.trim() ||
            null,

          clienteId:
            pesquisa.clienteId,

          modeloId:
            pesquisa.modeloId,

          tipo:
            tipoEsperado,

          status:
            pesquisa.status ??
            StatusPesquisaCliente.ABERTA,

          token:
            pesquisa.token ||
            randomUUID(),

          setor:
            setorAplicacao,

          perguntas:
            perguntasModelo as unknown as Prisma.InputJsonValue,

          dimensoes:
            dimensoesModelo as unknown as Prisma.InputJsonValue,

          configuracaoAnalise:
            configuracaoModelo as unknown as Prisma.InputJsonValue,
        },

        include:
          this.includeCompleto(),
      });


    return this.formatarDetalhada(
      resultado
    );
  }


  static async obterTodos(
    tipo: TipoModuloPesquisa =
      TipoModuloPesquisa.CLIMA
  ) {
    const pesquisas =
      await prisma.pesquisaCliente.findMany({
        where: {
          tipo,
        },

        orderBy: {
          criadoEm:
            "desc",
        },

        include: {
          cliente: {
            select: {
              id:
                true,

              nome:
                true,
            },
          },

          modelo: {
            select: {
              id:
                true,

              titulo:
                true,
            },
          },

          _count: {
            select: {
              respostas:
                true,
            },
          },
        },
      });


    return pesquisas.map(
      pesquisa => ({
        id:
          pesquisa.id,

        tipo:
          pesquisa.tipo,

        titulo:
          pesquisa.titulo,

        descricao:
          pesquisa.descricao,

        token:
          pesquisa.token,

        status:
          pesquisa.status,

        setor:
          pesquisa.setor,

        criadoEm:
          pesquisa.criadoEm,

        atualizadoEm:
          pesquisa.atualizadoEm,

        cliente:
          pesquisa.cliente,

        modelo:
          pesquisa.modelo,

        totalRespostas:
          pesquisa._count.respostas,
      })
    );
  }


  static async obterPorId(
    id: string,
    tipo?: TipoModuloPesquisa
  ) {
    const pesquisa =
      await prisma.pesquisaCliente.findFirst({
        where: {
          id,

          ...(tipo
            ? {
                tipo,
              }
            : {}),
        },

        include:
          this.includeCompleto(),
      });


    if (
      !pesquisa
    ) {
      throw new Error(
        "Aplicação não encontrada."
      );
    }


    return this.formatarDetalhada(
      pesquisa
    );
  }


  static async excluir(
    id: string,
    tipo?: TipoModuloPesquisa
  ) {
    const pesquisa =
      await prisma.pesquisaCliente.findFirst({
        where: {
          id,

          ...(tipo
            ? {
                tipo,
              }
            : {}),
        },
      });


    if (
      !pesquisa
    ) {
      throw new Error(
        "Aplicação não encontrada."
      );
    }


    await prisma.pesquisaCliente.delete({
      where: {
        id,
      },
    });


    return id;
  }


  static async alterarStatus(
    id: string,
    status: StatusPesquisaCliente,
    tipo?: TipoModuloPesquisa
  ) {
    const pesquisaAtual =
      await prisma.pesquisaCliente.findFirst({
        where: {
          id,

          ...(tipo
            ? {
                tipo,
              }
            : {}),
        },
      });


    if (
      !pesquisaAtual
    ) {
      throw new Error(
        "Aplicação não encontrada."
      );
    }


    const pesquisa =
      await prisma.pesquisaCliente.update({
        where: {
          id,
        },

        data: {
          status,
        },

        include:
          this.includeCompleto(),
      });


    return this.formatarDetalhada(
      pesquisa
    );
  }


  static async obterDadosFormulario(
    tipo: TipoModuloPesquisa =
      TipoModuloPesquisa.CLIMA
  ) {
    const [
      clientes,
      modelos,
    ] =
      await Promise.all([
        prisma.cliente.findMany({
          where: {
            ativo:
              true,
          },

          orderBy: {
            nome:
              "asc",
          },
        }),

        prisma.modeloPesquisa.findMany({
          where: {
            ativo:
              true,

            tipo,
          },

          orderBy: {
            titulo:
              "asc",
          },
        }),
      ]);


    return {
      clientes:
        clientes.map(
          cliente => ({
            ...cliente,
            setores:
              normalizarSetoresCliente(
                cliente.setores
              ),
          })
        ),

      modelos:
        modelos.map(
          modelo => {
            const dimensoes =
              normalizarDimensoes(
                modelo.dimensoes
              );


            return {
              id:
                modelo.id,

              titulo:
                modelo.titulo,

              descricao:
                modelo.descricao,

              tipo:
                modelo.tipo,

              ativo:
                modelo.ativo,

              modeloPadrao:
                modelo.modeloPadrao,

              criadoEm:
                modelo.criadoEm,

              atualizadoEm:
                modelo.atualizadoEm,

              perguntas:
                normalizarPerguntas(
                  modelo.perguntas,
                  dimensoes
                ),

              dimensoes,

              configuracaoAnalise:
                normalizarConfiguracaoAnalise(
                  modelo.configuracaoAnalise,
                  modelo.tipo
                ),
            };
          }
        ),
    };
  }


  static async obterRelatorio(
    id: string,
    tipo?: TipoModuloPesquisa
  ) {
    const pesquisa =
      await this.obterPorId(
        id,
        tipo
      );


    return this.montarRelatorio(
      pesquisa
    );
  }


  /*
   * =====================================================
   * RELATÓRIO CONSOLIDADO
   * =====================================================
   */
  static async obterDadosRelatorio(
    tipo: TipoModuloPesquisa =
      TipoModuloPesquisa.CLIMA,

    filtros: {
      dataInicio?: string;
      dataFim?: string;
      clienteId?: string;
      setor?: string;
    } = {}
  ) {
    const dataInicio =
      criarDataInicio(
        filtros.dataInicio
      );


    const dataFim =
      criarDataFim(
        filtros.dataFim
      );


    const whereBase: Prisma.PesquisaClienteWhereInput =
      {
        tipo,
      };


    if (
      dataInicio ||
      dataFim
    ) {
      whereBase.criadoEm =
        {};


      if (
        dataInicio
      ) {
        whereBase.criadoEm.gte =
          dataInicio;
      }


      if (
        dataFim
      ) {
        whereBase.criadoEm.lte =
          dataFim;
      }
    }


    const whereRelatorio: Prisma.PesquisaClienteWhereInput =
      {
        ...whereBase,
      };


    if (
      filtros.clienteId
    ) {
      whereRelatorio.clienteId =
        filtros.clienteId;
    }


    const [
      pesquisasBancoBase,
      pesquisasSetoresBase,
      clientes,
    ] =
      await Promise.all([
        prisma.pesquisaCliente.findMany({
          where:
            whereRelatorio,

          orderBy: {
            criadoEm:
              "desc",
          },

          include: {
            cliente: {
              select: {
                id:
                  true,

                nome:
                  true,

                empresa:
                  true,
              },
            },

            modelo: {
              select: {
                id:
                  true,

                titulo:
                  true,
              },
            },

            respostas: {
              select: {
                id:
                  true,

                respostas:
                  true,

                setor:
                  true,

                criadoEm:
                  true,
              },
            },
          },
        }),

        prisma.pesquisaCliente.findMany({
          where:
            whereBase,

          select: {
            id:
              true,

            clienteId:
              true,

            setor:
              true,

            cliente: {
              select: {
                id:
                  true,
              },
            },

            respostas: {
              select: {
                id:
                  true,

                setor:
                  true,
              },
            },
          },
        }),

        prisma.cliente.findMany({
          orderBy: {
            nome:
              "asc",
          },

          select: {
            id:
              true,

            nome:
              true,

            empresa:
              true,

            setores:
              true,
          },
        }),
      ]);


    /*
     * Cada cliente possui a sua própria lista de setores.
     *
     * Além dos setores cadastrados no Cliente, preservamos setores
     * encontrados nas aplicações/respostas já existentes daquele
     * cliente. Isso mantém compatibilidade com dados históricos.
     */
    const clientesComSetores =
      clientes.map(
        cliente => {
          const setoresCadastrados =
            normalizarSetoresCliente(
              cliente.setores
            );


          const pesquisasCliente =
            pesquisasSetoresBase.filter(
              pesquisa =>
                pesquisa.cliente.id ===
                cliente.id
            );


          const setoresEncontrados =
            listarSetoresRelatorio(
              pesquisasCliente,
              tipo
            );


          const contagemPorSetor =
            contarRespostasPorSetor(
              pesquisasCliente,
              tipo
            );


          const mapaSetores =
            new Map<
              string,
              string
            >();


          for (
            const setor
            of [
              ...setoresCadastrados,
              ...setoresEncontrados,
            ]
          ) {
            const chave =
              normalizarChaveSetor(
                setor
              );


            if (
              chave &&
              !mapaSetores.has(
                chave
              )
            ) {
              mapaSetores.set(
                chave,
                setor
              );
            }
          }


          const setores =
            Array.from(
              mapaSetores.values()
            ).sort(
              (
                a,
                b
              ) =>
                a.localeCompare(
                  b,
                  "pt-BR"
                )
            );


          const setoresRelatorio: SetorRelatorioCliente[] =
            setores.map(
              setor => {
                const totalRespostas =
                  contagemPorSetor.get(
                    normalizarChaveSetor(
                      setor
                    )
                  ) ||
                  0;


                return {
                  nome:
                    setor,

                  disponivel:
                    totalRespostas >=
                    MINIMO_RESPOSTAS_FILTRO_SETOR,
                };
              }
            );


          return {
            id:
              cliente.id,

            nome:
              cliente.nome,

            empresa:
              cliente.empresa,

            setores,

            setoresRelatorio,
          };
        }
      );


    /*
     * O setor só pode ser usado como filtro quando um cliente
     * também estiver selecionado.
     *
     * Isso impede misturar setores de empresas diferentes que
     * possuam nomes iguais, como "Financeiro" ou "Administrativo".
     */
    const clienteSelecionado =
      filtros.clienteId
        ? clientesComSetores.find(
            cliente =>
              cliente.id ===
              filtros.clienteId
          ) ||
          null
        : null;


    const chaveSetorSolicitado =
      clienteSelecionado
        ? normalizarChaveSetor(
            filtros.setor
          )
        : "";


    const setorSolicitado =
      chaveSetorSolicitado
        ? clienteSelecionado?.setoresRelatorio.find(
            setor =>
              normalizarChaveSetor(
                setor.nome
              ) ===
              chaveSetorSolicitado
          ) ||
          null
        : null;


    const setorSelecionado =
      setorSolicitado?.disponivel
        ? setorSolicitado.nome
        : null;


    const filtroSetorBloqueado =
      Boolean(
        chaveSetorSolicitado &&
        setorSolicitado &&
        !setorSolicitado.disponivel
      );


    /*
     * Lista exibida no dropdown de setor:
     * somente setores do cliente atualmente selecionado.
     */
    const setores =
      clienteSelecionado?.setores ||
      [];


    /*
     * Aplica o recorte correto por módulo:
     *
     * CLIMA:
     *   PesquisaCliente.setor
     *
     * DESEMPENHO / PSICOSSOCIAL:
     *   RespostaPesquisaCliente.setor
     */
    const pesquisasBanco =
      filtrarPesquisasPorSetor(
        pesquisasBancoBase,
        tipo,
        setorSelecionado ||
        undefined
      );


    /*
     * -------------------------------------------------
     * Indicadores operacionais
     * -------------------------------------------------
     */
    let somaNotasGeral =
      0;

    let quantidadeNotasGeral =
      0;


    const pesquisas =
      pesquisasBanco.map(
        pesquisa => {
          const totalRespostas =
            pesquisa.respostas.length;


          /*
           * Média antiga mantida SOMENTE por
           * retrocompatibilidade.
           */
          const notas =
            calcularIndicadoresNotas(
              pesquisa.perguntas,
              pesquisa.respostas
            );


          somaNotasGeral +=
            notas.soma;

          quantidadeNotasGeral +=
            notas.quantidade;


          return {
            id:
              pesquisa.id,

            titulo:
              pesquisa.titulo,

            status:
              pesquisa.status,

            setor:
              pesquisa.setor ??
              null,

            criadoEm:
              pesquisa.criadoEm,

            cliente: {
              id:
                pesquisa.cliente.id,

              nome:
                pesquisa.cliente.nome,

              empresa:
                pesquisa.cliente.empresa,
            },

            modelo: {
              id:
                pesquisa.modelo.id,

              titulo:
                pesquisa.modelo.titulo,
            },

            totalRespostas,

            /*
             * Compatibilidade temporária com os relatórios.
             * Como não existem mais convites individuais,
             * não há denominador para calcular cobertura/adesão.
             */
            totalConvites:
              0,

            totalConvitesRespondidos:
              0,

            taxaParticipacao:
              null,

            mediaGeral:
              notas.media,

            somaNotas:
              notas.soma,

            quantidadeNotas:
              notas.quantidade,

            /*
             * Snapshot metodológico usado para explicar
             * de forma auditável como esta aplicação
             * foi calculada no relatório.
             */
            metodologia:
              montarMetodologiaAplicacao(
                pesquisa
              ),
          };
        }
      );


    const totalPesquisas =
      pesquisas.length;


    const totalAbertas =
      pesquisas.filter(
        pesquisa =>
          pesquisa.status ===
          StatusPesquisaCliente.ABERTA
      ).length;


    const totalFechadas =
      pesquisas.filter(
        pesquisa =>
          pesquisa.status ===
          StatusPesquisaCliente.FECHADA
      ).length;


    const totalArquivadas =
      pesquisas.filter(
        pesquisa =>
          pesquisa.status ===
          StatusPesquisaCliente.ARQUIVADA
      ).length;


    const totalRespostas =
      pesquisas.reduce(
        (
          total,
          pesquisa
        ) =>
          total +
          pesquisa.totalRespostas,
        0
      );


    const mediaGeral =
      quantidadeNotasGeral >
      0
        ? somaNotasGeral /
          quantidadeNotasGeral
        : null;


    /*
     * -------------------------------------------------
     * Consolidação por cliente
     * -------------------------------------------------
     */
    const mapaClientes =
      new Map<
        string,
        {
          clienteId: string;

          clienteNome: string;

          empresa:
            | string
            | null;

          totalPesquisas: number;

          totalRespostas: number;

          somaNotas: number;

          quantidadeNotas: number;
        }
      >();


    for (
      const pesquisa
      of pesquisas
    ) {
      const atual =
        mapaClientes.get(
          pesquisa.cliente.id
        ) || {
          clienteId:
            pesquisa.cliente.id,

          clienteNome:
            pesquisa.cliente.nome,

          empresa:
            pesquisa.cliente.empresa,

          totalPesquisas:
            0,

          totalRespostas:
            0,

          somaNotas:
            0,

          quantidadeNotas:
            0,
        };


      atual.totalPesquisas++;

      atual.totalRespostas +=
        pesquisa.totalRespostas;

      atual.somaNotas +=
        pesquisa.somaNotas;

      atual.quantidadeNotas +=
        pesquisa.quantidadeNotas;


      mapaClientes.set(
        pesquisa.cliente.id,
        atual
      );
    }


    const porCliente =
      Array.from(
        mapaClientes.values()
      )
        .map(
          item => ({
            clienteId:
              item.clienteId,

            clienteNome:
              item.clienteNome,

            empresa:
              item.empresa,

            totalPesquisas:
              item.totalPesquisas,

            totalRespostas:
              item.totalRespostas,

            totalConvites:
              0,

            totalConvitesRespondidos:
              0,

            taxaParticipacao:
              null,

            mediaGeral:
              item.quantidadeNotas >
              0
                ? item.somaNotas /
                  item.quantidadeNotas
                : null,
          })
        )
        .sort(
          (
            a,
            b
          ) =>
            b.totalRespostas -
            a.totalRespostas
        );


    /*
     * -------------------------------------------------
     * Motor analítico específico
     * -------------------------------------------------
     */
    const analise =
      tipo ===
      TipoModuloPesquisa.CLIMA
        ? {
            ...montarAnaliseClima(
              pesquisasBanco
            ),

            setores:
              montarAnaliseClimaPorSetor(
                pesquisasBanco
              ),
          }
        : tipo ===
            TipoModuloPesquisa.AVALIACAO_DESEMPENHO
          ? montarAnaliseDesempenho(
              pesquisasBanco
            )
          : {
              ...montarAnalisePsicossocial(
                pesquisasBanco
              ),

              /*
               * Ranking executivo por dimensão.
               * No psicossocial, menor score = menor exposição
               * e maior score = maior exposição ao risco.
               */
              dimensoes:
                montarDimensoesPsicossociais(
                  pesquisasBanco
                ),

              /*
               * O radar usa diretamente "fatores".
               * O heatmap precisa do recorte por setor.
               */
              heatmap:
                montarHeatmapPsicossocial(
                  pesquisasBanco
                ),
            };


    /*
     * Consolidação complementar:
     *
     * SIM_NAO
     * MULTIPLA_ESCOLHA
     * TEXTO
     * TEXTO_LONGO
     *
     * Não interfere na lógica analítica dos módulos.
     */
    const informacoesAdicionais =
      montarInformacoesAdicionais(
        pesquisasBanco
      );


    return {
      tipo,

      filtros: {
        dataInicio:
          filtros.dataInicio ||
          null,

        dataFim:
          filtros.dataFim ||
          null,

        clienteId:
          filtros.clienteId ||
          null,

        setor:
          setorSelecionado,
      },

      setores,

      clientes:
        clientesComSetores,

      privacidadeSetor: {
        minimoRespostas:
          MINIMO_RESPOSTAS_FILTRO_SETOR,

        filtroBloqueado:
          filtroSetorBloqueado,

        setorSolicitado:
          setorSolicitado?.nome ||
          null,

        mensagem:
          filtroSetorBloqueado
            ? `Para preservar o anonimato, o filtro por setor só pode ser aplicado quando houver pelo menos ${MINIMO_RESPOSTAS_FILTRO_SETOR} respostas no setor selecionado.`
            : null,
      },

      resumo: {
        totalPesquisas,

        totalAbertas,

        totalFechadas,

        totalArquivadas,

        totalRespostas,

        /*
         * Sem convites individuais não existe uma população-alvo
         * cadastrada automaticamente. Portanto cobertura/adesão
         * ficam indisponíveis até existir outro denominador.
         */
        totalConvites:
          0,

        totalConvitesRespondidos:
          0,

        taxaParticipacao:
          null,

        /*
         * Legado.
         *
         * Os novos componentes NÃO devem interpretar
         * este campo como indicador oficial.
         */
        mediaGeral,
      },

      porCliente,

      pesquisas:
        pesquisas.map(
          ({
            somaNotas,
            quantidadeNotas,
            ...pesquisa
          }) =>
            pesquisa
        ),

      /*
       * Dados complementares dos tipos não quantitativos.
       */
      informacoesAdicionais,

      analise,
    };
  }


  static async obterMinhas(
    clienteId: string,
    tipo: TipoModuloPesquisa =
      TipoModuloPesquisa.CLIMA
  ) {
    const pesquisas =
      await prisma.pesquisaCliente.findMany({
        where: {
          clienteId,
          tipo,
        },

        orderBy: {
          criadoEm:
            "desc",
        },

        include: {
          cliente: {
            select: {
              id:
                true,

              nome:
                true,
            },
          },

          modelo: {
            select: {
              id:
                true,

              titulo:
                true,
            },
          },

          _count: {
            select: {
              respostas:
                true,
            },
          },
        },
      });


    return pesquisas.map(
      pesquisa => ({
        id:
          pesquisa.id,

        tipo:
          pesquisa.tipo,

        titulo:
          pesquisa.titulo,

        descricao:
          pesquisa.descricao,

        token:
          pesquisa.token,

        status:
          pesquisa.status,

        setor:
          pesquisa.setor,

        criadoEm:
          pesquisa.criadoEm,

        atualizadoEm:
          pesquisa.atualizadoEm,

        cliente:
          pesquisa.cliente,

        modelo:
          pesquisa.modelo,

        totalRespostas:
          pesquisa._count.respostas,
      })
    );
  }


  static async obterPorIdECliente(
    id: string,
    clienteId: string,
    tipo?: TipoModuloPesquisa
  ) {
    const pesquisa =
      await prisma.pesquisaCliente.findFirst({
        where: {
          id,

          clienteId,

          ...(tipo
            ? {
                tipo,
              }
            : {}),
        },

        include:
          this.includeCompleto(),
      });


    if (
      !pesquisa
    ) {
      throw new Error(
        "Aplicação não encontrada."
      );
    }


    return this.formatarDetalhada(
      pesquisa
    );
  }


  static async obterRelatorioPorCliente(
    id: string,
    clienteId: string,
    tipo?: TipoModuloPesquisa
  ) {
    const pesquisa =
      await this.obterPorIdECliente(
        id,
        clienteId,
        tipo
      );


    return this.montarRelatorio(
      pesquisa
    );
  }


  /*
   * Relatório individual antigo continua funcionando.
   *
   * Depois podemos também fazer o relatório individual
   * retornar a análise especializada de cada módulo.
   */
  private static montarRelatorio(
    pesquisa: any
  ) {
    const perguntas: PerguntaPesquisaCliente[] =
      Array.isArray(
        pesquisa.perguntas
      )
        ? pesquisa.perguntas
        : [];


    type ResumoPergunta = {
      pergunta: PerguntaPesquisaCliente;

      totalRespostas: number;

      media: number;

      respostas: RespostaPesquisaItem[];
    };


    const perguntasComResumo: ResumoPergunta[] =
      perguntas.map(
        pergunta => {
          const respostasDaPergunta =
            (
              pesquisa.respostas as RespostaPesquisaCliente[]
            ).flatMap(
              respostaCliente =>
                respostaCliente.respostas.filter(
                  resposta =>
                    resposta.perguntaId ===
                    pergunta.id
                )
            );


          const valoresNumericos =
            pergunta.tipo ===
            TipoPergunta.NOTA
              ? respostasDaPergunta
                  .map(
                    resposta =>
                      Number(
                        resposta.valor
                      )
                  )
                  .filter(
                    valor =>
                      Number.isFinite(
                        valor
                      )
                  )
              : [];


          const media =
            valoresNumericos.length >
            0
              ? valoresNumericos.reduce(
                  (
                    total,
                    valor
                  ) =>
                    total +
                    valor,
                  0
                ) /
                valoresNumericos.length
              : 0;


          return {
            pergunta,

            totalRespostas:
              respostasDaPergunta.length,

            media,

            respostas:
              respostasDaPergunta,
          };
        }
      );


    const mediasValidas =
      perguntasComResumo.filter(
        item =>
          item.pergunta.tipo ===
            TipoPergunta.NOTA &&
          item.totalRespostas >
            0
      );


    const mediaGeral =
      mediasValidas.length >
      0
        ? mediasValidas.reduce(
            (
              total,
              item
            ) =>
              total +
              item.media,
            0
          ) /
          mediasValidas.length
        : 0;


    return {
      ...pesquisa,

      perguntasComResumo,

      mediaGeral,
    };
  }


  private static includeCompleto() {
    return {
      cliente:
        true,

      modelo:
        true,

      respostas: {
        orderBy: {
          criadoEm:
            "desc" as const,
        },
      },
    };
  }


  private static formatarDetalhada(
    pesquisa: any
  ) {
    const dimensoesPesquisa =
      normalizarDimensoes(
        pesquisa.dimensoes
      );


    const perguntasPesquisa =
      normalizarPerguntas(
        pesquisa.perguntas,
        dimensoesPesquisa
      );


    const configuracaoPesquisa =
      normalizarConfiguracaoAnalise(
        pesquisa.configuracaoAnalise,
        pesquisa.tipo
      );


    const dimensoesModelo =
      normalizarDimensoes(
        pesquisa.modelo?.dimensoes
      );


    const perguntasModelo =
      normalizarPerguntas(
        pesquisa.modelo?.perguntas,
        dimensoesModelo
      );


    const configuracaoModelo =
      normalizarConfiguracaoAnalise(
        pesquisa.modelo?.configuracaoAnalise,
        pesquisa.modelo?.tipo ??
          pesquisa.tipo
      );


    return {
      id:
        pesquisa.id,

      clienteId:
        pesquisa.clienteId,

      modeloId:
        pesquisa.modeloId,

      tipo:
        pesquisa.tipo,

      titulo:
        pesquisa.titulo,

      descricao:
        pesquisa.descricao,

      token:
        pesquisa.token,

      status:
        pesquisa.status,

      setor:
        pesquisa.setor ??
        null,

      perguntas:
        perguntasPesquisa,

      dimensoes:
        dimensoesPesquisa,

      configuracaoAnalise:
        configuracaoPesquisa,

      criadoEm:
        pesquisa.criadoEm,

      atualizadoEm:
        pesquisa.atualizadoEm,

      cliente:
        pesquisa.cliente,

      modelo: {
        id:
          pesquisa.modelo.id,

        titulo:
          pesquisa.modelo.titulo,

        perguntas:
          perguntasModelo.length >
          0
            ? perguntasModelo
            : perguntasPesquisa,

        dimensoes:
          dimensoesModelo.length >
          0
            ? dimensoesModelo
            : dimensoesPesquisa,

        configuracaoAnalise:
          configuracaoModelo,
      },

      respostas:
        pesquisa.respostas.map(
          (
            resposta: any
          ) => ({
            id:
              resposta.id,

            pesquisaId:
              resposta.pesquisaId,

            nome:
              resposta.nome,

            email:
              resposta.email,

            unidade:
              resposta.unidade,

            setor:
              resposta.setor,

            cargo:
              resposta.cargo,

            respostas:
              normalizarRespostas(
                resposta.respostas
              ),

            criadoEm:
              resposta.criadoEm,
          })
        ),

      totalRespostas:
        pesquisa.respostas.length,
    };
  }
}
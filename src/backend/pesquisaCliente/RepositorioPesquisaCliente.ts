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

  favoravelPeso: number;
  neutroPeso: number;
  desfavoravelPeso: number;

  totalPeso: number;
  totalRespostas: number;
};


type AcumuladorScore = {
  id: string;
  nome: string;
  fatorRisco: string | null;

  somaPonderada: number;
  pesoTotal: number;

  totalRespostas: number;

  respondentes: Set<string>;
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
    return padrao;
  }


  const item =
    configuracao as Partial<ConfiguracaoAnaliseModelo>;


  return {
    metodo:
      tipo ===
      TipoModuloPesquisa.CLIMA
        ? "FAVORABILIDADE"
        : tipo ===
            TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL
          ? "MATURIDADE"
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

    anonimatoMinimo:
      Math.max(
        1,
        Math.round(
          numeroSeguro(
            item.anonimatoMinimo,
            padrao.anonimatoMinimo
          )
        )
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
  };
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

        tipo:
          item.tipo ||
          TipoPergunta.NOTA,

        ordem:
          item.ordem ||
          index + 1,

        obrigatoria:
          item.obrigatoria ??
          true,

        opcoes:
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

        peso:
          Math.max(
            0,
            numeroSeguro(
              item.peso,
              1
            )
          ),

        sentidoPontuacao:
          item.sentidoPontuacao ===
          "NEGATIVO"
            ? "NEGATIVO"
            : "POSITIVO",

        fatorRisco:
          item.fatorRisco?.trim() ||
          null,
      };
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

        favoravelPeso:
          0,

        neutroPeso:
          0,

        desfavoravelPeso:
          0,

        totalPeso:
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


  let favoravelGeral =
    0;

  let neutroGeral =
    0;

  let desfavoravelGeral =
    0;

  let pesoGeral =
    0;


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


      /*
       * Comentários/textos.
       */
      if (
        pergunta.tipo !==
          TipoPergunta.NOTA &&
        pergunta.tipo !==
          TipoPergunta.MULTIPLA_ESCOLHA
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
        TipoPergunta.NOTA
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


      /*
       * Favorabilidade sempre é interpretada como:
       *
       * nota maior = melhor percepção.
       */
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


      const pesoPergunta =
        Math.max(
          0,
          pergunta.peso ||
            1
        );


      const dimensao =
        pergunta.dimensaoId
          ? mapaDimensoes.get(
              pergunta.dimensaoId
            )
          : undefined;


      if (
        dimensao
      ) {
        dimensao.totalPeso +=
          pesoPergunta;

        dimensao.totalRespostas++;


        if (
          classificacao ===
          "FAVORAVEL"
        ) {
          dimensao.favoravelPeso +=
            pesoPergunta;
        }


        if (
          classificacao ===
          "NEUTRO"
        ) {
          dimensao.neutroPeso +=
            pesoPergunta;
        }


        if (
          classificacao ===
          "DESFAVORAVEL"
        ) {
          dimensao.desfavoravelPeso +=
            pesoPergunta;
        }
      }


      pesoGeral +=
        pesoPergunta;


      if (
        classificacao ===
        "FAVORAVEL"
      ) {
        favoravelGeral +=
          pesoPergunta;
      }


      if (
        classificacao ===
        "NEUTRO"
      ) {
        neutroGeral +=
          pesoPergunta;
      }


      if (
        classificacao ===
        "DESFAVORAVEL"
      ) {
        desfavoravelGeral +=
          pesoPergunta;
      }
    }
  }


  const dimensoesResultado =
    Array.from(
      mapaDimensoes.values()
    )
      .filter(
        dimensao =>
          dimensao.totalPeso >
          0
      )
      .map(
        dimensao => ({
          id:
            dimensao.id,

          nome:
            dimensao.nome,

          totalRespostas:
            dimensao.totalRespostas,

          favoravel:
            (
              dimensao.favoravelPeso /
              dimensao.totalPeso
            ) *
            100,

          neutro:
            (
              dimensao.neutroPeso /
              dimensao.totalPeso
            ) *
            100,

          desfavoravel:
            (
              dimensao.desfavoravelPeso /
              dimensao.totalPeso
            ) *
            100,

          favoravelPeso:
            dimensao.favoravelPeso,

          neutroPeso:
            dimensao.neutroPeso,

          desfavoravelPeso:
            dimensao.desfavoravelPeso,

          totalPeso:
            dimensao.totalPeso,
        })
      );


  return {
    indiceGeralClima:
      pesoGeral >
      0
        ? (
            favoravelGeral /
            pesoGeral
          ) *
          100
        : null,

    dimensoes:
      dimensoesResultado,

    comentariosAbertos,

    favoravelPeso:
      favoravelGeral,

    neutroPeso:
      neutroGeral,

    desfavoravelPeso:
      desfavoravelGeral,

    totalPeso:
      pesoGeral,
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

        favoravelPeso: number;
        neutroPeso: number;
        desfavoravelPeso: number;

        totalPeso: number;
        totalRespostas: number;
      }
    >();


  let favoravelGeral =
    0;

  let neutroGeral =
    0;

  let desfavoravelGeral =
    0;

  let pesoGeral =
    0;


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


    favoravelGeral +=
      resultado.favoravelPeso;

    neutroGeral +=
      resultado.neutroPeso;

    desfavoravelGeral +=
      resultado.desfavoravelPeso;

    pesoGeral +=
      resultado.totalPeso;


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

          favoravelPeso:
            0,

          neutroPeso:
            0,

          desfavoravelPeso:
            0,

          totalPeso:
            0,

          totalRespostas:
            0,
        };


      atual.favoravelPeso +=
        dimensao.favoravelPeso;

      atual.neutroPeso +=
        dimensao.neutroPeso;

      atual.desfavoravelPeso +=
        dimensao.desfavoravelPeso;

      atual.totalPeso +=
        dimensao.totalPeso;

      atual.totalRespostas +=
        dimensao.totalRespostas;


      mapaDimensoes.set(
        chave,
        atual
      );
    }
  }


  const dimensoes =
    Array.from(
      mapaDimensoes.values()
    )
      .filter(
        item =>
          item.totalPeso >
          0
      )
      .map(
        item => ({
          id:
            item.id,

          nome:
            item.nome,

          totalRespostas:
            item.totalRespostas,

          favoravel:
            (
              item.favoravelPeso /
              item.totalPeso
            ) *
            100,

          neutro:
            (
              item.neutroPeso /
              item.totalPeso
            ) *
            100,

          desfavoravel:
            (
              item.desfavoravelPeso /
              item.totalPeso
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


  return {
    indiceGeralClima:
      pesoGeral >
      0
        ? (
            favoravelGeral /
            pesoGeral
          ) *
          100
        : null,

    dimensoes,

    comentariosAbertos,

    historico,
  };
}


/* =========================================================
 * MOTOR DE DIAGNÓSTICO ORGANIZACIONAL
 * ======================================================= */

function analisarPesquisaDiagnostico(
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
      TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL
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

        somaPonderada:
          0,

        pesoTotal:
          0,

        totalRespostas:
          0,

        respondentes:
          new Set<string>(),
      }
    );
  }


  let somaGeral =
    0;

  let pesoGeral =
    0;


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
          TipoPergunta.NOTA
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


      const dimensao =
        pergunta.dimensaoId
          ? mapaDimensoes.get(
              pergunta.dimensaoId
            )
          : undefined;


      const pesoPergunta =
        Math.max(
          0,
          pergunta.peso ||
            1
        );


      const pesoDimensao =
        pergunta.dimensaoId
          ? dimensoes.find(
              item =>
                item.id ===
                pergunta.dimensaoId
            )?.peso ||
            1
          : 1;


      const pesoFinal =
        pesoPergunta *
        pesoDimensao;


      somaGeral +=
        score *
        pesoFinal;

      pesoGeral +=
        pesoFinal;


      if (
        dimensao
      ) {
        dimensao.somaPonderada +=
          score *
          pesoFinal;

        dimensao.pesoTotal +=
          pesoFinal;

        dimensao.totalRespostas++;

        dimensao.respondentes.add(
          respostaPesquisa.id
        );
      }
    }
  }


  const dimensoesResultado =
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
              configuracao.faixas
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
              "SEM_CLASSIFICACAO",

            totalRespostas:
              item.totalRespostas,

            somaPonderada:
              item.somaPonderada,

            pesoTotal:
              item.pesoTotal,
          };
        }
      );


  return {
    scoreOrganizacional:
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


function montarAnaliseDiagnostico(
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
      analisarPesquisaDiagnostico(
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
        dimensao.somaPonderada;

      atual.pesoTotal +=
        dimensao.pesoTotal;

      atual.totalRespostas +=
        dimensao.totalRespostas;


      mapaDimensoes.set(
        chave,
        atual
      );
    }
  }


  /*
   * Só classifica o consolidado se os instrumentos
   * estiverem usando exatamente as mesmas faixas.
   */
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


  /*
   * Classificação executiva relativa.
   *
   * Não inventamos faixas técnicas para "força"
   * ou "prioridade".
   *
   * Apenas organizamos as dimensões do melhor
   * para o pior desempenho.
   */
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
    scoreOrganizacional:
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

        somaPonderada:
          0,

        pesoTotal:
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
          TipoPergunta.NOTA
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


      /*
       * Agora 100 significa MAIOR exposição.
       */
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


      const dimensao =
        pergunta.dimensaoId
          ? mapaDimensoes.get(
              pergunta.dimensaoId
            )
          : undefined;


      if (
        !dimensao
      ) {
        continue;
      }


      const pesoPergunta =
        Math.max(
          0,
          pergunta.peso ||
            1
        );


      const pesoDimensao =
        dimensoes.find(
          item =>
            item.id ===
            pergunta.dimensaoId
        )?.peso ||
        1;


      const pesoFinal =
        pesoPergunta *
        pesoDimensao;


      dimensao.somaPonderada +=
        score *
        pesoFinal;

      dimensao.pesoTotal +=
        pesoFinal;

      dimensao.totalRespostas++;

      dimensao.respondentes.add(
        respostaPesquisa.id
      );
    }
  }


  return {
    anonimatoMinimo:
      configuracao.anonimatoMinimo,

    faixas:
      configuracao.faixas,

    fatores:
      Array.from(
        mapaDimensoes.values()
      )
        .filter(
          item =>
            item.pesoTotal >
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

            score:
              item.somaPonderada /
              item.pesoTotal,

            totalRespostas:
              item.respondentes.size,

            totalItensRespondidos:
              item.totalRespostas,

            respondentes:
              item.respondentes,

            somaPonderada:
              item.somaPonderada,

            pesoTotal:
              item.pesoTotal,
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


  let anonimatoMinimo =
    1;


  for (
    const pesquisa
    of pesquisasBanco
  ) {
    const resultado =
      analisarPesquisaPsicossocial(
        pesquisa
      );


    /*
     * Regra conservadora:
     * se diferentes instrumentos exigirem mínimos
     * diferentes, usamos o maior.
     */
    anonimatoMinimo =
      Math.max(
        anonimatoMinimo,
        resultado.anonimatoMinimo
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
          id:
            fator.id,

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
        fator.somaPonderada;

      atual.pesoTotal +=
        fator.pesoTotal;


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


  /*
   * Só aplicamos classificação de risco no
   * consolidado se todas as metodologias possuírem
   * exatamente as mesmas faixas.
   */
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
          const totalRespondentes =
            item.respondentes.size;


          const bloqueadoAnonimato =
            totalRespondentes <
            anonimatoMinimo;


          const score =
            item.pesoTotal >
            0
              ? item.somaPonderada /
                item.pesoTotal
              : null;


          const faixa =
            score !==
              null &&
            !bloqueadoAnonimato
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

            score:
              bloqueadoAnonimato
                ? null
                : score,

            classificacao:
              bloqueadoAnonimato
                ? null
                : faixa?.classificacao ||
                  faixa?.nome ||
                  null,

            totalRespostas:
              totalRespondentes,

            bloqueadoAnonimato,
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

    anonimatoMinimo,

    totalGruposBloqueados:
      fatores.filter(
        fator =>
          fator.bloqueadoAnonimato
      ).length,
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

                convites:
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
          0 ||
        atual._count.convites >
          0;


      if (
        possuiMovimento &&
        atual.modeloId !==
          pesquisa.modeloId
      ) {
        throw new Error(
          "O modelo não pode ser alterado porque esta aplicação já possui convites ou respostas."
        );
      }


      if (
        possuiMovimento &&
        atual.clienteId !==
          pesquisa.clienteId
      ) {
        throw new Error(
          "O cliente não pode ser alterado porque esta aplicação já possui convites ou respostas."
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
      clientes,

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


    const where: Prisma.PesquisaClienteWhereInput =
      {
        tipo,
      };


    if (
      filtros.clienteId
    ) {
      where.clienteId =
        filtros.clienteId;
    }


    if (
      dataInicio ||
      dataFim
    ) {
      where.criadoEm =
        {};


      if (
        dataInicio
      ) {
        where.criadoEm.gte =
          dataInicio;
      }


      if (
        dataFim
      ) {
        where.criadoEm.lte =
          dataFim;
      }
    }


    const [
      pesquisasBanco,
      clientes,
    ] =
      await Promise.all([
        prisma.pesquisaCliente.findMany({
          where,

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

                criadoEm:
                  true,
              },
            },

            convites: {
              select: {
                id:
                  true,

                respondido:
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
          },
        }),
      ]);


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


          const totalConvites =
            pesquisa.convites.length;


          const totalConvitesRespondidos =
            pesquisa.convites.filter(
              convite =>
                convite.respondido
            ).length;


          const taxaParticipacao =
            totalConvites >
            0
              ? (
                  totalConvitesRespondidos /
                  totalConvites
                ) *
                100
              : null;


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

            totalConvites,

            totalConvitesRespondidos,

            taxaParticipacao,

            mediaGeral:
              notas.media,

            somaNotas:
              notas.soma,

            quantidadeNotas:
              notas.quantidade,
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


    const totalConvites =
      pesquisas.reduce(
        (
          total,
          pesquisa
        ) =>
          total +
          pesquisa.totalConvites,
        0
      );


    const totalConvitesRespondidos =
      pesquisas.reduce(
        (
          total,
          pesquisa
        ) =>
          total +
          pesquisa.totalConvitesRespondidos,
        0
      );


    const taxaParticipacao =
      totalConvites >
      0
        ? (
            totalConvitesRespondidos /
            totalConvites
          ) *
          100
        : null;


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

          totalConvites: number;

          totalConvitesRespondidos: number;

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

          totalConvites:
            0,

          totalConvitesRespondidos:
            0,

          somaNotas:
            0,

          quantidadeNotas:
            0,
        };


      atual.totalPesquisas++;

      atual.totalRespostas +=
        pesquisa.totalRespostas;

      atual.totalConvites +=
        pesquisa.totalConvites;

      atual.totalConvitesRespondidos +=
        pesquisa.totalConvitesRespondidos;

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
              item.totalConvites,

            totalConvitesRespondidos:
              item.totalConvitesRespondidos,

            taxaParticipacao:
              item.totalConvites >
              0
                ? (
                    item.totalConvitesRespondidos /
                    item.totalConvites
                  ) *
                  100
                : null,

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
        ? montarAnaliseClima(
            pesquisasBanco
          )
        : tipo ===
            TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL
          ? montarAnaliseDiagnostico(
              pesquisasBanco
            )
          : montarAnalisePsicossocial(
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
      },

      clientes,

      resumo: {
        totalPesquisas,

        totalAbertas,

        totalFechadas,

        totalArquivadas,

        totalRespostas,

        totalConvites,

        totalConvitesRespondidos,

        taxaParticipacao,

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

      analise,
    };
  }


  static async gerarConvites(
    pesquisaId: string,
    quantidade: number,
    tipo?: TipoModuloPesquisa
  ) {
    if (
      !pesquisaId
    ) {
      throw new Error(
        "Aplicação é obrigatória."
      );
    }


    if (
      !Number.isInteger(
        quantidade
      ) ||
      quantidade <
        1
    ) {
      throw new Error(
        "Informe uma quantidade válida de convites."
      );
    }


    if (
      quantidade >
      500
    ) {
      throw new Error(
        "Você pode gerar no máximo 500 convites por vez."
      );
    }


    const pesquisa =
      await prisma.pesquisaCliente.findFirst({
        where: {
          id:
            pesquisaId,

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


    if (
      pesquisa.status !==
      StatusPesquisaCliente.ABERTA
    ) {
      throw new Error(
        "Não é possível gerar convites para uma aplicação fechada ou arquivada."
      );
    }


    const convites =
      Array.from({
        length:
          quantidade,
      }).map(
        () => ({
          pesquisaId,

          token:
            randomUUID(),

          unidade:
            null,

          setor:
            null,

          cargo:
            null,
        })
      );


    await prisma.convitePesquisa.createMany({
      data:
        convites,
    });


    return this.obterPorId(
      pesquisaId,
      tipo
    );
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

      convites: {
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

      convites:
        (
          pesquisa.convites ||
          []
        ).map(
          (
            convite: any
          ) => ({
            id:
              convite.id,

            pesquisaId:
              convite.pesquisaId,

            token:
              convite.token,

            nome:
              convite.nome,

            email:
              convite.email,

            unidade:
              convite.unidade,

            setor:
              convite.setor,

            cargo:
              convite.cargo,

            respondido:
              convite.respondido,

            respondidoEm:
              convite.respondidoEm,

            criadoEm:
              convite.criadoEm,

            atualizadoEm:
              convite.atualizadoEm,
          })
        ),

      totalConvites:
        pesquisa.convites?.length ||
        0,

      totalConvitesRespondidos:
        pesquisa.convites?.filter(
          (
            convite: any
          ) =>
            convite.respondido
        ).length ||
        0,
    };
  }
}
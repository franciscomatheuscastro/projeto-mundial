import {
  randomUUID,
} from "crypto";

import {
  Prisma,
  StatusPesquisaCliente,
  TipoPergunta,
} from "@prisma/client";

import {
  prisma,
} from "@/src/lib/prisma";

import {
  NovaRespostaPesquisa,
  PerguntaRespostaPesquisa,
} from "@/src/core/model/RespostaPesquisa";


/* =========================================================
 * UTILITÁRIOS
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


function textoOuNull(
  valor?: string | null
) {
  const texto =
    valor?.trim();

  return texto ||
    null;
}


function emailOuNull(
  valor?: string | null
) {
  const texto =
    valor
      ?.trim()
      .toLowerCase();

  return texto ||
    null;
}


/* =========================================================
 * CONFIGURAÇÃO DE ANÁLISE
 * ======================================================= */

type ConfiguracaoAnaliseBasica = {
  escalaMinima: number;
  escalaMaxima: number;
};


function normalizarConfiguracaoAnalise(
  valor: unknown
): ConfiguracaoAnaliseBasica {
  const padrao = {
    escalaMinima: 1,
    escalaMaxima: 5,
  };


  if (
    !valor ||
    typeof valor !==
      "object" ||
    Array.isArray(
      valor
    )
  ) {
    return padrao;
  }


  const item =
    valor as {
      escalaMinima?: unknown;
      escalaMaxima?: unknown;
    };


  const escalaMinima =
    numeroSeguro(
      item.escalaMinima,
      1
    );


  const escalaMaxima =
    numeroSeguro(
      item.escalaMaxima,
      5
    );


  if (
    escalaMaxima <=
    escalaMinima
  ) {
    return padrao;
  }


  return {
    escalaMinima,
    escalaMaxima,
  };
}


/* =========================================================
 * PERGUNTAS
 * ======================================================= */

function normalizarPerguntas(
  perguntas: unknown
): PerguntaRespostaPesquisa[] {
  if (
    !Array.isArray(
      perguntas
    )
  ) {
    return [];
  }

  return perguntas
    .map(
      (
        pergunta,
        index
      ): PerguntaRespostaPesquisa => {
        const item =
          pergunta as Partial<PerguntaRespostaPesquisa>;

        const sentidoPontuacao:
          PerguntaRespostaPesquisa["sentidoPontuacao"] =
            item.sentidoPontuacao ===
            "NEGATIVO"
              ? "NEGATIVO"
              : "POSITIVO";

        return {
          id:
            item.id ||
            randomUUID(),

          titulo:
            item.titulo?.trim() ||
            "Pergunta",

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

          dimensaoId:
            item.dimensaoId ??
            null,

          peso:
            Math.max(
              0,
              numeroSeguro(
                item.peso,
                1
              )
            ),

          sentidoPontuacao,

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


/* =========================================================
 * REPOSITÓRIO
 * ======================================================= */

export default class RepositorioRespostaPesquisa {

  /* =======================================================
   * OBTER PESQUISA PÚBLICA
   * ===================================================== */

  static async obterPorToken(
    token: string
  ) {
    const tokenNormalizado =
      token?.trim();


    if (
      !tokenNormalizado
    ) {
      return null;
    }


    /*
     * Primeiro procuramos como convite individual.
     */
    const convite =
      await prisma.convitePesquisa.findUnique({
        where: {
          token:
            tokenNormalizado,
        },

        include: {
          pesquisa: {
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

                  descricao:
                    true,
                },
              },
            },
          },
        },
      });


    if (
      convite
    ) {
      const pesquisa =
        convite.pesquisa;


      return {
        id:
          pesquisa.id,

        /*
         * IMPORTANTE:
         * necessário para a tela pública saber
         * qual escala visual deve apresentar.
         */
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

        /*
         * Sempre utilizamos o snapshot da aplicação.
         *
         * Portanto alterações futuras no modelo
         * não alteram uma aplicação já criada.
         */
        perguntas:
          normalizarPerguntas(
            pesquisa.perguntas
          ),

        cliente:
          pesquisa.cliente,

        modelo:
          pesquisa.modelo,

        convite: {
          id:
            convite.id,

          token:
            convite.token,

          respondido:
            convite.respondido,

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
        },
      };
    }


    /*
     * Se não for convite, procuramos pelo
     * link público geral da aplicação.
     */
    const pesquisa =
      await prisma.pesquisaCliente.findUnique({
        where: {
          token:
            tokenNormalizado,
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

              descricao:
                true,
            },
          },
        },
      });


    if (
      !pesquisa
    ) {
      return null;
    }


    return {
      id:
        pesquisa.id,

      /*
       * Também obrigatório no link público.
       */
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
        normalizarPerguntas(
          pesquisa.perguntas
        ),

      cliente:
        pesquisa.cliente,

      modelo:
        pesquisa.modelo,

      convite:
        null,
    };
  }


  /* =======================================================
   * SALVAR RESPOSTA
   * ===================================================== */

  static async salvar(
    resposta: NovaRespostaPesquisa
  ) {
    if (
      !resposta.pesquisaId?.trim()
    ) {
      throw new Error(
        "Pesquisa não informada."
      );
    }


    if (
      !resposta.token?.trim()
    ) {
      throw new Error(
        "Token não informado."
      );
    }


    const conviteToken =
      resposta.conviteToken?.trim() ||
      resposta.token.trim();


    /*
     * Primeiro verificamos se o token pertence
     * a um convite individual.
     */
    const convite =
      await prisma.convitePesquisa.findUnique({
        where: {
          token:
            conviteToken,
        },

        include: {
          pesquisa:
            true,
        },
      });


    if (
      convite
    ) {
      return this.salvarPorConvite(
        resposta,
        convite
      );
    }


    /*
     * Caso contrário, tratamos como resposta
     * pelo link público geral.
     */
    return this.salvarPorTokenPublico(
      resposta
    );
  }


  /* =======================================================
   * SALVAR POR CONVITE INDIVIDUAL
   * ===================================================== */

  private static async salvarPorConvite(
    resposta: NovaRespostaPesquisa,
    convite: any
  ) {
    const pesquisa =
      convite.pesquisa;


    if (
      !pesquisa
    ) {
      throw new Error(
        "Pesquisa não encontrada."
      );
    }


    if (
      pesquisa.id !==
      resposta.pesquisaId
    ) {
      throw new Error(
        "Token inválido para esta pesquisa."
      );
    }


    if (
      pesquisa.status !==
      StatusPesquisaCliente.ABERTA
    ) {
      throw new Error(
        "Esta pesquisa não está mais recebendo respostas."
      );
    }


    if (
      convite.respondido
    ) {
      throw new Error(
        "Esta pesquisa já foi respondida por este link."
      );
    }


    const perguntas =
      normalizarPerguntas(
        pesquisa.perguntas
      );


    if (
      perguntas.length ===
      0
    ) {
      throw new Error(
        "Esta pesquisa não possui perguntas."
      );
    }


    const configuracao =
      normalizarConfiguracaoAnalise(
        pesquisa.configuracaoAnalise
      );


    const respostasTratadas =
      this.validarRespostas(
        perguntas,
        resposta,
        configuracao
      );


    /*
     * A transação protege contra dois envios
     * simultâneos utilizando o mesmo convite.
     */
    return prisma.$transaction(
      async tx => {
        const conviteAtual =
          await tx.convitePesquisa.findUnique({
            where: {
              id:
                convite.id,
            },
          });


        if (
          !conviteAtual
        ) {
          throw new Error(
            "Convite não encontrado."
          );
        }


        if (
          conviteAtual.respondido
        ) {
          throw new Error(
            "Esta pesquisa já foi respondida por este link."
          );
        }


        /*
         * Dados previamente cadastrados no convite
         * têm prioridade.
         *
         * Caso estejam vazios, usamos os dados que
         * o participante informou no formulário.
         */
        const respostaCriada =
          await tx.respostaPesquisa.create({
            data: {
              pesquisaId:
                pesquisa.id,

              conviteId:
                convite.id,

              nome:
                textoOuNull(
                  conviteAtual.nome
                ) ||
                textoOuNull(
                  resposta.nome
                ),

              email:
                emailOuNull(
                  conviteAtual.email
                ) ||
                emailOuNull(
                  resposta.email
                ),

              unidade:
                textoOuNull(
                  conviteAtual.unidade
                ) ||
                textoOuNull(
                  resposta.unidade
                ),

              setor:
                textoOuNull(
                  conviteAtual.setor
                ) ||
                textoOuNull(
                  resposta.setor
                ),

              cargo:
                textoOuNull(
                  conviteAtual.cargo
                ) ||
                textoOuNull(
                  resposta.cargo
                ),

              respostas:
                respostasTratadas as unknown as Prisma.InputJsonValue,
            },
          });


        await tx.convitePesquisa.update({
          where: {
            id:
              convite.id,
          },

          data: {
            respondido:
              true,

            respondidoEm:
              new Date(),
          },
        });


        return respostaCriada;
      }
    );
  }


  /* =======================================================
   * SALVAR PELO LINK PÚBLICO
   * ===================================================== */

  private static async salvarPorTokenPublico(
    resposta: NovaRespostaPesquisa
  ) {
    const pesquisa =
      await prisma.pesquisaCliente.findUnique({
        where: {
          id:
            resposta.pesquisaId,
        },
      });


    if (
      !pesquisa
    ) {
      throw new Error(
        "Pesquisa não encontrada."
      );
    }


    if (
      pesquisa.token !==
      resposta.token
    ) {
      throw new Error(
        "Token inválido."
      );
    }


    if (
      pesquisa.status !==
      StatusPesquisaCliente.ABERTA
    ) {
      throw new Error(
        "Esta pesquisa não está mais recebendo respostas."
      );
    }


    const perguntas =
      normalizarPerguntas(
        pesquisa.perguntas
      );


    if (
      perguntas.length ===
      0
    ) {
      throw new Error(
        "Esta pesquisa não possui perguntas."
      );
    }


    const configuracao =
      normalizarConfiguracaoAnalise(
        pesquisa.configuracaoAnalise
      );


    const respostasTratadas =
      this.validarRespostas(
        perguntas,
        resposta,
        configuracao
      );


    return prisma.respostaPesquisa.create({
      data: {
        pesquisaId:
          resposta.pesquisaId,

        nome:
          textoOuNull(
            resposta.nome
          ),

        email:
          emailOuNull(
            resposta.email
          ),

        unidade:
          textoOuNull(
            resposta.unidade
          ),

        setor:
          textoOuNull(
            resposta.setor
          ),

        cargo:
          textoOuNull(
            resposta.cargo
          ),

        respostas:
          respostasTratadas as unknown as Prisma.InputJsonValue,
      },
    });
  }


  /* =======================================================
   * VALIDAÇÃO
   * ===================================================== */

  private static validarRespostas(
    perguntas: PerguntaRespostaPesquisa[],
    resposta: NovaRespostaPesquisa,
    configuracao: ConfiguracaoAnaliseBasica
  ) {
    const idsPerguntas =
      new Set(
        perguntas.map(
          pergunta =>
            pergunta.id
        )
      );


    /*
     * Bloqueia envio duplicado da mesma pergunta
     * dentro da mesma requisição.
     */
    const idsRecebidos =
      new Set<string>();


    const respostasTratadas =
      resposta.respostas
        .map(
          item => ({
            id:
              item.id ||
              randomUUID(),

            perguntaId:
              String(
                item.perguntaId ||
                ""
              ).trim(),

            valor:
              String(
                item.valor ??
                ""
              ).trim(),
          })
        )
        .filter(
          item => {
            if (
              !item.perguntaId ||
              !item.valor ||
              !idsPerguntas.has(
                item.perguntaId
              )
            ) {
              return false;
            }


            if (
              idsRecebidos.has(
                item.perguntaId
              )
            ) {
              throw new Error(
                "Foi enviada mais de uma resposta para a mesma pergunta."
              );
            }


            idsRecebidos.add(
              item.perguntaId
            );


            return true;
          }
        );


    for (
      const pergunta
      of perguntas
    ) {
      const respostaItem =
        respostasTratadas.find(
          item =>
            item.perguntaId ===
            pergunta.id
        );


      /*
       * Obrigatoriedade.
       */
      if (
        pergunta.obrigatoria &&
        !respostaItem
      ) {
        throw new Error(
          `A pergunta "${pergunta.titulo}" é obrigatória.`
        );
      }


      if (
        !respostaItem
      ) {
        continue;
      }


      /*
       * Pergunta de nota.
       */
      if (
        pergunta.tipo ===
        TipoPergunta.NOTA
      ) {
        const valor =
          Number(
            respostaItem.valor
          );


        if (
          !Number.isFinite(
            valor
          )
        ) {
          throw new Error(
            `A resposta da pergunta "${pergunta.titulo}" deve ser numérica.`
          );
        }


        /*
         * Agora validamos usando a escala
         * configurada na aplicação.
         *
         * Exemplo padrão:
         * 1 a 5.
         */
        if (
          valor <
            configuracao.escalaMinima ||
          valor >
            configuracao.escalaMaxima
        ) {
          throw new Error(
            `A resposta da pergunta "${pergunta.titulo}" deve estar entre ${configuracao.escalaMinima} e ${configuracao.escalaMaxima}.`
          );
        }
      }


      /*
       * Múltipla escolha.
       */
      if (
        pergunta.tipo ===
          TipoPergunta.MULTIPLA_ESCOLHA &&
        pergunta.opcoes.length >
          0 &&
        !pergunta.opcoes.includes(
          respostaItem.valor
        )
      ) {
        throw new Error(
          `Resposta inválida para "${pergunta.titulo}".`
        );
      }


      /*
       * Sim / Não.
       */
      if (
        pergunta.tipo ===
          TipoPergunta.SIM_NAO
      ) {
        const respostasValidas =
          [
            "Sim",
            "Não",
          ];


        if (
          !respostasValidas.includes(
            respostaItem.valor
          )
        ) {
          throw new Error(
            `Resposta inválida para "${pergunta.titulo}".`
          );
        }
      }
    }


    return respostasTratadas;
  }
}
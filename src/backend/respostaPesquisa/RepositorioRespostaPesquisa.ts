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
    Number(
      valor
    );


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

function normalizarSetores(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  const mapa = new Map<string, string>();
  for (const item of valor) {
    const nome = String(item ?? "").trim();
    if (!nome) continue;
    const chave = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
    if (!mapa.has(chave)) mapa.set(chave, nome);
  }
  return Array.from(mapa.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function validarSetorSelecionado(
  setor: string | null,
  setoresDisponiveis: string[]
) {
  if (!setor || setoresDisponiveis.length === 0) return;
  if (!setoresDisponiveis.includes(setor)) {
    throw new Error("O setor selecionado não é válido para esta organização.");
  }
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
    escalaMinima:
      1,

    escalaMaxima:
      5,
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


        const tipo =
          item.tipo ||
          TipoPergunta.NOTA;


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

          tipo,

          ordem:
            item.ordem ||
            index + 1,

          obrigatoria:
            item.obrigatoria ??
            true,

          /*
           * Opções são utilizadas apenas
           * em perguntas de múltipla escolha.
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

          /*
           * A pergunta apenas referencia
           * a dimensão.
           *
           * Peso e fator de risco pertencem
           * exclusivamente à dimensão.
           */
          dimensaoId:
            item.dimensaoId ??
            null,

          /*
           * O sentido é necessário principalmente
           * para perguntas de NOTA.
           */
          sentidoPontuacao,
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

                  setores:
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
         * Permite que a tela pública saiba
         * qual módulo está sendo respondido.
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
         * Utilizamos sempre o snapshot
         * preservado na aplicação.
         */
        perguntas:
          normalizarPerguntas(
            pesquisa.perguntas
          ),

        cliente: {
          ...pesquisa.cliente,
          setores: normalizarSetores(pesquisa.cliente.setores),
        },

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
     * Caso não seja convite individual,
     * procuramos pelo token público.
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

              setores:
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

      cliente: {
        ...pesquisa.cliente,
        setores: normalizarSetores(pesquisa.cliente.setores),
      },

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
     * Primeiro verificamos se o token
     * pertence a um convite individual.
     */
    const convite =
      await prisma.convitePesquisa.findUnique({
        where: {
          token:
            conviteToken,
        },

        include: {
          pesquisa: {
            include: {
              cliente: {
                select: {
                  setores: true,
                },
              },
            },
          },
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
     * Caso contrário, tratamos
     * como resposta pelo link público.
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


    if (!textoOuNull(convite.setor)) {
      validarSetorSelecionado(
        textoOuNull(resposta.setor),
        normalizarSetores(pesquisa.cliente?.setores)
      );
    }


    /*
     * A transação ajuda a evitar dois
     * envios simultâneos pelo mesmo convite.
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
         * Dados previamente cadastrados
         * no convite têm prioridade.
         *
         * Quando estiverem vazios,
         * utilizamos os informados
         * pelo participante.
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

        include: {
          cliente: {
            select: {
              setores: true,
            },
          },
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


    validarSetorSelecionado(
      textoOuNull(resposta.setor),
      normalizarSetores(pesquisa.cliente.setores)
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
     * Impede duas respostas para a mesma
     * pergunta dentro da mesma requisição.
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
       * Pergunta obrigatória.
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
       * NOTA
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
       * MÚLTIPLA ESCOLHA
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
       * SIM / NÃO
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
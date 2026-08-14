import {
  Prisma,
  TipoModuloPesquisa,
} from "@prisma/client";

import {
  randomUUID,
} from "crypto";

import {
  prisma,
} from "@/src/lib/prisma";

import {
  ConfiguracaoAnaliseModelo,
  criarConfiguracaoAnalisePadrao,
  DimensaoModelo,
  FaixaInterpretacaoModelo,
  ModeloPesquisa,
  ModeloPesquisaComResumo,
  ModeloPesquisaDetalhado,
  PerguntaModelo,
} from "@/src/core/model/ModeloPesquisa";


function numeroPositivo(
  valor: unknown,
  padrao: number
) {
  const numero =
    Number(
      valor
    );

  if (
    !Number.isFinite(
      numero
    )
  ) {
    return padrao;
  }

  return numero;
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
            numeroPositivo(
              item.peso,
              1
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
    )
    .map(
      (
        dimensao,
        index
      ) => ({
        ...dimensao,

        ordem:
          index +
          1,
      })
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
            numeroPositivo(
              item.minimo,
              0
            ),

          maximo:
            numeroPositivo(
              item.maximo,
              100
            ),

          classificacao:
            item.classificacao?.trim() ||
            `FAIXA_${index + 1}`,

          ordem:
            item.ordem ||
            index +
            1,
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
    )
    .map(
      (
        faixa,
        index
      ) => ({
        ...faixa,

        ordem:
          index +
          1,
      })
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
      (
        item
      ) =>
        Number(
          item
        )
    )
    .filter(
      (
        item
      ) =>
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

  const escalaMinima =
    numeroPositivo(
      item.escalaMinima,
      padrao.escalaMinima
    );

  const escalaMaxima =
    numeroPositivo(
      item.escalaMaxima,
      padrao.escalaMaxima
    );

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
      Math.min(
        escalaMinima,
        escalaMaxima
      ),

    escalaMaxima:
      Math.max(
        escalaMinima,
        escalaMaxima
      ),

    anonimatoMinimo:
      Math.max(
        1,
        Math.round(
          numeroPositivo(
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
): PerguntaModelo[] {
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
        (
          dimensao
        ) =>
          dimensao.id
      )
    );

  return perguntas.map(
    (
      pergunta,
      index
    ) => {
      const item =
        pergunta as Partial<PerguntaModelo>;

      const dimensaoId =
        item.dimensaoId &&
        idsDimensoes.has(
          item.dimensaoId
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
          "NOTA",

        ordem:
          item.ordem ||
          index +
          1,

        obrigatoria:
          item.obrigatoria ??
          true,

        opcoes:
          Array.isArray(
            item.opcoes
          )
            ? item.opcoes
                .map(
                  (
                    opcao
                  ) =>
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
          numeroPositivo(
            item.peso,
            1
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


function criarPerguntaPadrao(): PerguntaModelo {
  return {
    id:
      randomUUID(),

    titulo:
      "Nova pergunta",

    descricao:
      null,

    tipo:
      "NOTA",

    ordem:
      1,

    obrigatoria:
      true,

    opcoes: [],

    dimensaoId:
      null,

    peso:
      1,

    sentidoPontuacao:
      "POSITIVO",

    fatorRisco:
      null,
  };
}


export default class RepositorioModeloPesquisa {
  static async salvar(
    modelo: ModeloPesquisa
  ): Promise<ModeloPesquisaDetalhado> {
    const titulo =
      modelo.titulo?.trim();

    if (
      !titulo
    ) {
      throw new Error(
        "Título do modelo é obrigatório."
      );
    }


    const tipo =
      modelo.tipo ??
      TipoModuloPesquisa.CLIMA;


    /*
     * Evita alterar o tipo de um instrumento que
     * já possui aplicações históricas.
     */
    if (
      modelo.id
    ) {
      const existente =
        await prisma.modeloPesquisa.findUnique(
          {
            where: {
              id:
                modelo.id,
            },

            select: {
              tipo:
                true,

              _count: {
                select: {
                  pesquisas:
                    true,
                },
              },
            },
          }
        );

      if (
        !existente
      ) {
        throw new Error(
          "Modelo não encontrado."
        );
      }

      if (
        existente.tipo !==
          tipo &&
        existente._count
          .pesquisas >
          0
      ) {
        throw new Error(
          "O tipo do modelo não pode ser alterado porque já existem aplicações vinculadas."
        );
      }
    }


    const dimensoes =
      normalizarDimensoes(
        modelo.dimensoes
      );


    const perguntas =
      normalizarPerguntas(
        modelo.perguntas,
        dimensoes
      );


    const configuracaoAnalise =
      normalizarConfiguracaoAnalise(
        modelo.configuracaoAnalise,
        tipo
      );


    const dados = {
      titulo,

      descricao:
        modelo.descricao?.trim() ||
        null,

      tipo,

      ativo:
        modelo.ativo ??
        true,

      modeloPadrao:
        modelo.modeloPadrao ??
        false,

      perguntas:
        (
          perguntas.length >
          0
            ? perguntas
            : [
                criarPerguntaPadrao(),
              ]
        ) as unknown as Prisma.InputJsonValue,

      dimensoes:
        dimensoes as unknown as Prisma.InputJsonValue,

      configuracaoAnalise:
        configuracaoAnalise as unknown as Prisma.InputJsonValue,
    };


    const resultado =
      modelo.id
        ? await prisma.modeloPesquisa.update(
            {
              where: {
                id:
                  modelo.id,
              },

              data:
                dados,
            }
          )
        : await prisma.modeloPesquisa.create(
            {
              data:
                dados,
            }
          );


    const dimensoesResultado =
      normalizarDimensoes(
        resultado.dimensoes
      );


    return {
      id:
        resultado.id,

      titulo:
        resultado.titulo,

      descricao:
        resultado.descricao,

      tipo:
        resultado.tipo,

      ativo:
        resultado.ativo,

      modeloPadrao:
        resultado.modeloPadrao,

      perguntas:
        normalizarPerguntas(
          resultado.perguntas,
          dimensoesResultado
        ),

      dimensoes:
        dimensoesResultado,

      configuracaoAnalise:
        normalizarConfiguracaoAnalise(
          resultado.configuracaoAnalise,
          resultado.tipo
        ),

      criadoEm:
        resultado.criadoEm,

      atualizadoEm:
        resultado.atualizadoEm,
    };
  }


  static async obterTodos(): Promise<
    ModeloPesquisaComResumo[]
  > {
    const modelos =
      await prisma.modeloPesquisa.findMany(
        {
          orderBy: {
            criadoEm:
              "desc",
          },

          include: {
            _count: {
              select: {
                pesquisas:
                  true,
              },
            },
          },
        }
      );


    return modelos.map(
      (
        modelo
      ) => {
        const dimensoes =
          normalizarDimensoes(
            modelo.dimensoes
          );

        const perguntas =
          normalizarPerguntas(
            modelo.perguntas,
            dimensoes
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

          perguntas,

          dimensoes,

          configuracaoAnalise:
            normalizarConfiguracaoAnalise(
              modelo.configuracaoAnalise,
              modelo.tipo
            ),

          criadoEm:
            modelo.criadoEm,

          atualizadoEm:
            modelo.atualizadoEm,

          totalPerguntas:
            perguntas.length,

          totalPesquisas:
            modelo._count
              .pesquisas,
        };
      }
    );
  }


  static async excluir(
    id: string
  ) {
    const modelo =
      await prisma.modeloPesquisa.findUnique(
        {
          where: {
            id,
          },

          include: {
            _count: {
              select: {
                pesquisas:
                  true,
              },
            },
          },
        }
      );


    if (
      !modelo
    ) {
      throw new Error(
        "Modelo não encontrado."
      );
    }


    if (
      modelo._count
        .pesquisas >
      0
    ) {
      throw new Error(
        "Não é possível excluir este modelo, pois ele já possui aplicações vinculadas."
      );
    }


    await prisma.modeloPesquisa.delete(
      {
        where: {
          id,
        },
      }
    );


    return id;
  }


  static async obterPorId(
    id: string
  ): Promise<ModeloPesquisaDetalhado> {
    const modelo =
      await prisma.modeloPesquisa.findUnique(
        {
          where: {
            id,
          },
        }
      );


    if (
      !modelo
    ) {
      throw new Error(
        "Modelo não encontrado."
      );
    }


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

      criadoEm:
        modelo.criadoEm,

      atualizadoEm:
        modelo.atualizadoEm,
    };
  }


  static async adicionarPergunta(
    modeloId: string
  ) {
    const modelo =
      await this.obterPorId(
        modeloId
      );


    const novaPergunta: PerguntaModelo =
      {
        ...criarPerguntaPadrao(),

        ordem:
          modelo.perguntas
            .length +
          1,
      };


    const perguntas = [
      ...modelo.perguntas,

      novaPergunta,
    ];


    await prisma.modeloPesquisa.update(
      {
        where: {
          id:
            modeloId,
        },

        data: {
          perguntas:
            perguntas as unknown as Prisma.InputJsonValue,
        },
      }
    );


    return novaPergunta;
  }


  static async salvarPergunta(
    modeloId: string,
    pergunta: PerguntaModelo
  ) {
    const modelo =
      await this.obterPorId(
        modeloId
      );


    const dimensaoValida =
      pergunta.dimensaoId
        ? modelo.dimensoes.some(
            (
              dimensao
            ) =>
              dimensao.id ===
              pergunta.dimensaoId
          )
        : true;


    if (
      !dimensaoValida
    ) {
      throw new Error(
        "A dimensão selecionada não pertence a este modelo."
      );
    }


    const perguntas =
      modelo.perguntas.map(
        (
          item
        ) =>
          item.id ===
          pergunta.id
            ? {
                ...item,

                titulo:
                  pergunta.titulo?.trim() ||
                  "Nova pergunta",

                descricao:
                  pergunta.descricao?.trim() ||
                  null,

                tipo:
                  pergunta.tipo,

                obrigatoria:
                  pergunta.obrigatoria ??
                  true,

                opcoes:
                  Array.isArray(
                    pergunta.opcoes
                  )
                    ? pergunta.opcoes
                        .map(
                          (
                            opcao
                          ) =>
                            opcao.trim()
                        )
                        .filter(
                          Boolean
                        )
                    : [],

                dimensaoId:
                  pergunta.dimensaoId ||
                  null,

                peso:
                  numeroPositivo(
                    pergunta.peso,
                    1
                  ),

                sentidoPontuacao:
                  pergunta.sentidoPontuacao ===
                  "NEGATIVO"
                    ? "NEGATIVO"
                    : "POSITIVO",

                fatorRisco:
                  pergunta.fatorRisco?.trim() ||
                  null,
              }
            : item
      );


    const perguntaSalva =
      perguntas.find(
        (
          item
        ) =>
          item.id ===
          pergunta.id
      );


    if (
      !perguntaSalva
    ) {
      throw new Error(
        "Pergunta não encontrada."
      );
    }


    await prisma.modeloPesquisa.update(
      {
        where: {
          id:
            modeloId,
        },

        data: {
          perguntas:
            perguntas as unknown as Prisma.InputJsonValue,
        },
      }
    );


    return perguntaSalva;
  }


  static async excluirPergunta(
    modeloId: string,
    perguntaId: string
  ) {
    const modelo =
      await this.obterPorId(
        modeloId
      );


    const perguntas =
      modelo.perguntas
        .filter(
          (
            pergunta
          ) =>
            pergunta.id !==
            perguntaId
        )
        .map(
          (
            pergunta,
            index
          ) => ({
            ...pergunta,

            ordem:
              index +
              1,
          })
        );


    await prisma.modeloPesquisa.update(
      {
        where: {
          id:
            modeloId,
        },

        data: {
          perguntas:
            perguntas as unknown as Prisma.InputJsonValue,
        },
      }
    );


    return modeloId;
  }


  static async duplicar(
    id: string
  ) {
    const modelo =
      await this.obterPorId(
        id
      );


    /*
     * Criamos novos IDs de dimensão e atualizamos
     * as perguntas que apontavam para elas.
     */
    const mapaDimensoes =
      new Map<
        string,
        string
      >();


    const dimensoes =
      modelo.dimensoes.map(
        (
          dimensao,
          index
        ) => {
          const novoId =
            randomUUID();

          mapaDimensoes.set(
            dimensao.id,
            novoId
          );

          return {
            ...dimensao,

            id:
              novoId,

            ordem:
              index +
              1,
          };
        }
      );


    const perguntas =
      modelo.perguntas.map(
        (
          pergunta,
          index
        ) => ({
          ...pergunta,

          id:
            randomUUID(),

          ordem:
            index +
            1,

          dimensaoId:
            pergunta.dimensaoId
              ? mapaDimensoes.get(
                  pergunta.dimensaoId
                ) ||
                null
              : null,
        })
      );


    return this.salvar({
      titulo:
        `${modelo.titulo} - Cópia`,

      descricao:
        modelo.descricao,

      tipo:
        modelo.tipo,

      ativo:
        true,

      modeloPadrao:
        false,

      perguntas,

      dimensoes,

      configuracaoAnalise:
        modelo.configuracaoAnalise,
    });
  }
}
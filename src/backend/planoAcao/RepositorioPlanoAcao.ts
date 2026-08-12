import {
  TipoModuloPesquisa,
  TipoOrigemPlanoAcao,
} from "@prisma/client";

import {
  prisma,
} from "@/src/lib/prisma";

import {
  AcaoPlanoAcao,
  PlanoAcao,
  PlanoAcaoDetalhado,
  PlanoAcaoResumo,
} from "@/src/core/model/PlanoAcao";

function normalizarAcoes(
  acoes?: AcaoPlanoAcao[]
) {
  return (
    acoes || []
  ).map(
    (
      acao,
      index
    ) => ({
      id:
        acao.id ||
        `acao-${Date.now()}-${index}`,

      titulo:
        acao.titulo?.trim() ||
        "Nova ação",

      descricao:
        acao.descricao?.trim() ||
        null,

      responsavel:
        acao.responsavel?.trim() ||
        null,

      prioridade:
        acao.prioridade ||
        "MEDIA",

      prazo:
        acao.prazo?.trim() ||
        null,

      status:
        acao.status ||
        "PENDENTE",
    })
  );
}

const includePlano = {
  pesquisa: {
    include: {
      cliente:
        true,
    },
  },

  denuncia: {
    include: {
      cliente:
        true,
    },
  },
} as const;

const TIPOS_ORIGEM_PESQUISA: TipoOrigemPlanoAcao[] =
  [
    TipoOrigemPlanoAcao.PESQUISA_CLIMA,
    TipoOrigemPlanoAcao.DIAGNOSTICO_ORGANIZACIONAL,
    TipoOrigemPlanoAcao.AVALIACAO_PSICOSSOCIAL,
  ];

function origemUsaPesquisa(
  tipoOrigem: TipoOrigemPlanoAcao
) {
  return TIPOS_ORIGEM_PESQUISA.includes(
    tipoOrigem
  );
}

function obterTipoModuloEsperado(
  tipoOrigem: TipoOrigemPlanoAcao
): TipoModuloPesquisa | null {
  switch (
    tipoOrigem
  ) {
    case TipoOrigemPlanoAcao.PESQUISA_CLIMA:
      return TipoModuloPesquisa.CLIMA;

    case TipoOrigemPlanoAcao.DIAGNOSTICO_ORGANIZACIONAL:
      return TipoModuloPesquisa.DIAGNOSTICO_ORGANIZACIONAL;

    case TipoOrigemPlanoAcao.AVALIACAO_PSICOSSOCIAL:
      return TipoModuloPesquisa.AVALIACAO_PSICOSSOCIAL;

    default:
      return null;
  }
}

function nomeOrigem(
  tipoOrigem: TipoOrigemPlanoAcao
) {
  switch (
    tipoOrigem
  ) {
    case TipoOrigemPlanoAcao.PESQUISA_CLIMA:
      return "pesquisa de clima";

    case TipoOrigemPlanoAcao.DIAGNOSTICO_ORGANIZACIONAL:
      return "diagnóstico organizacional";

    case TipoOrigemPlanoAcao.AVALIACAO_PSICOSSOCIAL:
      return "avaliação psicossocial";

    case TipoOrigemPlanoAcao.DENUNCIA:
      return "denúncia";

    default:
      return "origem";
  }
}

function montarResumo(
  plano: any
): PlanoAcaoResumo {
  const acoes =
    Array.isArray(
      plano.acoes
    )
      ? plano.acoes
      : [];

  return {
    id:
      plano.id,

    tipoOrigem:
      plano.tipoOrigem,

    pesquisaId:
      plano.pesquisaId,

    denunciaId:
      plano.denunciaId,

    titulo:
      plano.titulo,

    diagnostico:
      plano.diagnostico,

    objetivo:
      plano.objetivo,

    conclusao:
      plano.conclusao,

    status:
      plano.status,

    criadoEm:
      plano.criadoEm,

    atualizadoEm:
      plano.atualizadoEm,

    totalAcoes:
      acoes.length,

    pesquisa:
      plano.pesquisa
        ? {
            id:
              plano.pesquisa.id,

            titulo:
              plano.pesquisa.titulo,

            status:
              plano.pesquisa.status,

            tipo:
              plano.pesquisa.tipo,

            cliente: {
              id:
                plano.pesquisa.cliente.id,

              nome:
                plano.pesquisa.cliente.nome,

              empresa:
                plano.pesquisa.cliente.empresa,
            },
          }
        : null,

    denuncia:
      plano.denuncia
        ? {
            id:
              plano.denuncia.id,

            protocolo:
              plano.denuncia.protocolo,

            titulo:
              plano.denuncia.titulo,

            status:
              plano.denuncia.status,

            gravidade:
              plano.denuncia.gravidade,

            cliente: {
              id:
                plano.denuncia.cliente.id,

              nome:
                plano.denuncia.cliente.nome,

              empresa:
                plano.denuncia.cliente.empresa,
            },
          }
        : null,
  };
}

function montarDetalhado(
  plano: any
): PlanoAcaoDetalhado {
  return {
    ...montarResumo(
      plano
    ),

    acoes:
      Array.isArray(
        plano.acoes
      )
        ? (plano.acoes as AcaoPlanoAcao[])
        : [],
  };
}

function validarOrigem(
  plano: PlanoAcao
) {
  if (
    origemUsaPesquisa(
      plano.tipoOrigem
    )
  ) {
    if (
      !plano.pesquisaId
    ) {
      throw new Error(
        `Selecione a aplicação de ${nomeOrigem(
          plano.tipoOrigem
        )} do plano.`
      );
    }

    if (
      plano.denunciaId
    ) {
      throw new Error(
        "Um plano vinculado a uma aplicação não pode estar vinculado simultaneamente a uma denúncia."
      );
    }

    return;
  }

  if (
    plano.tipoOrigem ===
    TipoOrigemPlanoAcao.DENUNCIA
  ) {
    if (
      !plano.denunciaId
    ) {
      throw new Error(
        "Selecione a denúncia do plano."
      );
    }

    if (
      plano.pesquisaId
    ) {
      throw new Error(
        "Um plano de denúncia não pode estar vinculado a uma pesquisa, diagnóstico ou avaliação psicossocial."
      );
    }

    return;
  }

  throw new Error(
    "Tipo de origem do plano inválido."
  );
}

async function validarPesquisaDoPlano(
  pesquisaId: string,
  tipoOrigem: TipoOrigemPlanoAcao
) {
  const tipoEsperado =
    obterTipoModuloEsperado(
      tipoOrigem
    );

  if (
    !tipoEsperado
  ) {
    throw new Error(
      "Tipo de aplicação inválido para este plano."
    );
  }

  const pesquisa =
    await prisma.pesquisaCliente.findUnique(
      {
        where: {
          id:
            pesquisaId,
        },

        select: {
          id:
            true,

          titulo:
            true,

          tipo:
            true,
        },
      }
    );

  if (
    !pesquisa
  ) {
    throw new Error(
      "Aplicação não encontrada."
    );
  }

  if (
    pesquisa.tipo !==
    tipoEsperado
  ) {
    throw new Error(
      `A aplicação selecionada não pertence ao módulo de ${nomeOrigem(
        tipoOrigem
      )}.`
    );
  }

  return pesquisa;
}

export default class RepositorioPlanoAcao {
  static async salvar(
    plano: PlanoAcao
  ): Promise<PlanoAcaoDetalhado> {
    const titulo =
      plano.titulo?.trim();

    if (
      !titulo
    ) {
      throw new Error(
        "Título do plano de ação é obrigatório."
      );
    }

    validarOrigem(
      plano
    );

    const origemPesquisa =
      origemUsaPesquisa(
        plano.tipoOrigem
      );

    if (
      origemPesquisa
    ) {
      await validarPesquisaDoPlano(
        plano.pesquisaId!,
        plano.tipoOrigem
      );
    }

    if (
      plano.tipoOrigem ===
      TipoOrigemPlanoAcao.DENUNCIA
    ) {
      const denuncia =
        await prisma.denuncia.findUnique(
          {
            where: {
              id:
                plano.denunciaId!,
            },

            select: {
              id:
                true,
            },
          }
        );

      if (
        !denuncia
      ) {
        throw new Error(
          "Denúncia não encontrada."
        );
      }
    }

    if (
      plano.id
    ) {
      const planoExistente =
        await prisma.planoAcao.findUnique(
          {
            where: {
              id:
                plano.id,
            },
          }
        );

      if (
        !planoExistente
      ) {
        throw new Error(
          "Plano de ação não encontrado."
        );
      }

      /*
       * O tipo da origem é imutável depois da criação.
       *
       * Exemplo:
       * um plano criado para Diagnóstico Organizacional
       * não pode posteriormente virar um plano de
       * Avaliação Psicossocial ou Denúncia.
       */
      if (
        planoExistente.tipoOrigem !==
        plano.tipoOrigem
      ) {
        throw new Error(
          "O tipo de origem do plano não pode ser alterado depois da criação."
        );
      }

      /*
       * Também bloqueamos a substituição da aplicação
       * ou denúncia original depois que o plano foi criado.
       */
      if (
        planoExistente.pesquisaId !==
          (plano.pesquisaId ||
            null) ||
        planoExistente.denunciaId !==
          (plano.denunciaId ||
            null)
      ) {
        throw new Error(
          "A origem vinculada ao plano não pode ser alterada depois da criação."
        );
      }
    }

    const dados = {
      tipoOrigem:
        plano.tipoOrigem,

      pesquisaId:
        origemPesquisa
          ? plano.pesquisaId!
          : null,

      denunciaId:
        plano.tipoOrigem ===
        TipoOrigemPlanoAcao.DENUNCIA
          ? plano.denunciaId!
          : null,

      titulo,

      diagnostico:
        plano.diagnostico?.trim() ||
        null,

      objetivo:
        plano.objetivo?.trim() ||
        null,

      conclusao:
        plano.conclusao?.trim() ||
        null,

      status:
        plano.status ||
        "RASCUNHO",

      acoes:
        normalizarAcoes(
          plano.acoes
        ),
    };

    const resultado =
      plano.id
        ? await prisma.planoAcao.update(
            {
              where: {
                id:
                  plano.id,
              },

              data:
                dados,

              include:
                includePlano,
            }
          )
        : await prisma.planoAcao.create(
            {
              data:
                dados,

              include:
                includePlano,
            }
          );

    return montarDetalhado(
      resultado
    );
  }

  static async obterTodos(): Promise<
    PlanoAcaoResumo[]
  > {
    const planos =
      await prisma.planoAcao.findMany(
        {
          orderBy: {
            criadoEm:
              "desc",
          },

          include:
            includePlano,
        }
      );

    return planos.map(
      montarResumo
    );
  }

  static async obterMeus(
    clienteId: string
  ): Promise<
    PlanoAcaoResumo[]
  > {
    const planos =
      await prisma.planoAcao.findMany(
        {
          where: {
            OR: [
              {
                pesquisa: {
                  clienteId,
                },
              },

              {
                denuncia: {
                  clienteId,
                },
              },
            ],
          },

          orderBy: {
            criadoEm:
              "desc",
          },

          include:
            includePlano,
        }
      );

    return planos.map(
      montarResumo
    );
  }

  static async obterPorId(
    id: string
  ): Promise<PlanoAcaoDetalhado> {
    const plano =
      await prisma.planoAcao.findUnique(
        {
          where: {
            id,
          },

          include:
            includePlano,
        }
      );

    if (
      !plano
    ) {
      throw new Error(
        "Plano de ação não encontrado."
      );
    }

    return montarDetalhado(
      plano
    );
  }

  static async obterPorIdECliente(
    id: string,
    clienteId: string
  ): Promise<PlanoAcaoDetalhado> {
    const plano =
      await prisma.planoAcao.findFirst(
        {
          where: {
            id,

            OR: [
              {
                pesquisa: {
                  clienteId,
                },
              },

              {
                denuncia: {
                  clienteId,
                },
              },
            ],
          },

          include:
            includePlano,
        }
      );

    if (
      !plano
    ) {
      throw new Error(
        "Plano de ação não encontrado."
      );
    }

    return montarDetalhado(
      plano
    );
  }

  /*
   * PesquisaCliente agora é a tabela-base das três aplicações:
   *
   * - Pesquisa de Clima
   * - Diagnóstico Organizacional
   * - Avaliação Psicossocial
   *
   * Portanto não devemos limitar este método a PESQUISA_CLIMA.
   */
  static async obterPorPesquisa(
    pesquisaId: string
  ): Promise<
    PlanoAcaoResumo[]
  > {
    const planos =
      await prisma.planoAcao.findMany(
        {
          where: {
            pesquisaId,

            tipoOrigem: {
              in:
                TIPOS_ORIGEM_PESQUISA,
            },
          },

          orderBy: {
            criadoEm:
              "desc",
          },

          include:
            includePlano,
        }
      );

    return planos.map(
      montarResumo
    );
  }

  static async obterPorDenuncia(
    denunciaId: string
  ): Promise<
    PlanoAcaoResumo[]
  > {
    const planos =
      await prisma.planoAcao.findMany(
        {
          where: {
            tipoOrigem:
              TipoOrigemPlanoAcao.DENUNCIA,

            denunciaId,
          },

          orderBy: {
            criadoEm:
              "desc",
          },

          include:
            includePlano,
        }
      );

    return planos.map(
      montarResumo
    );
  }

  static async excluir(
    id: string
  ): Promise<string> {
    const plano =
      await prisma.planoAcao.findUnique(
        {
          where: {
            id,
          },

          select: {
            id:
              true,
          },
        }
      );

    if (
      !plano
    ) {
      throw new Error(
        "Plano de ação não encontrado."
      );
    }

    await prisma.planoAcao.delete(
      {
        where: {
          id,
        },
      }
    );

    return id;
  }
}
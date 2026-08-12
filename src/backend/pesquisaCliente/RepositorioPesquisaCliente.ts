import { randomUUID } from "crypto";

import {
  Prisma,
  StatusPesquisaCliente,
  TipoModuloPesquisa,
  TipoPergunta,
} from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

import {
  PerguntaPesquisaCliente,
  PesquisaCliente,
  RespostaPesquisaCliente,
  RespostaPesquisaItem,
} from "@/src/core/model/PesquisaCliente";

function normalizarPerguntas(
  perguntas: unknown
): PerguntaPesquisaCliente[] {
  if (!Array.isArray(perguntas)) {
    return [];
  }

  return perguntas.map((pergunta, index) => {
    const item =
      pergunta as Partial<PerguntaPesquisaCliente>;

    return {
      id:
        item.id ||
        randomUUID(),

      titulo:
        item.titulo ||
        "Nova pergunta",

      descricao:
        item.descricao ||
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
          : [],
    };
  });
}

function normalizarRespostas(
  respostas: unknown
): RespostaPesquisaItem[] {
  if (!Array.isArray(respostas)) {
    return [];
  }

  return respostas.map((resposta) => {
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
        ),
    };
  });
}

function criarDataInicio(
  data?: string
): Date | undefined {
  if (!data) {
    return undefined;
  }

  const resultado =
    new Date(
      `${data}T00:00:00-03:00`
    );

  if (
    Number.isNaN(
      resultado.getTime()
    )
  ) {
    return undefined;
  }

  return resultado;
}

function criarDataFim(
  data?: string
): Date | undefined {
  if (!data) {
    return undefined;
  }

  const resultado =
    new Date(
      `${data}T23:59:59.999-03:00`
    );

  if (
    Number.isNaN(
      resultado.getTime()
    )
  ) {
    return undefined;
  }

  return resultado;
}

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
          (pergunta) =>
            pergunta.tipo ===
            TipoPergunta.NOTA
        )
        .map(
          (pergunta) =>
            pergunta.id
        )
    );

  let soma = 0;
  let quantidade = 0;

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
        Number.isNaN(
          valor
        )
      ) {
        continue;
      }

      soma += valor;
      quantidade++;
    }
  }

  return {
    soma,
    quantidade,

    media:
      quantidade > 0
        ? soma /
          quantidade
        : null,
  };
}

export default class RepositorioPesquisaCliente {
  static async salvar(
    pesquisa: PesquisaCliente,

    tipoEsperado: TipoModuloPesquisa =
      TipoModuloPesquisa.CLIMA
  ) {
    const titulo =
      pesquisa.titulo?.trim();

    if (!titulo) {
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
        prisma.cliente.findUnique(
          {
            where: {
              id:
                pesquisa.clienteId,
            },
          }
        ),

        prisma.modeloPesquisa.findUnique(
          {
            where: {
              id:
                pesquisa.modeloId,
            },
          }
        ),
      ]);

    if (!cliente) {
      throw new Error(
        "Cliente não encontrado."
      );
    }

    if (!modelo) {
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

    const perguntasModelo =
      normalizarPerguntas(
        modelo.perguntas
      );

    if (
      perguntasModelo.length ===
      0
    ) {
      throw new Error(
        "O modelo selecionado não possui perguntas."
      );
    }

    const perguntas =
      normalizarPerguntas(
        pesquisa.perguntas &&
          pesquisa.perguntas.length >
            0
          ? pesquisa.perguntas
          : perguntasModelo
      );

    const dados = {
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

      perguntas:
        perguntas as unknown as Prisma.InputJsonValue,
    };

    if (pesquisa.id) {
      const atual =
        await prisma.pesquisaCliente.findUnique(
          {
            where: {
              id:
                pesquisa.id,
            },
          }
        );

      if (!atual) {
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

      const resultado =
        await prisma.pesquisaCliente.update(
          {
            where: {
              id:
                pesquisa.id,
            },

            data:
              dados,

            include:
              this.includeCompleto(),
          }
        );

      return this.formatarDetalhada(
        resultado
      );
    }

    const resultado =
      await prisma.pesquisaCliente.create(
        {
          data: {
            ...dados,

            token:
              pesquisa.token ||
              randomUUID(),
          },

          include:
            this.includeCompleto(),
        }
      );

    return this.formatarDetalhada(
      resultado
    );
  }

  static async obterTodos(
    tipo: TipoModuloPesquisa =
      TipoModuloPesquisa.CLIMA
  ) {
    const pesquisas =
      await prisma.pesquisaCliente.findMany(
        {
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
                id: true,
                nome: true,
              },
            },

            modelo: {
              select: {
                id: true,
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
        }
      );

    return pesquisas.map(
      (pesquisa) => ({
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
          pesquisa._count
            .respostas,
      })
    );
  }

  static async obterPorId(
    id: string,

    tipo?: TipoModuloPesquisa
  ) {
    const pesquisa =
      await prisma.pesquisaCliente.findFirst(
        {
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
        }
      );

    if (!pesquisa) {
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
      await prisma.pesquisaCliente.findFirst(
        {
          where: {
            id,

            ...(tipo
              ? {
                  tipo,
                }
              : {}),
          },
        }
      );

    if (!pesquisa) {
      throw new Error(
        "Aplicação não encontrada."
      );
    }

    await prisma.pesquisaCliente.delete(
      {
        where: {
          id,
        },
      }
    );

    return id;
  }

  static async alterarStatus(
    id: string,

    status: StatusPesquisaCliente,

    tipo?: TipoModuloPesquisa
  ) {
    const pesquisaAtual =
      await prisma.pesquisaCliente.findFirst(
        {
          where: {
            id,

            ...(tipo
              ? {
                  tipo,
                }
              : {}),
          },
        }
      );

    if (!pesquisaAtual) {
      throw new Error(
        "Aplicação não encontrada."
      );
    }

    const pesquisa =
      await prisma.pesquisaCliente.update(
        {
          where: {
            id,
          },

          data: {
            status,
          },

          include:
            this.includeCompleto(),
        }
      );

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
        prisma.cliente.findMany(
          {
            where: {
              ativo:
                true,
            },

            orderBy: {
              nome:
                "asc",
            },
          }
        ),

        prisma.modeloPesquisa.findMany(
          {
            where: {
              ativo:
                true,

              tipo,
            },

            orderBy: {
              titulo:
                "asc",
            },
          }
        ),
      ]);

    return {
      clientes,

      modelos:
        modelos.map(
          (modelo) => ({
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
                modelo.perguntas
              ),
          })
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
        prisma.pesquisaCliente.findMany(
          {
            where,

            orderBy: {
              criadoEm:
                "desc",
            },

            include: {
              cliente: {
                select: {
                  id: true,
                  nome: true,
                  empresa:
                    true,
                },
              },

              modelo: {
                select: {
                  id: true,
                  titulo:
                    true,
                },
              },

              respostas: {
                select: {
                  id: true,
                  respostas:
                    true,
                },
              },

              convites: {
                select: {
                  id: true,
                  respondido:
                    true,
                },
              },
            },
          }
        ),

        prisma.cliente.findMany(
          {
            orderBy: {
              nome:
                "asc",
            },

            select: {
              id: true,
              nome: true,
              empresa:
                true,
            },
          }
        ),
      ]);

    let somaNotasGeral =
      0;

    let quantidadeNotasGeral =
      0;

    const pesquisas =
      pesquisasBanco.map(
        (pesquisa) => {
          const totalRespostas =
            pesquisa.respostas
              .length;

          const totalConvites =
            pesquisa.convites
              .length;

          const totalConvitesRespondidos =
            pesquisa.convites.filter(
              (convite) =>
                convite.respondido
            ).length;

          const taxaParticipacao =
            totalConvites >
            0
              ? (totalConvitesRespondidos /
                  totalConvites) *
                100
              : null;

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
                pesquisa.cliente
                  .empresa,
            },

            modelo: {
              id:
                pesquisa.modelo.id,

              titulo:
                pesquisa.modelo
                  .titulo,
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
        (pesquisa) =>
          pesquisa.status ===
          StatusPesquisaCliente.ABERTA
      ).length;

    const totalFechadas =
      pesquisas.filter(
        (pesquisa) =>
          pesquisa.status ===
          StatusPesquisaCliente.FECHADA
      ).length;

    const totalArquivadas =
      pesquisas.filter(
        (pesquisa) =>
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
      totalConvites > 0
        ? (totalConvitesRespondidos /
            totalConvites) *
          100
        : null;

    const mediaGeral =
      quantidadeNotasGeral >
      0
        ? somaNotasGeral /
          quantidadeNotasGeral
        : null;

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
            pesquisa.cliente
              .empresa,

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

      atual.totalPesquisas +=
        1;

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
          (item) => ({
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
                ? (item.totalConvitesRespondidos /
                    item.totalConvites) *
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
          (a, b) =>
            b.totalRespostas -
            a.totalRespostas
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
      !quantidade ||
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
      await prisma.pesquisaCliente.findFirst(
        {
          where: {
            id:
              pesquisaId,

            ...(tipo
              ? {
                  tipo,
                }
              : {}),
          },
        }
      );

    if (!pesquisa) {
      throw new Error(
        "Aplicação não encontrada."
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
        })
      );

    await prisma.convitePesquisa.createMany(
      {
        data:
          convites,
      }
    );

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
      await prisma.pesquisaCliente.findMany(
        {
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
                id: true,
                nome: true,
              },
            },

            modelo: {
              select: {
                id: true,
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
        }
      );

    return pesquisas.map(
      (pesquisa) => ({
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
          pesquisa._count
            .respostas,
      })
    );
  }

  static async obterPorIdECliente(
    id: string,

    clienteId: string,

    tipo?: TipoModuloPesquisa
  ) {
    const pesquisa =
      await prisma.pesquisaCliente.findFirst(
        {
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
        }
      );

    if (!pesquisa) {
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

  private static montarRelatorio(
    pesquisa: any
  ) {
    const perguntas: PerguntaPesquisaCliente[] =
      Array.isArray(pesquisa.perguntas)
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
        (
          pergunta: PerguntaPesquisaCliente
        ): ResumoPergunta => {
          const respostasDaPergunta: RespostaPesquisaItem[] =
            (
              pesquisa.respostas as RespostaPesquisaCliente[]
            ).flatMap(
              (
                respostaCliente: RespostaPesquisaCliente
              ) =>
                respostaCliente.respostas.filter(
                  (
                    resposta: RespostaPesquisaItem
                  ) =>
                    resposta.perguntaId ===
                    pergunta.id
                )
            );

          const valoresNumericos: number[] =
            pergunta.tipo ===
            TipoPergunta.NOTA
              ? respostasDaPergunta
                  .map(
                    (
                      resposta: RespostaPesquisaItem
                    ) =>
                      Number(
                        resposta.valor
                      )
                  )
                  .filter(
                    (
                      valor: number
                    ) =>
                      !Number.isNaN(
                        valor
                      )
                  )
              : [];

          const media =
            valoresNumericos.length >
            0
              ? valoresNumericos.reduce(
                  (
                    total: number,
                    valor: number
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
        (
          item: ResumoPergunta
        ) =>
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
              total: number,
              item: ResumoPergunta
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
    const perguntasPesquisa =
      normalizarPerguntas(
        pesquisa.perguntas
      );

    const perguntasModelo =
      normalizarPerguntas(
        pesquisa.modelo?.perguntas
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
        pesquisa.convites
          ?.length ||
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
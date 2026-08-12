import {
  Prisma,
  TipoPerguntaCanalDenuncia,
} from "@prisma/client";

import {
  prisma,
} from "@/src/lib/prisma";

import type {
  PerguntaCanalDenuncia,
  PerguntaCanalPublica,
} from "@/src/core/model/PerguntaCanalDenuncia";

function converterOpcoes(
  valor: Prisma.JsonValue
): string[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return valor.filter(
    (item): item is string =>
      typeof item === "string"
  );
}

function normalizarOpcoes(
  tipo: TipoPerguntaCanalDenuncia,
  opcoes: string[]
): string[] {
  if (
    tipo !== "MULTIPLA_ESCOLHA"
  ) {
    return [];
  }

  const resultado =
    Array.from(
      new Set(
        (opcoes || [])
          .map((item) =>
            item.trim()
          )
          .filter(Boolean)
      )
    );

  if (resultado.length < 2) {
    throw new Error(
      "Perguntas de múltipla escolha precisam de pelo menos duas opções."
    );
  }

  return resultado;
}

function normalizarComplementoSim(
  tipo: TipoPerguntaCanalDenuncia,
  abrirComplementoSim: boolean
): boolean {
  /**
   * Evita manter configuração inconsistente.
   *
   * Por exemplo:
   * uma pergunta era SIM_NAO e depois foi
   * alterada para TEXTO.
   *
   * Nesse caso o recurso é automaticamente
   * desligado.
   */
  if (tipo !== "SIM_NAO") {
    return false;
  }

  return Boolean(
    abrirComplementoSim
  );
}

function montar(
  registro: any
): PerguntaCanalDenuncia {
  return {
    id: registro.id,

    enunciado:
      registro.enunciado,

    descricao:
      registro.descricao,

    tipo:
      registro.tipo,

    obrigatoria:
      registro.obrigatoria,

    abrirComplementoSim:
      Boolean(
        registro.abrirComplementoSim
      ),

    opcoes:
      converterOpcoes(
        registro.opcoes
      ),

    ativo:
      registro.ativo,

    ordem:
      registro.ordem,

    clienteIds:
      registro.clientes.map(
        (item: any) =>
          item.clienteId
      ),

    clientes:
      registro.clientes.map(
        (item: any) => ({
          id:
            item.cliente.id,

          nome:
            item.cliente.nome,

          empresa:
            item.cliente.empresa,
        })
      ),

    criadoEm:
      registro.criadoEm,

    atualizadoEm:
      registro.atualizadoEm,
  };
}

const includeClientes = {
  clientes: {
    include: {
      cliente: {
        select: {
          id: true,
          nome: true,
          empresa: true,
        },
      },
    },
  },
};

export default class RepositorioPerguntaCanalDenuncia {
  static async obterTodas(): Promise<
    PerguntaCanalDenuncia[]
  > {
    const dados =
      await prisma.perguntaCanalDenuncia.findMany({
        orderBy: [
          {
            ordem: "asc",
          },
          {
            criadoEm: "asc",
          },
        ],

        include:
          includeClientes,
      });

    return dados.map(
      montar
    );
  }

  static async obterPorId(
    id: string
  ): Promise<PerguntaCanalDenuncia> {
    const perguntaId =
      id?.trim();

    if (!perguntaId) {
      throw new Error(
        "Pergunta não informada."
      );
    }

    const dado =
      await prisma.perguntaCanalDenuncia.findUnique({
        where: {
          id: perguntaId,
        },

        include:
          includeClientes,
      });

    if (!dado) {
      throw new Error(
        "Pergunta não encontrada."
      );
    }

    return montar(
      dado
    );
  }

  static async obterAtivasPorCliente(
    clienteId: string
  ): Promise<
    PerguntaCanalPublica[]
  > {
    const clienteIdNormalizado =
      clienteId?.trim();

    if (!clienteIdNormalizado) {
      throw new Error(
        "Cliente não informado."
      );
    }

    const dados =
      await prisma.perguntaCanalDenuncia.findMany({
        where: {
          ativo: true,

          clientes: {
            some: {
              clienteId:
                clienteIdNormalizado,
            },
          },
        },

        orderBy: [
          {
            ordem: "asc",
          },
          {
            criadoEm: "asc",
          },
        ],

        select: {
          id: true,

          enunciado: true,

          descricao: true,

          tipo: true,

          obrigatoria: true,

          abrirComplementoSim:
            true,

          opcoes: true,

          ordem: true,
        },
      });

    return dados.map(
      (item) => ({
        id:
          item.id,

        enunciado:
          item.enunciado,

        descricao:
          item.descricao,

        tipo:
          item.tipo,

        obrigatoria:
          item.obrigatoria,

        abrirComplementoSim:
          item.abrirComplementoSim,

        opcoes:
          converterOpcoes(
            item.opcoes
          ),

        ordem:
          item.ordem,
      })
    );
  }

  static async salvar(
    dados: PerguntaCanalDenuncia
  ): Promise<PerguntaCanalDenuncia> {
    const enunciado =
      dados.enunciado?.trim();

    if (!enunciado) {
      throw new Error(
        "O enunciado é obrigatório."
      );
    }

    const descricao =
      dados.descricao
        ?.trim() || null;

    const clienteIds =
      Array.from(
        new Set(
          (
            dados.clienteIds ||
            []
          )
            .map((id) =>
              id.trim()
            )
            .filter(Boolean)
        )
      );

    if (
      clienteIds.length === 0
    ) {
      throw new Error(
        "Selecione pelo menos um cliente."
      );
    }

    const quantidadeClientes =
      await prisma.cliente.count({
        where: {
          id: {
            in: clienteIds,
          },

          ativo: true,
        },
      });

    if (
      quantidadeClientes !==
      clienteIds.length
    ) {
      throw new Error(
        "Há clientes inválidos ou inativos na seleção."
      );
    }

    const opcoes =
      normalizarOpcoes(
        dados.tipo,
        dados.opcoes || []
      );

    const abrirComplementoSim =
      normalizarComplementoSim(
        dados.tipo,
        dados.abrirComplementoSim
      );

    const ordem =
      Number.isFinite(
        dados.ordem
      )
        ? dados.ordem
        : 0;

    const salvo =
      await prisma.$transaction(
        async (tx) => {
          if (dados.id) {
            await tx.perguntaCanalDenunciaCliente.deleteMany({
              where: {
                perguntaId:
                  dados.id,
              },
            });

            return tx.perguntaCanalDenuncia.update({
              where: {
                id:
                  dados.id,
              },

              data: {
                enunciado,

                descricao,

                tipo:
                  dados.tipo,

                obrigatoria:
                  dados.obrigatoria,

                abrirComplementoSim,

                opcoes,

                ativo:
                  dados.ativo,

                ordem,

                clientes: {
                  create:
                    clienteIds.map(
                      (
                        clienteId
                      ) => ({
                        clienteId,
                      })
                    ),
                },
              },

              include:
                includeClientes,
            });
          }

          return tx.perguntaCanalDenuncia.create({
            data: {
              enunciado,

              descricao,

              tipo:
                dados.tipo,

              obrigatoria:
                dados.obrigatoria,

              abrirComplementoSim,

              opcoes,

              ativo:
                dados.ativo,

              ordem,

              clientes: {
                create:
                  clienteIds.map(
                    (
                      clienteId
                    ) => ({
                      clienteId,
                    })
                  ),
              },
            },

            include:
              includeClientes,
          });
        }
      );

    return montar(
      salvo
    );
  }

  static async excluir(
    id: string
  ) {
    const perguntaId =
      id?.trim();

    if (!perguntaId) {
      throw new Error(
        "Pergunta não informada."
      );
    }

    const pergunta =
      await prisma.perguntaCanalDenuncia.findUnique({
        where: {
          id: perguntaId,
        },

        select: {
          id: true,
        },
      });

    if (!pergunta) {
      throw new Error(
        "Pergunta não encontrada."
      );
    }

    const quantidadeRespostas =
      await prisma.respostaPerguntaCanalDenuncia.count({
        where: {
          perguntaId,
        },
      });

    /**
     * Se já existem respostas, preservamos
     * a pergunta para manter a integridade
     * histórica das denúncias.
     */
    if (
      quantidadeRespostas > 0
    ) {
      return prisma.perguntaCanalDenuncia.update({
        where: {
          id: perguntaId,
        },

        data: {
          ativo: false,
        },
      });
    }

    return prisma.perguntaCanalDenuncia.delete({
      where: {
        id: perguntaId,
      },
    });
  }
}
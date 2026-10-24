"use server";

import {
  PerfilUsuario,
  Prisma,
  TipoPerguntaCanalDenuncia,
} from "@prisma/client";

import {
  auth,
} from "@/src/auth";

import {
  prisma,
} from "@/src/lib/prisma";


export type ClientePerguntaCanal = {
  id: string;
  nome: string;
  empresa: string | null;
};


export type PerguntaCanalDenunciaDto = {
  id: string;
  enunciado: string;
  descricao: string | null;
  tipo: TipoPerguntaCanalDenuncia;
  obrigatoria: boolean;
  abrirComplementoSim: boolean;
  opcoes: string[];
  ativo: boolean;
  exclusivaMundial: boolean;
  ordem: number;
  todosCanais: boolean;
  clienteIds: string[];
  clientes: ClientePerguntaCanal[];
  criadoEm: Date;
  atualizadoEm: Date;
};


export type SalvarPerguntaCanalDenunciaInput = {
  id?: string;
  enunciado: string;
  descricao?: string | null;
  tipo: TipoPerguntaCanalDenuncia;
  obrigatoria: boolean;
  abrirComplementoSim?: boolean;
  opcoes?: string[];
  ativo: boolean;
  exclusivaMundial?: boolean;
  ordem: number;
  todosCanais?: boolean;
  clienteIds?: string[];
};


export type AplicarCanaisEmMassaInput = {
  perguntaIds: string[];
  todosCanais: boolean;
  clienteIds?: string[];
};


const PERFIS_MUNDIAL =
  new Set<PerfilUsuario>([
    PerfilUsuario.ADMIN,
    PerfilUsuario.GESTOR,
    PerfilUsuario.PSICOLOGO,
    PerfilUsuario.ASSISTENTE_SOCIAL,
  ]);


async function validarUsuarioMundial() {
  const session =
    await auth();


  if (
    !session?.user
  ) {
    throw new Error(
      "Usuário não autenticado."
    );
  }


  const perfil = (
    session.user as {
      perfil?: PerfilUsuario;
    }
  ).perfil;


  if (
    !perfil ||
    !PERFIS_MUNDIAL.has(
      perfil
    )
  ) {
    throw new Error(
      "Usuário sem permissão para gerenciar perguntas do Canal de Denúncias."
    );
  }
}


function normalizarOpcoes(
  valor: unknown
): string[] {
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
        String(
          item ??
          ""
        ).trim()
    )
    .filter(
      Boolean
    );
}


function normalizarIds(
  ids?: string[]
) {
  return Array.from(
    new Set(
      (
        ids ??
        []
      )
        .map(
          id =>
            id?.trim()
        )
        .filter(
          (
            id
          ): id is string =>
            Boolean(
              id
            )
        )
    )
  );
}


function mapearPergunta(
  pergunta: {
    id: string;
    enunciado: string;
    descricao: string | null;
    tipo: TipoPerguntaCanalDenuncia;
    obrigatoria: boolean;
    abrirComplementoSim: boolean;
    opcoes: Prisma.JsonValue;
    ativo: boolean;
    exclusivaMundial: boolean;
    ordem: number;
    todosCanais: boolean;
    criadoEm: Date;
    atualizadoEm: Date;
    clientes: {
      cliente: {
        id: string;
        nome: string;
        empresa: string | null;
      };
    }[];
  }
): PerguntaCanalDenunciaDto {
  const clientes =
    pergunta.clientes.map(
      item =>
        item.cliente
    );


  return {
    id:
      pergunta.id,

    enunciado:
      pergunta.enunciado,

    descricao:
      pergunta.descricao,

    tipo:
      pergunta.tipo,

    obrigatoria:
      pergunta.obrigatoria,

    abrirComplementoSim:
      pergunta.abrirComplementoSim,

    opcoes:
      normalizarOpcoes(
        pergunta.opcoes
      ),

    ativo:
      pergunta.ativo,

    exclusivaMundial:
      pergunta.exclusivaMundial,

    ordem:
      pergunta.ordem,

    todosCanais:
      pergunta.todosCanais,

    clienteIds:
      clientes.map(
        cliente =>
          cliente.id
      ),

    clientes,

    criadoEm:
      pergunta.criadoEm,

    atualizadoEm:
      pergunta.atualizadoEm,
  };
}


const includePergunta = {
  clientes: {
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
    },

    orderBy: {
      cliente: {
        nome:
          "asc" as const,
      },
    },
  },
} satisfies Prisma.PerguntaCanalDenunciaInclude;


async function obterIdsTodosClientes(
  tx:
    | typeof prisma
    | Prisma.TransactionClient
) {
  const clientes =
    await tx.cliente.findMany({
      select: {
        id:
          true,
      },
    });


  return clientes.map(
    cliente =>
      cliente.id
  );
}


async function validarClientes(
  tx:
    | typeof prisma
    | Prisma.TransactionClient,
  clienteIds: string[]
) {
  if (
    clienteIds.length ===
    0
  ) {
    return;
  }


  const quantidade =
    await tx.cliente.count({
      where: {
        id: {
          in:
            clienteIds,
        },
      },
    });


  if (
    quantidade !==
    clienteIds.length
  ) {
    throw new Error(
      "Um ou mais clientes selecionados não existem."
    );
  }
}


async function substituirVinculos(
  tx: Prisma.TransactionClient,
  perguntaId: string,
  clienteIds: string[]
) {
  await tx.perguntaCanalDenunciaCliente.deleteMany({
    where: {
      perguntaId,
    },
  });


  if (
    clienteIds.length ===
    0
  ) {
    return;
  }


  await tx.perguntaCanalDenunciaCliente.createMany({
    data:
      clienteIds.map(
        clienteId => ({
          perguntaId,
          clienteId,
        })
      ),

    skipDuplicates:
      true,
  });
}


export async function obterTodasPerguntasCanalDenuncia() {
  await validarUsuarioMundial();


  const perguntas =
    await prisma.perguntaCanalDenuncia.findMany({
      orderBy: [
        {
          ordem:
            "asc",
        },

        {
          criadoEm:
            "asc",
        },
      ],

      include:
        includePergunta,
    });


  return perguntas.map(
    mapearPergunta
  );
}


export async function obterPerguntaCanalDenunciaPorId(
  id: string
) {
  await validarUsuarioMundial();


  const perguntaId =
    id?.trim();


  if (
    !perguntaId
  ) {
    throw new Error(
      "Pergunta não informada."
    );
  }


  const pergunta =
    await prisma.perguntaCanalDenuncia.findUnique({
      where: {
        id:
          perguntaId,
      },

      include:
        includePergunta,
    });


  if (
    !pergunta
  ) {
    throw new Error(
      "Pergunta não encontrada."
    );
  }


  return mapearPergunta(
    pergunta
  );
}


export async function salvarPerguntaCanalDenuncia(
  dados: SalvarPerguntaCanalDenunciaInput
) {
  await validarUsuarioMundial();


  const id =
    dados.id?.trim() ||
    undefined;


  const enunciado =
    dados.enunciado
      ?.trim();


  const descricao =
    dados.descricao
      ?.trim() ||
    null;


  const todosCanais =
    Boolean(
      dados.todosCanais
    );


  const clienteIdsInformados =
    normalizarIds(
      dados.clienteIds
    );


  const opcoes =
    normalizarOpcoes(
      dados.opcoes
    );


  if (
    !enunciado
  ) {
    throw new Error(
      "Informe o texto da pergunta."
    );
  }


  if (
    dados.tipo ===
      TipoPerguntaCanalDenuncia.MULTIPLA_ESCOLHA &&
    opcoes.length <
      2
  ) {
    throw new Error(
      "Informe pelo menos duas opções para a pergunta de múltipla escolha."
    );
  }


  if (
    !todosCanais &&
    clienteIdsInformados.length ===
      0
  ) {
    throw new Error(
      "Selecione pelo menos um cliente ou marque Todos os canais."
    );
  }


  const perguntaSalva =
    await prisma.$transaction(
      async tx => {
        const clienteIds =
          todosCanais
            ? await obterIdsTodosClientes(
                tx
              )
            : clienteIdsInformados;


        await validarClientes(
          tx,
          clienteIds
        );


        const dadosPergunta = {
          enunciado,

          descricao,

          tipo:
            dados.tipo,

          obrigatoria:
            Boolean(
              dados.obrigatoria
            ),

          abrirComplementoSim:
            dados.tipo ===
              TipoPerguntaCanalDenuncia.SIM_NAO
              ? Boolean(
                  dados.abrirComplementoSim
                )
              : false,

          opcoes:
            opcoes as unknown as Prisma.InputJsonValue,

          ativo:
            Boolean(
              dados.ativo
            ),

          exclusivaMundial:
            Boolean(
              dados.exclusivaMundial
            ),

          ordem:
            Number.isFinite(
              Number(
                dados.ordem
              )
            )
              ? Number(
                  dados.ordem
                )
              : 0,

          todosCanais,
        };


        const pergunta =
          id
            ? await tx.perguntaCanalDenuncia.update({
                where: {
                  id,
                },

                data:
                  dadosPergunta,
              })
            : await tx.perguntaCanalDenuncia.create({
                data:
                  dadosPergunta,
              });


        await substituirVinculos(
          tx,
          pergunta.id,
          clienteIds
        );


        /*
         * Mantemos a visibilidade das respostas já registradas
         * sincronizada com a configuração atual da pergunta.
         *
         * Assim, ao marcar uma pergunta existente como exclusiva
         * da Mundial, respostas antigas também deixam de ser
         * retornadas aos usuários do cliente.
         */
        await tx.respostaPerguntaCanalDenuncia.updateMany({
          where: {
            perguntaId:
              pergunta.id,
          },

          data: {
            exclusivaMundial:
              Boolean(
                dados.exclusivaMundial
              ),
          },
        });


        return tx.perguntaCanalDenuncia.findUniqueOrThrow({
          where: {
            id:
              pergunta.id,
          },

          include:
            includePergunta,
        });
      }
    );


  return mapearPergunta(
    perguntaSalva
  );
}


export async function aplicarCanaisPerguntasEmMassa(
  dados: AplicarCanaisEmMassaInput
) {
  await validarUsuarioMundial();


  const perguntaIds =
    normalizarIds(
      dados.perguntaIds
    );


  const todosCanais =
    Boolean(
      dados.todosCanais
    );


  const clienteIdsInformados =
    normalizarIds(
      dados.clienteIds
    );


  if (
    perguntaIds.length ===
      0
  ) {
    throw new Error(
      "Selecione pelo menos uma pergunta."
    );
  }


  if (
    !todosCanais &&
    clienteIdsInformados.length ===
      0
  ) {
    throw new Error(
      "Selecione pelo menos um cliente ou marque Todos os canais."
    );
  }


  await prisma.$transaction(
    async tx => {
      const perguntasExistentes =
        await tx.perguntaCanalDenuncia.count({
          where: {
            id: {
              in:
                perguntaIds,
            },
          },
        });


      if (
        perguntasExistentes !==
        perguntaIds.length
      ) {
        throw new Error(
          "Uma ou mais perguntas selecionadas não foram encontradas."
        );
      }


      const clienteIds =
        todosCanais
          ? await obterIdsTodosClientes(
              tx
            )
          : clienteIdsInformados;


      await validarClientes(
        tx,
        clienteIds
      );


      await tx.perguntaCanalDenuncia.updateMany({
        where: {
          id: {
            in:
              perguntaIds,
          },
        },

        data: {
          todosCanais,
        },
      });


      await tx.perguntaCanalDenunciaCliente.deleteMany({
        where: {
          perguntaId: {
            in:
              perguntaIds,
          },
        },
      });


      if (
        clienteIds.length >
          0
      ) {
        await tx.perguntaCanalDenunciaCliente.createMany({
          data:
            perguntaIds.flatMap(
              perguntaId =>
                clienteIds.map(
                  clienteId => ({
                    perguntaId,
                    clienteId,
                  })
                )
            ),

          skipDuplicates:
            true,
        });
      }
    }
  );


  return {
    sucesso:
      true,

    totalPerguntas:
      perguntaIds.length,
  };
}


export async function excluirPerguntaCanalDenuncia(
  id: string
) {
  await validarUsuarioMundial();


  const perguntaId =
    id?.trim();


  if (
    !perguntaId
  ) {
    throw new Error(
      "Pergunta não informada."
    );
  }


  const pergunta =
    await prisma.perguntaCanalDenuncia.findUnique({
      where: {
        id:
          perguntaId,
      },

      select: {
        id:
          true,

        _count: {
          select: {
            respostas:
              true,
          },
        },
      },
    });


  if (
    !pergunta
  ) {
    throw new Error(
      "Pergunta não encontrada."
    );
  }


  /*
   * Se a pergunta já possui respostas, preservamos o
   * histórico e apenas a desativamos.
   */
  if (
    pergunta._count.respostas >
      0
  ) {
    await prisma.perguntaCanalDenuncia.update({
      where: {
        id:
          perguntaId,
      },

      data: {
        ativo:
          false,
      },
    });


    return {
      sucesso:
        true,

      desativada:
        true,
    };
  }


  await prisma.perguntaCanalDenuncia.delete({
    where: {
      id:
        perguntaId,
    },
  });


  return {
    sucesso:
      true,

    desativada:
      false,
  };
}


/*
 * Pode ser usado no fluxo público do Canal de Denúncias.
 *
 * Mesmo que os vínculos físicos sejam mantidos para
 * compatibilidade, o todosCanais garante a regra global.
 */
export async function obterPerguntasAtivasCanalPorCliente(
  clienteId: string
) {
  const id =
    clienteId?.trim();


  if (
    !id
  ) {
    throw new Error(
      "Cliente não informado."
    );
  }


  const perguntas =
    await prisma.perguntaCanalDenuncia.findMany({
      where: {
        ativo:
          true,

        OR: [
          {
            todosCanais:
              true,
          },

          {
            clientes: {
              some: {
                clienteId:
                  id,
              },
            },
          },
        ],
      },

      orderBy: [
        {
          ordem:
            "asc",
        },

        {
          criadoEm:
            "asc",
        },
      ],

      include:
        includePergunta,
    });


  return perguntas.map(
    mapearPergunta
  );
}

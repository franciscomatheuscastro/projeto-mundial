import {
  PerfilUsuario,
  Prisma,
} from "@prisma/client";

import { hash } from "bcryptjs";

import { prisma } from "@/src/lib/prisma";

import type {
  Cliente,
  ClienteComResumo,
  ClienteDetalhado,
  ExcluirUsuarioMasterClienteInput,
  SalvarUsuarioMasterClienteInput,
  UsuarioMasterCliente,
} from "@/src/core/model/Cliente";

function somenteNumeros(
  valor?: string | null
) {
  return valor?.replace(/\D/g, "") || "";
}

export default class RepositorioCliente {
  static async salvar(
    cliente: Cliente
  ): Promise<Cliente> {
    const nome =
      cliente.nome?.trim();

    if (!nome) {
      throw new Error(
        "Nome do cliente é obrigatório."
      );
    }

    const telefone =
      somenteNumeros(
        cliente.telefone
      );

    const documento =
      somenteNumeros(
        cliente.documento
      );

    if (
      telefone &&
      telefone.length !== 10 &&
      telefone.length !== 11
    ) {
      throw new Error(
        "Informe um telefone válido com DDD."
      );
    }

    if (
      documento &&
      documento.length !== 11 &&
      documento.length !== 14
    ) {
      throw new Error(
        "Informe um CPF ou CNPJ válido."
      );
    }

    const dados = {
      nome,

      empresa:
        cliente.empresa?.trim() ||
        null,

      email:
        cliente.email
          ?.trim()
          .toLowerCase() ||
        null,

      telefone:
        telefone || null,

      documento:
        documento || null,

      observacoes:
        cliente.observacoes?.trim() ||
        null,

      ativo:
        cliente.ativo ?? true,
    };

    if (cliente.id) {
      return prisma.cliente.update({
        where: {
          id: cliente.id,
        },

        data: dados,
      });
    }

    return prisma.cliente.create({
      data: dados,
    });
  }

  static async excluir(
    id: string
  ): Promise<string> {
    if (!id?.trim()) {
      throw new Error(
        "Cliente não informado."
      );
    }

    const cliente =
      await prisma.cliente.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          nome: true,
        },
      });

    if (!cliente) {
      throw new Error(
        "Cliente não encontrado."
      );
    }

    await prisma.$transaction(
      async (tx) => {
        /*
        * 1. Exclui as denúncias primeiro.
        *
        * Os históricos, anexos, tratativas,
        * respostas e planos de ação vinculados
        * são removidos pelas relações Cascade
        * configuradas no Prisma.
        */
        await tx.denuncia.deleteMany({
          where: {
            clienteId: id,
          },
        });

        /*
        * 2. Exclui pesquisas do cliente.
        *
        * Convites, respostas e planos de ação
        * vinculados também devem ser removidos
        * pelas relações Cascade.
        */
        await tx.pesquisaCliente.deleteMany({
          where: {
            clienteId: id,
          },
        });

        /*
        * 3. Exclui os colaboradores.
        */
        await tx.colaboradorCliente.deleteMany({
          where: {
            clienteId: id,
          },
        });

        /*
        * 4. Exclui todos os usuários vinculados,
        * incluindo o usuário master.
        */
        await tx.usuario.deleteMany({
          where: {
            clienteId: id,
          },
        });

        /*
        * 5. Exclui os vínculos entre perguntas
        * do canal e este cliente.
        */
        await tx.perguntaCanalDenunciaCliente.deleteMany(
          {
            where: {
              clienteId: id,
            },
          }
        );

        /*
        * 6. Por último, exclui o cliente.
        */
        await tx.cliente.delete({
          where: {
            id,
          },
        });
      }
    );

    return id;
  }

  static async obterTodos(): Promise<
    ClienteComResumo[]
  > {
    const clientes =
      await prisma.cliente.findMany({
        orderBy: {
          criadoEm: "desc",
        },

        include: {
          _count: {
            select: {
              pesquisas: true,
            },
          },
        },
      });

    return clientes.map(
      (cliente) => ({
        id: cliente.id,
        nome: cliente.nome,
        empresa: cliente.empresa,
        email: cliente.email,
        telefone: cliente.telefone,
        documento: cliente.documento,
        observacoes:
          cliente.observacoes,
        ativo: cliente.ativo,
        criadoEm: cliente.criadoEm,
        atualizadoEm:
          cliente.atualizadoEm,
        totalPesquisas:
          cliente._count.pesquisas,
      })
    );
  }

  static async obterPorId(
    id: string
  ): Promise<ClienteDetalhado> {
    if (!id?.trim()) {
      throw new Error(
        "Cliente não informado."
      );
    }

    const cliente =
      await prisma.cliente.findUnique({
        where: {
          id,
        },

        include: {
          usuarios: {
            where: {
              perfil:
                PerfilUsuario.CLIENTE,
            },

            orderBy: {
              criadoEm: "asc",
            },

            select: {
              id: true,
              nome: true,
              email: true,
              ativo: true,
              perfil: true,
              criadoEm: true,
            },
          },

          pesquisas: {
            include: {
              modelo: {
                select: {
                  id: true,
                  titulo: true,
                },
              },
            },

            orderBy: {
              criadoEm: "desc",
            },
          },
        },
      });

    if (!cliente) {
      throw new Error(
        "Cliente não encontrado."
      );
    }

    const {
      usuarios,
      ...dadosCliente
    } = cliente;

    return {
      ...dadosCliente,

      usuarioMaster:
        usuarios[0] ?? null,
    };
  }


  static async salvarUsuarioMaster(
    dados: SalvarUsuarioMasterClienteInput
  ): Promise<UsuarioMasterCliente> {
    const clienteId =
      dados.clienteId?.trim();

    const usuarioId =
      dados.usuarioId?.trim();

    const nome =
      dados.nome?.trim();

    const email =
      dados.email
        ?.trim()
        .toLowerCase();

    const senha =
      dados.senha?.trim();

    if (!clienteId) {
      throw new Error(
        "Cliente não informado."
      );
    }

    if (!nome) {
      throw new Error(
        "Nome do usuário é obrigatório."
      );
    }

    if (!email) {
      throw new Error(
        "E-mail do usuário é obrigatório."
      );
    }

    const cliente =
      await prisma.cliente.findUnique({
        where: {
          id: clienteId,
        },

        select: {
          id: true,
        },
      });

    if (!cliente) {
      throw new Error(
        "Cliente não encontrado."
      );
    }

    const emailEmUso =
      await prisma.usuario.findFirst({
        where: {
          email,

          ...(usuarioId
            ? {
                id: {
                  not: usuarioId,
                },
              }
            : {}),
        },

        select: {
          id: true,
        },
      });

    if (emailEmUso) {
      throw new Error(
        "Este e-mail já está sendo utilizado por outro usuário."
      );
    }

    if (usuarioId) {
      const usuarioAtual =
        await prisma.usuario.findFirst({
          where: {
            id: usuarioId,
            clienteId,
            perfil:
              PerfilUsuario.CLIENTE,
          },

          select: {
            id: true,
          },
        });

      if (!usuarioAtual) {
        throw new Error(
          "Usuário master não encontrado para este cliente."
        );
      }

      const usuario =
        await prisma.usuario.update({
          where: {
            id: usuarioId,
          },

          data: {
            nome,
            email,
            ativo:
              dados.ativo,

            ...(senha
              ? {
                  senha:
                    await hash(
                      senha,
                      12
                    ),
                }
              : {}),
          },

          select: {
            id: true,
            nome: true,
            email: true,
            ativo: true,
            perfil: true,
            criadoEm: true,
          },
        });

      return usuario;
    }

    if (!senha) {
      throw new Error(
        "Senha provisória é obrigatória para criar o acesso."
      );
    }

    const usuarioMasterExistente =
      await prisma.usuario.findFirst({
        where: {
          clienteId,
          perfil:
            PerfilUsuario.CLIENTE,
        },

        select: {
          id: true,
        },
      });

    if (usuarioMasterExistente) {
      throw new Error(
        "Este cliente já possui um usuário master."
      );
    }

    return prisma.usuario.create({
      data: {
        clienteId,
        nome,
        email,
        senha:
          await hash(
            senha,
            12
          ),
        perfil:
          PerfilUsuario.CLIENTE,
        ativo:
          dados.ativo,
      },

      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
        perfil: true,
        criadoEm: true,
      },
    });
  }

  static async excluirUsuarioMaster(
    dados: ExcluirUsuarioMasterClienteInput
  ): Promise<string> {
    const clienteId =
      dados.clienteId?.trim();

    const usuarioId =
      dados.usuarioId?.trim();

    if (!clienteId) {
      throw new Error(
        "Cliente não informado."
      );
    }

    if (!usuarioId) {
      throw new Error(
        "Usuário não informado."
      );
    }

    const usuario =
      await prisma.usuario.findFirst({
        where: {
          id: usuarioId,
          clienteId,
          perfil:
            PerfilUsuario.CLIENTE,
        },

        select: {
          id: true,
        },
      });

    if (!usuario) {
      throw new Error(
        "Usuário master não encontrado para este cliente."
      );
    }

    try {
      await prisma.usuario.delete({
        where: {
          id: usuarioId,
        },
      });
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new Error(
          "Este usuário possui registros vinculados e não pode ser excluído. Desative o acesso em vez de removê-lo."
        );
      }

      throw error;
    }

    return usuarioId;
  }

}

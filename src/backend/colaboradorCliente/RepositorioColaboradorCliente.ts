import bcrypt from "bcryptjs";
import { PerfilUsuario } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";

import {
  enviarEmailNovoColaborador,
} from "@/src/lib/email";

import {
  ColaboradorCliente,
  ColaboradorClienteSalvo,
} from "@/src/core/model/ColaboradorCliente";

const selecionarColaborador = {
  id: true,
  clienteId: true,
  usuarioId: true,
  nome: true,
  email: true,
  telefone: true,
  setor: true,
  cargo: true,
  ativo: true,
  podeVerDenuncias: true,
  podeTratarDenuncias: true,
  criadoEm: true,
  atualizadoEm: true,
} as const;

function textoOpcional(
  valor?: string | null
): string | null {
  const texto = valor?.trim();

  return texto || null;
}

function normalizarTelefone(
  valor?: string | null
): string | null {
  const digitos =
    valor?.replace(/\D/g, "") || "";

  if (!digitos) {
    return null;
  }

  if (
    digitos.length !== 10 &&
    digitos.length !== 11
  ) {
    throw new Error(
      "Informe um telefone válido com DDD."
    );
  }

  return digitos;
}

export default class RepositorioColaboradorCliente {
  static async obterPorCliente(
    clienteId: string
  ): Promise<ColaboradorClienteSalvo[]> {
    if (!clienteId?.trim()) {
      throw new Error(
        "Cliente não identificado."
      );
    }

    return prisma.colaboradorCliente.findMany({
      where: {
        clienteId,
      },

      orderBy: {
        nome: "asc",
      },

      select:
        selecionarColaborador,
    });
  }

  static async obterPorIdECliente(
    id: string,
    clienteId: string
  ): Promise<ColaboradorClienteSalvo> {
    if (!id?.trim()) {
      throw new Error(
        "Colaborador não identificado."
      );
    }

    if (!clienteId?.trim()) {
      throw new Error(
        "Cliente não identificado."
      );
    }

    const colaborador =
      await prisma.colaboradorCliente.findFirst({
        where: {
          id,
          clienteId,
        },

        select:
          selecionarColaborador,
      });

    if (!colaborador) {
      throw new Error(
        "Colaborador não encontrado."
      );
    }

    return colaborador;
  }

  static async salvar(
    clienteId: string,
    colaborador: ColaboradorCliente
  ): Promise<ColaboradorClienteSalvo> {
    const nome =
      colaborador.nome?.trim();

    const email =
      colaborador.email
        ?.trim()
        .toLowerCase();

    const senha =
      colaborador.senha?.trim();

    if (!clienteId?.trim()) {
      throw new Error(
        "Cliente não identificado."
      );
    }

    if (!nome) {
      throw new Error(
        "Nome é obrigatório."
      );
    }

    if (!email) {
      throw new Error(
        "E-mail é obrigatório."
      );
    }

    if (
      !colaborador.id &&
      !senha
    ) {
      throw new Error(
        "Senha é obrigatória para cadastrar um novo colaborador."
      );
    }

    if (
      senha &&
      senha.length < 8
    ) {
      throw new Error(
        "A senha deve possuir pelo menos 8 caracteres."
      );
    }

    const telefone =
      normalizarTelefone(
        colaborador.telefone
      );

    const setor =
      textoOpcional(
        colaborador.setor
      );

    const cargo =
      textoOpcional(
        colaborador.cargo
      );

    const ativo =
      colaborador.ativo ?? true;

    const podeVerDenuncias =
      colaborador.podeVerDenuncias ??
      true;

    const podeTratarDenuncias =
      colaborador.podeTratarDenuncias ??
      true;

    if (
      podeTratarDenuncias &&
      !podeVerDenuncias
    ) {
      throw new Error(
        "Para realizar tratativas, o colaborador também precisa visualizar denúncias."
      );
    }

    const clienteExiste =
      await prisma.cliente.findUnique({
        where: {
          id: clienteId,
        },

        select: {
          id: true,
          ativo: true,
        },
      });

    if (
      !clienteExiste ||
      !clienteExiste.ativo
    ) {
      throw new Error(
        "Cliente não encontrado ou inativo."
      );
    }

    const usuarioComMesmoEmail =
      await prisma.usuario.findUnique({
        where: {
          email,
        },

        select: {
          id: true,

          colaboradorCliente: {
            select: {
              id: true,
            },
          },
        },
      });

    let colaboradorAtual:
      | {
          id: string;
          clienteId: string;
          usuarioId: string | null;
        }
      | null = null;

    if (colaborador.id) {
      colaboradorAtual =
        await prisma.colaboradorCliente.findFirst({
          where: {
            id: colaborador.id,
            clienteId,
          },

          select: {
            id: true,
            clienteId: true,
            usuarioId: true,
          },
        });

      if (!colaboradorAtual) {
        throw new Error(
          "Colaborador não encontrado."
        );
      }

      if (
        usuarioComMesmoEmail &&
        usuarioComMesmoEmail.id !==
          colaboradorAtual.usuarioId
      ) {
        throw new Error(
          "Este e-mail pertence a outro usuário."
        );
      }
    } else if (
      usuarioComMesmoEmail
    ) {
      throw new Error(
        "Já existe um usuário com este e-mail."
      );
    }

    const senhaCriptografada =
      senha
        ? await bcrypt.hash(
            senha,
            12
          )
        : undefined;

    /*
     * O e-mail deve ser enviado somente quando
     * um novo acesso for efetivamente criado.
     */
    let acessoCriadoAgora = false;

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          if (colaboradorAtual) {
            if (
              !colaboradorAtual.usuarioId
            ) {
              if (
                !senhaCriptografada
              ) {
                throw new Error(
                  "Informe uma senha para liberar o acesso deste colaborador."
                );
              }

              const usuarioCriado =
                await tx.usuario.create({
                  data: {
                    nome,
                    email,
                    senha:
                      senhaCriptografada,

                    perfil:
                      PerfilUsuario.COMITE_CLIENTE,

                    ativo,
                    clienteId,
                  },

                  select: {
                    id: true,
                  },
                });

              acessoCriadoAgora = true;

              return tx.colaboradorCliente.update({
                where: {
                  id:
                    colaboradorAtual.id,
                },

                data: {
                  usuarioId:
                    usuarioCriado.id,

                  nome,
                  email,
                  telefone,
                  setor,
                  cargo,
                  ativo,

                  podeVerDenuncias,
                  podeTratarDenuncias,
                },

                select:
                  selecionarColaborador,
              });
            }

            await tx.usuario.update({
              where: {
                id:
                  colaboradorAtual.usuarioId,
              },

              data: {
                nome,
                email,
                ativo,
                clienteId,

                perfil:
                  PerfilUsuario.COMITE_CLIENTE,

                ...(senhaCriptografada
                  ? {
                      senha:
                        senhaCriptografada,
                    }
                  : {}),
              },
            });

            return tx.colaboradorCliente.update({
              where: {
                id:
                  colaboradorAtual.id,
              },

              data: {
                nome,
                email,
                telefone,
                setor,
                cargo,
                ativo,

                podeVerDenuncias,
                podeTratarDenuncias,
              },

              select:
                selecionarColaborador,
            });
          }

          if (!senhaCriptografada) {
            throw new Error(
              "Senha é obrigatória."
            );
          }

          const usuarioCriado =
            await tx.usuario.create({
              data: {
                nome,
                email,

                senha:
                  senhaCriptografada,

                perfil:
                  PerfilUsuario.COMITE_CLIENTE,

                ativo,
                clienteId,
              },

              select: {
                id: true,
              },
            });

          const colaboradorCriado =
            await tx.colaboradorCliente.create({
              data: {
                clienteId,

                usuarioId:
                  usuarioCriado.id,

                nome,
                email,
                telefone,
                setor,
                cargo,
                ativo,

                podeVerDenuncias,
                podeTratarDenuncias,
              },

              select:
                selecionarColaborador,
            });

          acessoCriadoAgora = true;

          return colaboradorCriado;
        }
      );

    /*
     * Não enviamos e-mail dentro da transação.
     *
     * Caso o SMTP esteja temporariamente fora do ar,
     * o banco não fica preso e a conta não é
     * duplicada em uma nova tentativa de cadastro.
     */
    if (
      acessoCriadoAgora &&
      senha
    ) {
      try {
        await enviarEmailNovoColaborador({
          nome,
          email,

          senhaTemporaria:
            senha,
        });
      } catch (error) {
        console.error(
          "O colaborador foi criado, mas o e-mail de acesso não pôde ser enviado:",
          {
            colaboradorId:
              resultado.id,

            email,

            error,
          }
        );
      }
    }

    return resultado;
  }

  static async excluir(
    id: string,
    clienteId: string
  ): Promise<void> {
    if (!id?.trim()) {
      throw new Error(
        "Colaborador não identificado."
      );
    }

    if (!clienteId?.trim()) {
      throw new Error(
        "Cliente não identificado."
      );
    }

    const colaborador =
      await prisma.colaboradorCliente.findFirst({
        where: {
          id,
          clienteId,
        },

        select: {
          id: true,
          usuarioId: true,
        },
      });

    if (!colaborador) {
      throw new Error(
        "Colaborador não encontrado."
      );
    }

    await prisma.$transaction(
      async (tx) => {
        await tx.colaboradorCliente.delete({
          where: {
            id:
              colaborador.id,
          },
        });

        if (
          colaborador.usuarioId
        ) {
          await tx.usuario.delete({
            where: {
              id:
                colaborador.usuarioId,
            },
          });
        }
      }
    );
  }
}

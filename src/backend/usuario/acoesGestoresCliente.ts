"use server";

import {
  PerfilUsuario,
  TipoModuloPesquisa,
} from "@prisma/client";

import {
  hash,
} from "bcryptjs";

import {
  revalidatePath,
} from "next/cache";

import {
  auth,
} from "@/src/auth";

import {
  prisma,
} from "@/src/lib/prisma";


export type GestorClienteResumo = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  criadoEm: Date | string;
  totalAvaliacoes: number;
};


export type ResultadoGestoresCliente =
  | {
      sucesso: true;
      dados: GestorClienteResumo[];
      erro: null;
    }
  | {
      sucesso: false;
      dados: GestorClienteResumo[];
      erro: string;
    };


export type ResultadoAcaoGestor =
  | {
      sucesso: true;
      gestor: GestorClienteResumo;
      erro: null;
    }
  | {
      sucesso: false;
      gestor: null;
      erro: string;
    };


async function obterAdministradorCliente() {
  const session =
    await auth();


  const usuarioSessao =
    session?.user as
      | {
          id?: string;
        }
      | undefined;


  if (
    !usuarioSessao?.id
  ) {
    throw new Error(
      "Usuário não autenticado."
    );
  }


  const usuario =
    await prisma.usuario.findFirst({
      where: {
        id:
          usuarioSessao.id,

        perfil:
          PerfilUsuario.CLIENTE,

        ativo:
          true,

        clienteId: {
          not:
            null,
        },
      },

      select: {
        id:
          true,

        clienteId:
          true,
      },
    });


  if (
    !usuario?.clienteId
  ) {
    throw new Error(
      "Apenas o administrador do cliente pode gerenciar gestores."
    );
  }


  return {
    id:
      usuario.id,

    clienteId:
      usuario.clienteId,
  };
}


function mensagemErro(
  error: unknown,
  padrao: string
) {
  return error instanceof
    Error
    ? error.message
    : padrao;
}


async function obterGestorResumo(
  id: string,
  clienteId: string
): Promise<GestorClienteResumo | null> {
  const gestor =
    await prisma.usuario.findFirst({
      where: {
        id,

        clienteId,

        perfil:
          PerfilUsuario.GESTOR_CLIENTE,
      },

      select: {
        id:
          true,

        nome:
          true,

        email:
          true,

        ativo:
          true,

        criadoEm:
          true,

        _count: {
          select: {
            avaliacoesDesempenhoGestor:
              true,
          },
        },
      },
    });


  if (
    !gestor
  ) {
    return null;
  }


  return {
    id:
      gestor.id,

    nome:
      gestor.nome,

    email:
      gestor.email,

    ativo:
      gestor.ativo,

    criadoEm:
      gestor.criadoEm,

    totalAvaliacoes:
      gestor._count
        .avaliacoesDesempenhoGestor,
  };
}


export async function listarGestoresCliente(): Promise<ResultadoGestoresCliente> {
  try {
    const usuario =
      await obterAdministradorCliente();


    const gestores =
      await prisma.usuario.findMany({
        where: {
          clienteId:
            usuario.clienteId,

          perfil:
            PerfilUsuario.GESTOR_CLIENTE,
        },

        orderBy: [
          {
            ativo:
              "desc",
          },

          {
            nome:
              "asc",
          },
        ],

        select: {
          id:
            true,

          nome:
            true,

          email:
            true,

          ativo:
            true,

          criadoEm:
            true,

          _count: {
            select: {
              avaliacoesDesempenhoGestor:
                true,
            },
          },
        },
      });


    return {
      sucesso:
        true,

      dados:
        gestores.map(
          gestor => ({
            id:
              gestor.id,

            nome:
              gestor.nome,

            email:
              gestor.email,

            ativo:
              gestor.ativo,

            criadoEm:
              gestor.criadoEm,

            totalAvaliacoes:
              gestor._count
                .avaliacoesDesempenhoGestor,
          })
        ),

      erro:
        null,
    };
  } catch (error) {
    return {
      sucesso:
        false,

      dados:
        [],

      erro:
        mensagemErro(
          error,
          "Erro ao carregar gestores."
        ),
    };
  }
}


export async function salvarGestorCliente(
  dados: {
    id?: string;
    nome: string;
    email: string;
    senha?: string;
    ativo?: boolean;
  }
): Promise<ResultadoAcaoGestor> {
  try {
    const administrador =
      await obterAdministradorCliente();


    const id =
      dados.id?.trim() ||
      null;


    const nome =
      dados.nome
        ?.trim();


    const email =
      dados.email
        ?.trim()
        .toLowerCase();


    const senha =
      dados.senha
        ?.trim() ||
      "";


    if (
      !nome
    ) {
      throw new Error(
        "Nome do gestor é obrigatório."
      );
    }


    if (
      !email
    ) {
      throw new Error(
        "E-mail do gestor é obrigatório."
      );
    }


    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      throw new Error(
        "Informe um e-mail válido."
      );
    }


    if (
      !id &&
      senha.length <
        8
    ) {
      throw new Error(
        "A senha provisória deve ter pelo menos 8 caracteres."
      );
    }


    if (
      id &&
      senha &&
      senha.length <
        8
    ) {
      throw new Error(
        "A nova senha deve ter pelo menos 8 caracteres."
      );
    }


    const emailEmUso =
      await prisma.usuario.findFirst({
        where: {
          email,

          ...(id
            ? {
                id: {
                  not:
                    id,
                },
              }
            : {}),
        },

        select: {
          id:
            true,
        },
      });


    if (
      emailEmUso
    ) {
      throw new Error(
        "Este e-mail já está sendo utilizado por outro usuário."
      );
    }


    let gestorId =
      id;


    if (
      id
    ) {
      const gestorAtual =
        await prisma.usuario.findFirst({
          where: {
            id,

            clienteId:
              administrador.clienteId,

            perfil:
              PerfilUsuario.GESTOR_CLIENTE,
          },

          select: {
            id:
              true,
          },
        });


      if (
        !gestorAtual
      ) {
        throw new Error(
          "Gestor não encontrado."
        );
      }


      await prisma.usuario.update({
        where: {
          id,
        },

        data: {
          nome,

          email,

          ativo:
            dados.ativo ??
            true,

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
      });
    } else {
      const criado =
        await prisma.usuario.create({
          data: {
            nome,

            email,

            senha:
              await hash(
                senha,
                12
              ),

            perfil:
              PerfilUsuario.GESTOR_CLIENTE,

            ativo:
              true,

            clienteId:
              administrador.clienteId,
          },

          select: {
            id:
              true,
          },
        });


      gestorId =
        criado.id;
    }


    const gestor =
      gestorId
        ? await obterGestorResumo(
            gestorId,
            administrador.clienteId
          )
        : null;


    if (
      !gestor
    ) {
      throw new Error(
        "Não foi possível recuperar o gestor salvo."
      );
    }


    revalidatePath(
      "/meus-gestores"
    );


    return {
      sucesso:
        true,

      gestor,

      erro:
        null,
    };
  } catch (error) {
    return {
      sucesso:
        false,

      gestor:
        null,

      erro:
        mensagemErro(
          error,
          "Erro ao salvar gestor."
        ),
    };
  }
}


export async function alterarStatusGestorCliente(
  id: string,
  ativo: boolean
): Promise<ResultadoAcaoGestor> {
  try {
    const administrador =
      await obterAdministradorCliente();


    const gestor =
      await prisma.usuario.findFirst({
        where: {
          id,

          clienteId:
            administrador.clienteId,

          perfil:
            PerfilUsuario.GESTOR_CLIENTE,
        },

        select: {
          id:
            true,
        },
      });


    if (
      !gestor
    ) {
      throw new Error(
        "Gestor não encontrado."
      );
    }


    if (
      !ativo
    ) {
      const avaliacoesAbertas =
        await prisma.pesquisaCliente.count({
          where: {
            gestorUsuarioId:
              id,

            tipo:
              TipoModuloPesquisa.AVALIACAO_DESEMPENHO,

            status:
              "ABERTA",
          },
        });


      if (
        avaliacoesAbertas >
        0
      ) {
        throw new Error(
          "Este gestor possui avaliação(ões) aberta(s). Finalize ou reatribua essas avaliações antes de desativar o acesso."
        );
      }
    }


    await prisma.usuario.update({
      where: {
        id,
      },

      data: {
        ativo,
      },
    });


    const atualizado =
      await obterGestorResumo(
        id,
        administrador.clienteId
      );


    if (
      !atualizado
    ) {
      throw new Error(
        "Não foi possível recuperar o gestor atualizado."
      );
    }


    revalidatePath(
      "/meus-gestores"
    );


    return {
      sucesso:
        true,

      gestor:
        atualizado,

      erro:
        null,
    };
  } catch (error) {
    return {
      sucesso:
        false,

      gestor:
        null,

      erro:
        mensagemErro(
          error,
          "Erro ao alterar o acesso do gestor."
        ),
    };
  }
}

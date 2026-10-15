"use server";

import {
  PerfilUsuario,
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


export type UsuarioComiteEticaMundial = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
};


export type SalvarUsuarioComiteEticaInput = {
  id?: string;
  nome: string;
  email: string;
  senha?: string;
  ativo: boolean;
};


async function validarAdministradorMundial() {
  const session =
    await auth();


  if (
    !session?.user
  ) {
    throw new Error(
      "Usuário não autenticado."
    );
  }


  const usuarioSessao =
    session.user as {
      id?: string;
    };


  if (
    !usuarioSessao.id
  ) {
    throw new Error(
      "Usuário da sessão não identificado."
    );
  }


  const usuario =
    await prisma.usuario.findUnique({
      where: {
        id:
          usuarioSessao.id,
      },

      select: {
        id:
          true,

        perfil:
          true,

        ativo:
          true,

        clienteId:
          true,

        membroComiteEtica:
          true,
      },
    });


  if (
    !usuario ||
    !usuario.ativo ||
    usuario.perfil !==
      PerfilUsuario.ADMIN ||
    usuario.clienteId !==
      null ||
    usuario.membroComiteEtica
  ) {
    throw new Error(
      "Apenas um administrador da Mundial pode gerenciar o Comitê de Ética."
    );
  }


  return usuario;
}


export async function listarUsuariosComiteEticaMundial(): Promise<
  UsuarioComiteEticaMundial[]
> {
  await validarAdministradorMundial();


  return prisma.usuario.findMany({
    where: {
      perfil:
        PerfilUsuario.ADMIN,

      membroComiteEtica:
        true,

      clienteId:
        null,
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

      atualizadoEm:
        true,
    },
  });
}


export async function salvarUsuarioComiteEticaMundial(
  dados: SalvarUsuarioComiteEticaInput
): Promise<UsuarioComiteEticaMundial> {
  await validarAdministradorMundial();


  const id =
    dados.id?.trim() ||
    undefined;


  const nome =
    dados.nome
      ?.trim();


  const email =
    dados.email
      ?.trim()
      .toLowerCase();


  const senha =
    dados.senha ??
    "";


  if (
    !nome
  ) {
    throw new Error(
      "Nome é obrigatório."
    );
  }


  if (
    !email
  ) {
    throw new Error(
      "E-mail é obrigatório."
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


  if (
    id
  ) {
    const usuarioAtual =
      await prisma.usuario.findFirst({
        where: {
          id,

          perfil:
            PerfilUsuario.ADMIN,

          membroComiteEtica:
            true,

          clienteId:
            null,
        },

        select: {
          id:
            true,
        },
      });


    if (
      !usuarioAtual
    ) {
      throw new Error(
        "Usuário do Comitê de Ética não encontrado."
      );
    }


    if (
      senha &&
      senha.length <
        8
    ) {
      throw new Error(
        "A nova senha deve possuir pelo menos 8 caracteres."
      );
    }


    const atualizado =
      await prisma.usuario.update({
        where: {
          id,
        },

        data: {
          nome,

          email,

          ativo:
            dados.ativo,

          perfil:
            PerfilUsuario.ADMIN,

          membroComiteEtica:
            true,

          clienteId:
            null,

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

          atualizadoEm:
            true,
        },
      });


    revalidatePath(
      "/comite-etica"
    );


    return atualizado;
  }


  if (
    senha.length <
    8
  ) {
    throw new Error(
      "A senha provisória deve possuir pelo menos 8 caracteres."
    );
  }


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

        /*
         * O membro do Comitê é um ADMIN normal.
         * O campo membroComiteEtica serve apenas
         * para identificá-lo dentro da Mundial.
         */
        perfil:
          PerfilUsuario.ADMIN,

        membroComiteEtica:
          true,

        ativo:
          dados.ativo,

        clienteId:
          null,
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

        atualizadoEm:
          true,
      },
    });


  revalidatePath(
    "/comite-etica"
  );


  return criado;
}


export async function alterarStatusUsuarioComiteEticaMundial(
  usuarioId: string,
  ativo: boolean
) {
  await validarAdministradorMundial();


  const id =
    usuarioId?.trim();


  if (
    !id
  ) {
    throw new Error(
      "Usuário não informado."
    );
  }


  const usuario =
    await prisma.usuario.findFirst({
      where: {
        id,

        perfil:
          PerfilUsuario.ADMIN,

        membroComiteEtica:
          true,

        clienteId:
          null,
      },

      select: {
        id:
          true,
      },
    });


  if (
    !usuario
  ) {
    throw new Error(
      "Usuário do Comitê de Ética não encontrado."
    );
  }


  await prisma.usuario.update({
    where: {
      id,
    },

    data: {
      ativo,
    },
  });


  revalidatePath(
    "/comite-etica"
  );


  return {
    sucesso:
      true,
  };
}


export async function excluirUsuarioComiteEticaMundial(
  usuarioId: string
) {
  await validarAdministradorMundial();


  const id =
    usuarioId?.trim();


  if (
    !id
  ) {
    throw new Error(
      "Usuário não informado."
    );
  }


  const usuario =
    await prisma.usuario.findFirst({
      where: {
        id,

        perfil:
          PerfilUsuario.ADMIN,

        membroComiteEtica:
          true,

        clienteId:
          null,
      },

      select: {
        id:
          true,
      },
    });


  if (
    !usuario
  ) {
    throw new Error(
      "Usuário do Comitê de Ética não encontrado."
    );
  }


  try {
    await prisma.usuario.delete({
      where: {
        id,
      },
    });
  } catch {
    throw new Error(
      "Este usuário possui registros vinculados. Desative o acesso em vez de excluir."
    );
  }


  revalidatePath(
    "/comite-etica"
  );


  return {
    sucesso:
      true,
  };
}

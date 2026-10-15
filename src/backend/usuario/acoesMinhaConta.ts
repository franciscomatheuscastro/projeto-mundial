"use server";

import {
  PerfilUsuario,
} from "@prisma/client";

import {
  compare,
  hash,
} from "bcryptjs";

import {
  auth,
} from "@/src/auth";

import {
  prisma,
} from "@/src/lib/prisma";


export type ResultadoAlteracaoSenha = {
  sucesso: boolean;
  mensagem: string;
};


type DadosAlteracaoSenha = {
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
};


const PERFIS_CLIENTE_PERMITIDOS =
  new Set<PerfilUsuario>([
    PerfilUsuario.CLIENTE,
    PerfilUsuario.COMITE_CLIENTE,
  ]);


export async function alterarMinhaSenha({
  senhaAtual,
  novaSenha,
  confirmarSenha,
}: DadosAlteracaoSenha): Promise<ResultadoAlteracaoSenha> {
  const session =
    await auth();


  if (
    !session?.user
  ) {
    return {
      sucesso:
        false,

      mensagem:
        "Sua sessão expirou. Entre novamente na plataforma.",
    };
  }


  const usuarioSessao =
    session.user as {
      id?: string;
      perfil?: PerfilUsuario;
      clienteId?: string | null;
    };


  if (
    !usuarioSessao.id ||
    !usuarioSessao.perfil ||
    !PERFIS_CLIENTE_PERMITIDOS.has(
      usuarioSessao.perfil
    )
  ) {
    return {
      sucesso:
        false,

      mensagem:
        "Seu usuário não possui permissão para alterar a senha por esta página.",
    };
  }


  const senhaAtualLimpa =
    String(
      senhaAtual ||
      ""
    );


  const novaSenhaLimpa =
    String(
      novaSenha ||
      ""
    );


  const confirmarSenhaLimpa =
    String(
      confirmarSenha ||
      ""
    );


  if (
    !senhaAtualLimpa ||
    !novaSenhaLimpa ||
    !confirmarSenhaLimpa
  ) {
    return {
      sucesso:
        false,

      mensagem:
        "Preencha a senha atual, a nova senha e a confirmação.",
    };
  }


  if (
    novaSenhaLimpa.length <
    8
  ) {
    return {
      sucesso:
        false,

      mensagem:
        "A nova senha deve possuir pelo menos 8 caracteres.",
    };
  }


  /*
   * O bcrypt considera no máximo 72 bytes.
   * Limitamos explicitamente para evitar senhas
   * visualmente diferentes que produzam o mesmo hash.
   */
  if (
    Buffer.byteLength(
      novaSenhaLimpa,
      "utf8"
    ) >
    72
  ) {
    return {
      sucesso:
        false,

      mensagem:
        "A nova senha é muito longa. Utilize no máximo 72 bytes.",
    };
  }


  if (
    novaSenhaLimpa !==
    confirmarSenhaLimpa
  ) {
    return {
      sucesso:
        false,

      mensagem:
        "A nova senha e a confirmação não coincidem.",
    };
  }


  const usuario =
    await prisma.usuario.findFirst({
      where: {
        id:
          usuarioSessao.id,

        ativo:
          true,

        perfil:
          usuarioSessao.perfil,

        ...(usuarioSessao.clienteId
          ? {
              clienteId:
                usuarioSessao.clienteId,
            }
          : {}),
      },

      select: {
        id:
          true,

        senha:
          true,

        ativo:
          true,
      },
    });


  if (
    !usuario
  ) {
    return {
      sucesso:
        false,

      mensagem:
        "Não foi possível localizar seu usuário ativo.",
    };
  }


  const senhaAtualValida =
    await compare(
      senhaAtualLimpa,
      usuario.senha
    );


  if (
    !senhaAtualValida
  ) {
    return {
      sucesso:
        false,

      mensagem:
        "A senha atual está incorreta.",
    };
  }


  const repetiuSenhaAtual =
    await compare(
      novaSenhaLimpa,
      usuario.senha
    );


  if (
    repetiuSenhaAtual
  ) {
    return {
      sucesso:
        false,

      mensagem:
        "A nova senha deve ser diferente da senha atual.",
    };
  }


  const senhaCriptografada =
    await hash(
      novaSenhaLimpa,
      12
    );


  await prisma.usuario.update({
    where: {
      id:
        usuario.id,
    },

    data: {
      senha:
        senhaCriptografada,
    },
  });


  return {
    sucesso:
      true,

    mensagem:
      "Senha alterada com sucesso.",
  };
}

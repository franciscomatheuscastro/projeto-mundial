import {
  PerfilUsuario,
} from "@prisma/client";

import {
  redirect,
} from "next/navigation";

import {
  auth,
} from "@/src/auth";

import {
  prisma,
} from "@/src/lib/prisma";

import MinhaContaTela from "@/src/app/components/clientes/MinhaContaTela";


type UsuarioSessao = {
  id?: string;
  nome?: string | null;
  name?: string | null;
  email?: string | null;
  perfil?: PerfilUsuario;
  clienteId?: string | null;
};


export default async function MinhaContaPage() {
  const session =
    await auth();


  if (
    !session?.user
  ) {
    redirect(
      "/login"
    );
  }


  const usuarioSessao =
    session.user as UsuarioSessao;


  const perfilPermitido =
    usuarioSessao.perfil ===
      PerfilUsuario.CLIENTE ||
    usuarioSessao.perfil ===
      PerfilUsuario.COMITE_CLIENTE;


  if (
    !perfilPermitido
  ) {
    redirect(
      "/dashboard"
    );
  }


  if (
    !usuarioSessao.id ||
    !usuarioSessao.clienteId ||
    !usuarioSessao.perfil
  ) {
    redirect(
      "/painel-controle"
    );
  }


  /*
   * Busca apenas os dados do usuário atualmente logado.
   *
   * Isso é importante para o membro do comitê:
   * ele deve visualizar e alterar a própria conta,
   * nunca a conta do usuário master.
   */
  const usuarioAtual =
    await prisma.usuario.findFirst({
      where: {
        id:
          usuarioSessao.id,

        clienteId:
          usuarioSessao.clienteId,

        perfil:
          usuarioSessao.perfil,
      },

      select: {
        id:
          true,

        nome:
          true,

        email:
          true,

        perfil:
          true,

        ativo:
          true,

        criadoEm:
          true,

        atualizadoEm:
          true,
      },
    });


  if (
    !usuarioAtual
  ) {
    redirect(
      "/painel-controle"
    );
  }


  return (
    <MinhaContaTela
      usuarioAtual={{
        id:
          usuarioAtual.id,

        nome:
          usuarioAtual.nome,

        email:
          usuarioAtual.email,

        perfil:
          usuarioAtual.perfil,

        ativo:
          usuarioAtual.ativo,

        criadoEm:
          usuarioAtual.criadoEm.toISOString(),

        atualizadoEm:
          usuarioAtual.atualizadoEm.toISOString(),
      }}
    />
  );
}

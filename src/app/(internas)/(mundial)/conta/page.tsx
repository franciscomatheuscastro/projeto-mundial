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

import MinhaContaTela from "@/src/app/components/usuarios/MinhaContaTela";


const PERFIS_MUNDIAL =
  new Set<PerfilUsuario>([
    PerfilUsuario.ADMIN,
    PerfilUsuario.GESTOR,
    PerfilUsuario.PSICOLOGO,
    PerfilUsuario.ASSISTENTE_SOCIAL,
    PerfilUsuario.RECEPCAO,
  ]);


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
    session.user as {
      id?: string;
      perfil?: PerfilUsuario;
      clienteId?: string | null;
    };


  if (
    !usuarioSessao.id
  ) {
    redirect(
      "/login"
    );
  }


  if (
    !usuarioSessao.perfil ||
    !PERFIS_MUNDIAL.has(
      usuarioSessao.perfil
    )
  ) {
    redirect(
      "/painel-controle"
    );
  }


  const usuario =
    await prisma.usuario.findFirst({
      where: {
        id:
          usuarioSessao.id,

        ativo:
          true,
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
      },
    });


  if (
    !usuario
  ) {
    redirect(
      "/login"
    );
  }


  return (
    <MinhaContaTela
      usuario={{
        id:
          usuario.id,

        nome:
          usuario.nome,

        email:
          usuario.email,

        perfil:
          usuario.perfil,

        criadoEm:
          usuario.criadoEm.toISOString(),
      }}
    />
  );
}
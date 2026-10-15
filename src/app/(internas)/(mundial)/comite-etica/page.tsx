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

import {
  listarUsuariosComiteEticaMundial,
} from "@/src/backend/denuncia/acoesComiteEticaMundial";

import ComiteEticaMundialTela from "@/src/app/components/denuncias/ComiteEticaMundialTela";


export default async function ComiteEticaPage() {
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
    };


  if (
    !usuarioSessao.id
  ) {
    redirect(
      "/dashboard"
    );
  }


  const usuario =
    await prisma.usuario.findUnique({
      where: {
        id:
          usuarioSessao.id,
      },

      select: {
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


  /*
   * A página de gerenciamento do Comitê de Ética
   * é exclusiva dos administradores normais da Mundial.
   *
   * Membros do Comitê também usam PerfilUsuario.ADMIN,
   * mas são identificados por membroComiteEtica = true.
   */
  const podeGerenciarComite =
    Boolean(
      usuario &&
      usuario.ativo &&
      usuario.perfil ===
        PerfilUsuario.ADMIN &&
      usuario.clienteId ===
        null &&
      !usuario.membroComiteEtica
    );


  if (
    !podeGerenciarComite
  ) {
    redirect(
      "/dashboard"
    );
  }


  const usuarios =
    await listarUsuariosComiteEticaMundial();


  return (
    <ComiteEticaMundialTela
      usuariosIniciais={
        usuarios
      }
    />
  );
}

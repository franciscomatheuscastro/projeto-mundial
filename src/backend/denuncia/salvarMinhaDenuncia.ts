"use server";

import { auth } from "@/src/auth";
import { PerfilUsuario } from "@prisma/client";
import { Denuncia } from "@/src/core/model/Denuncia";

export default async function salvarMinhaDenuncia(
  _denuncia: Denuncia
): Promise<never> {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  const usuario = session.user as {
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  if (
    usuario.perfil !== PerfilUsuario.CLIENTE &&
    usuario.perfil !==
      PerfilUsuario.COMITE_CLIENTE
  ) {
    throw new Error("Acesso não autorizado.");
  }

  if (!usuario.clienteId) {
    throw new Error(
      "Usuário sem cliente vinculado."
    );
  }

  throw new Error(
    "Usuários do cliente podem apenas visualizar a denúncia. Somente a Mundial pode alterar status, gravidade ou resposta final."
  );
}
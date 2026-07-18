"use server";

import { auth } from "@/src/auth";

import RepositorioCategoriaDenuncia from "./RepositorioCategoriaDenuncia";

export default async function alterarStatusCategoriaDenuncia(
  id: string,
  ativo: boolean
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  const perfil = (session.user as any)
    .perfil;

  if (
    perfil !== "ADMIN" &&
    perfil !== "GESTOR"
  ) {
    throw new Error(
      "Acesso não autorizado."
    );
  }

  return RepositorioCategoriaDenuncia.alterarStatus(
    id,
    ativo
  );
}
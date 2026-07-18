"use server";

import { auth } from "@/src/auth";

import RepositorioCategoriaDenuncia from "./RepositorioCategoriaDenuncia";

export default async function obterTodasCategoriasDenuncia() {
  const session = await auth();

  if (!session?.user) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  const perfil = (session.user as any)
    .perfil;

  if (
    perfil === "CLIENTE" ||
    perfil === "COMITE_CLIENTE"
  ) {
    throw new Error(
      "Acesso não autorizado."
    );
  }

  return RepositorioCategoriaDenuncia.obterTodas();
}
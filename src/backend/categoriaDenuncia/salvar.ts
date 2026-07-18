"use server";

import { auth } from "@/src/auth";

import type {
  CategoriaDenuncia,
} from "@/src/core/model/CategoriaDenuncia";

import RepositorioCategoriaDenuncia from "./RepositorioCategoriaDenuncia";

export default async function salvarCategoriaDenuncia(
  categoria: Partial<CategoriaDenuncia>
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

  return RepositorioCategoriaDenuncia.salvar(
    categoria
  );
}
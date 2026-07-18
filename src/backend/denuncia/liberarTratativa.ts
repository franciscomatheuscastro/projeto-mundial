"use server";

import { auth } from "@/src/auth";
import RepositorioDenuncia from "./RepositorioDenuncia";
import type { LiberarTratativaInput } from "@/src/core/model/Denuncia";

const PERFIS_MUNDIAL = [
  "ADMIN",
  "GESTOR",
  "PSICOLOGO",
  "ASSISTENTE_SOCIAL",
];

export default async function liberarTratativaDenuncia(
  dados: LiberarTratativaInput
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  const usuario = session.user as any;

  if (!PERFIS_MUNDIAL.includes(usuario.perfil)) {
    throw new Error(
      "Somente a Mundial pode liberar e direcionar tratativas."
    );
  }

  return RepositorioDenuncia.liberarTratativa(dados, {
    usuarioId: usuario.id,
    nome: usuario.name || usuario.nome || "Mundial",
    perfil: usuario.perfil,
    origem: "MUNDIAL",
  });
}

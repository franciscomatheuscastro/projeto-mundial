"use server";

import { auth } from "@/src/auth";
import RepositorioDenuncia from "./RepositorioDenuncia";
import type { NovaTratativa } from "@/src/core/model/Denuncia";

const PERFIS_MUNDIAL = [
  "ADMIN",
  "GESTOR",
  "PSICOLOGO",
  "ASSISTENTE_SOCIAL",
];

export default async function adicionarTratativaDenuncia(
  denunciaId: string,
  tratativa: NovaTratativa
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  const usuario = session.user as any;

  if (!PERFIS_MUNDIAL.includes(usuario.perfil)) {
    throw new Error("Acesso não autorizado.");
  }

  return RepositorioDenuncia.adicionarTratativa(
    denunciaId,
    tratativa,
    {
      usuarioId: usuario.id,
      nome: usuario.name || usuario.nome || "Mundial",
      perfil: usuario.perfil,
      origem: "MUNDIAL",
    }
  );
}

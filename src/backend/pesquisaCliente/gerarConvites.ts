"use server";

import { auth } from "@/src/auth";
import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";

export default async function gerarConvitesPesquisaCliente(
  pesquisaId: string,
  quantidade: number
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  if ((session.user as any).perfil === "CLIENTE") {
    throw new Error("Acesso não permitido.");
  }

  return RepositorioPesquisaCliente.gerarConvites(pesquisaId, quantidade);
}
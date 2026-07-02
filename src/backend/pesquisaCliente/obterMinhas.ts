"use server";

import { auth } from "@/src/auth";
import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";

export default async function obterMinhasPesquisasCliente() {
  const session = await auth();

  if (!session?.user) throw new Error("Usuário não autenticado.");
  if ((session.user as any).perfil !== "CLIENTE") {
    throw new Error("Acesso não autorizado.");
  }

  const clienteId = (session.user as any).clienteId;

  if (!clienteId) throw new Error("Usuário sem cliente vinculado.");

  return RepositorioPesquisaCliente.obterMinhas(clienteId);
}
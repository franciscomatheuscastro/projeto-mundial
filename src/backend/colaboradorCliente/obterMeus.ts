"use server";

import { auth } from "@/src/auth";
import { PerfilUsuario } from "@prisma/client";
import RepositorioColaboradorCliente from "./RepositorioColaboradorCliente";

export default async function obterMeusColaboradores() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  const usuario = session.user as {
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  if (usuario.perfil !== PerfilUsuario.CLIENTE) {
    throw new Error(
      "Apenas o administrador do cliente pode visualizar os colaboradores."
    );
  }

  if (!usuario.clienteId) {
    throw new Error("Usuário não vinculado a um cliente.");
  }

  return RepositorioColaboradorCliente.obterPorCliente(
    usuario.clienteId
  );
}
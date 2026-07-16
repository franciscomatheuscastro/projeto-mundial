"use server";

import { revalidatePath } from "next/cache";
import { PerfilUsuario } from "@prisma/client";
import { auth } from "@/src/auth";
import RepositorioColaboradorCliente from "./RepositorioColaboradorCliente";

export default async function excluirMeuColaborador(id: string) {
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
      "Apenas o administrador do cliente pode excluir colaboradores."
    );
  }

  if (!usuario.clienteId) {
    throw new Error("Usuário não vinculado a um cliente.");
  }

  await RepositorioColaboradorCliente.excluir(
    id,
    usuario.clienteId
  );

  revalidatePath("/meus-colaboradores");
  revalidatePath("/minhas-denuncias");
}
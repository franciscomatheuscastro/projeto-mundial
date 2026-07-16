"use server";

import { revalidatePath } from "next/cache";
import { PerfilUsuario } from "@prisma/client";
import { auth } from "@/src/auth";
import { ColaboradorCliente } from "@/src/core/model/ColaboradorCliente";
import RepositorioColaboradorCliente from "./RepositorioColaboradorCliente";

export default async function salvarMeuColaborador(
  colaborador: ColaboradorCliente
) {
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
      "Apenas o administrador do cliente pode cadastrar colaboradores."
    );
  }

  if (!usuario.clienteId) {
    throw new Error("Usuário não vinculado a um cliente.");
  }

  const resultado = await RepositorioColaboradorCliente.salvar(
    usuario.clienteId,
    colaborador
  );

  revalidatePath("/meus-colaboradores");
  revalidatePath("/minhas-denuncias");

  return resultado;
}
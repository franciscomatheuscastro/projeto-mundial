"use server";

import {
  PerfilUsuario,
} from "@prisma/client";

import { auth } from "@/src/auth";
import RepositorioCliente from "./RepositorioCliente";

import type {
  ClienteDetalhado,
} from "@/src/core/model/Cliente";

export default async function obterMinhaConta(): Promise<ClienteDetalhado> {
  const session = await auth();

  if (!session?.user) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  const usuario =
    session.user as {
      perfil?: PerfilUsuario;
      clienteId?: string | null;
    };

  if (
    usuario.perfil !==
      PerfilUsuario.CLIENTE ||
    !usuario.clienteId
  ) {
    throw new Error(
      "Usuário sem cliente vinculado."
    );
  }

  return RepositorioCliente.obterPorId(
    usuario.clienteId
  );
}
"use server";

import { revalidatePath } from "next/cache";
import { PerfilUsuario } from "@prisma/client";

import { auth } from "@/src/auth";

import type {
  Denuncia,
} from "@/src/core/model/Denuncia";

import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function criarMinhaDenunciaManual(
  denuncia: Denuncia
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  const usuario = session.user as {
    id?: string;
    name?: string | null;
    nome?: string | null;
    email?: string | null;
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  if (
    usuario.perfil !==
    PerfilUsuario.CLIENTE
  ) {
    throw new Error(
      "Acesso não autorizado."
    );
  }

  if (!usuario.clienteId?.trim()) {
    throw new Error(
      "Usuário sem cliente vinculado."
    );
  }

  const resultado =
    await RepositorioDenuncia.criarManualCliente(
      usuario.clienteId,
      denuncia,
      {
        usuarioId: usuario.id || null,

        nome:
          usuario.nome ||
          usuario.name ||
          usuario.email ||
          "Usuário cliente",

        perfil: PerfilUsuario.CLIENTE,

        origem: "CLIENTE",
      }
    );

  revalidatePath(
    "/minhas-denuncias"
  );

  revalidatePath(
    "/painel-controle"
  );

  return resultado;
}
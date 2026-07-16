"use server";

import { PerfilUsuario } from "@prisma/client";

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function obterMinhaDenunciaPorId(
  id: string
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  if (!id?.trim()) {
    throw new Error("Denúncia não identificada.");
  }

  const usuario = session.user as {
    id?: string;
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  const podeVisualizar =
    usuario.perfil === PerfilUsuario.CLIENTE ||
    usuario.perfil === PerfilUsuario.COMITE_CLIENTE;

  if (!podeVisualizar) {
    throw new Error("Acesso não autorizado.");
  }

  if (!usuario.clienteId) {
    throw new Error("Usuário sem cliente vinculado.");
  }

  if (usuario.perfil === PerfilUsuario.COMITE_CLIENTE) {
    if (!usuario.id) {
      throw new Error("Usuário não identificado.");
    }

    const colaborador =
      await prisma.colaboradorCliente.findFirst({
        where: {
          usuarioId: usuario.id,
          clienteId: usuario.clienteId,
          ativo: true,
          podeVerDenuncias: true,
        },
        select: {
          id: true,
        },
      });

    if (!colaborador) {
      throw new Error(
        "Você não possui permissão para visualizar denúncias."
      );
    }
  }

  return RepositorioDenuncia.obterPorIdECliente(
    id,
    usuario.clienteId
  );
}
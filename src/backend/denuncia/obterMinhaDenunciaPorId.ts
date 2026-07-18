"use server";

import { auth } from "@/src/auth";
import { PerfilUsuario } from "@prisma/client";

import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function obterMinhaDenunciaPorId(
  id: string
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  const usuario = session.user as {
    id?: string;
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  if (!usuario.clienteId) {
    throw new Error("Usuário sem cliente vinculado.");
  }

  if (!id?.trim()) {
    throw new Error("Denúncia não informada.");
  }

  if (usuario.perfil === PerfilUsuario.CLIENTE) {
    return RepositorioDenuncia.obterPorIdECliente(
      id,
      usuario.clienteId,
      {
        colaboradorId: null,
        podeVerTratativas: false,
      }
    );
  }

  if (
    usuario.perfil ===
    PerfilUsuario.COMITE_CLIENTE
  ) {
    if (!usuario.id) {
      throw new Error(
        "Usuário do comitê não identificado."
      );
    }

    const colaborador =
      await RepositorioDenuncia.obterColaboradorPorUsuario(
        usuario.id,
        usuario.clienteId
      );

    if (!colaborador) {
      throw new Error(
        "Colaborador vinculado ao usuário não encontrado."
      );
    }

    if (!colaborador.ativo) {
      throw new Error(
        "Seu acesso como colaborador está desativado."
      );
    }

    if (!colaborador.podeVerDenuncias) {
      throw new Error(
        "Você não possui permissão para visualizar denúncias."
      );
    }

    return RepositorioDenuncia.obterPorIdECliente(
      id,
      usuario.clienteId,
      {
        colaboradorId: colaborador.id,
        podeVerTratativas:
          colaborador.podeTratarDenuncias,
      }
    );
  }

  throw new Error("Acesso não autorizado.");
}
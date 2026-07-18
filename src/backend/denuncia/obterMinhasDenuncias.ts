"use server";

import { auth } from "@/src/auth";
import { PerfilUsuario } from "@prisma/client";

import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function obterMinhasDenuncias() {
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

  if (usuario.perfil === PerfilUsuario.CLIENTE) {
    return RepositorioDenuncia.obterPorCliente(
      usuario.clienteId
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

    return RepositorioDenuncia.obterPorClienteEColaborador(
      usuario.clienteId,
      colaborador.id
    );
  }

  throw new Error("Acesso não autorizado.");
}
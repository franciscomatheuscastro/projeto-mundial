"use server";

import { auth } from "@/src/auth";

import RepositorioDenuncia from "./RepositorioDenuncia";

import type { NovaTratativa } from "@/src/core/model/Denuncia";

const PERFIS_CLIENTE_PERMITIDOS = [
  "CLIENTE",
  "COMITE_CLIENTE",
];

export default async function adicionarMinhaTratativa(
  denunciaId: string,
  tratativa: NovaTratativa
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  const usuario = session.user as {
    id?: string;
    name?: string | null;
    nome?: string | null;
    perfil?: string;
    clienteId?: string | null;
  };

  if (
    !usuario.perfil ||
    !PERFIS_CLIENTE_PERMITIDOS.includes(
      usuario.perfil
    )
  ) {
    throw new Error("Acesso não autorizado.");
  }

  if (!usuario.id) {
    throw new Error(
      "Usuário autenticado sem identificador."
    );
  }

  if (!usuario.clienteId) {
    throw new Error(
      "Usuário sem cliente vinculado."
    );
  }

  const colaborador =
    await RepositorioDenuncia.obterColaboradorPorUsuario(
      usuario.id,
      usuario.clienteId
    );

  if (!colaborador) {
    throw new Error(
      "O usuário não está vinculado a um colaborador deste cliente."
    );
  }

  if (!colaborador.ativo) {
    throw new Error(
      "O cadastro do colaborador está inativo."
    );
  }

  if (!colaborador.podeTratarDenuncias) {
    throw new Error(
      "O colaborador não possui permissão para tratar denúncias."
    );
  }

  return RepositorioDenuncia.adicionarTratativa(
    denunciaId,
    tratativa,
    {
      usuarioId: usuario.id,

      nome:
        usuario.name?.trim() ||
        usuario.nome?.trim() ||
        colaborador.nome,

      perfil: usuario.perfil as any,

      origem: "COMITE_CLIENTE",
    },
    colaborador.id
  );
}
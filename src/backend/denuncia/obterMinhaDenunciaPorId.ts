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

  const denunciaId = id?.trim();

  if (!denunciaId) {
    throw new Error("Denúncia não informada.");
  }

  /*
   * Cliente master não pode abrir
   * os detalhes da denúncia.
   *
   * Esta trava precisa existir no backend,
   * e não somente escondendo o botão.
   */
  if (usuario.perfil === PerfilUsuario.CLIENTE) {
    throw new Error(
      "O perfil master do cliente não possui acesso aos detalhes das denúncias."
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

    const acesso =
      await RepositorioDenuncia.obterAcessoColaboradorNaDenuncia(
        denunciaId,
        usuario.clienteId,
        colaborador.id
      );

    if (!acesso.possuiAcesso) {
      throw new Error(
        "Esta denúncia não foi disponibilizada para o seu usuário."
      );
    }

    /*
     * Somente o responsável principal
     * pode visualizar e executar tratativas.
     *
     * Visualizadores adicionais recebem
     * apenas os dados da denúncia.
     */
    const podeVerTratativas =
      acesso.responsavelPrincipal &&
      colaborador.podeTratarDenuncias;

    return RepositorioDenuncia.obterPorIdECliente(
      denunciaId,
      usuario.clienteId,
      {
        colaboradorId: colaborador.id,
        podeVerTratativas,
      }
    );
  }

  throw new Error("Acesso não autorizado.");
}
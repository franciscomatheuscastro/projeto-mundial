"use server";

import { auth } from "@/src/auth";

import type {
  EditarTratativaInput,
} from "@/src/core/model/Denuncia";

import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function editarMinhaTratativa(
  dados: EditarTratativaInput
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error(
      "Usuário não autenticado."
    );
  }

  const usuario = session.user as any;

  const perfil = usuario.perfil as
    | "ADMIN"
    | "GESTOR"
    | "PSICOLOGO"
    | "ASSISTENTE_SOCIAL"
    | "RECEPCAO"
    | "CLIENTE"
    | "COMITE_CLIENTE";

  if (
    perfil !== "COMITE_CLIENTE" &&
    perfil !== "CLIENTE"
  ) {
    throw new Error(
      "Acesso não autorizado."
    );
  }

  const clienteId =
    usuario.clienteId as string | undefined;

  if (!clienteId?.trim()) {
    throw new Error(
      "Usuário sem cliente vinculado."
    );
  }

  if (!dados?.id?.trim()) {
    throw new Error(
      "Tratativa não informada."
    );
  }

  if (!dados?.denunciaId?.trim()) {
    throw new Error(
      "Denúncia não informada."
    );
  }

  if (!dados?.titulo?.trim()) {
    throw new Error(
      "O título da tratativa é obrigatório."
    );
  }

  if (!dados?.descricao?.trim()) {
    throw new Error(
      "A descrição da tratativa é obrigatória."
    );
  }

  const colaborador =
    await RepositorioDenuncia.obterColaboradorPorUsuario(
      usuario.id,
      clienteId
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

  if (!colaborador.podeTratarDenuncias) {
    throw new Error(
      "Você não possui permissão para tratar denúncias."
    );
  }

  return RepositorioDenuncia.editarTratativa(
    {
      ...dados,

      id: dados.id.trim(),
      denunciaId: dados.denunciaId.trim(),
      titulo: dados.titulo.trim(),
      descricao: dados.descricao.trim(),

      /*
       * O colaborador não pode trocar o responsável
       * da tratativa. O repositório preservará o
       * responsável atual.
       */
      responsavelId:
        dados.responsavelId?.trim() ||
        null,
    },
    {
      usuarioId: usuario.id || null,
      nome:
        usuario.nome ||
        usuario.name ||
        colaborador.nome,
      perfil,
      origem: "COMITE_CLIENTE",
    },
    colaborador.id
  );
}
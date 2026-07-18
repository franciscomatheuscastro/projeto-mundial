"use server";

import { auth } from "@/src/auth";

import type {
  EditarTratativaInput,
} from "@/src/core/model/Denuncia";

import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function editarTratativa(
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

  const perfisAutorizados = [
    "ADMIN",
    "GESTOR",
    "PSICOLOGO",
    "ASSISTENTE_SOCIAL",
  ];

  if (!perfisAutorizados.includes(perfil)) {
    throw new Error(
      "Você não possui permissão para editar tratativas."
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

  return RepositorioDenuncia.editarTratativa(
    {
      ...dados,

      id: dados.id.trim(),
      denunciaId: dados.denunciaId.trim(),
      titulo: dados.titulo.trim(),
      descricao: dados.descricao.trim(),

      responsavelId:
        dados.responsavelId?.trim() ||
        null,
    },
    {
      usuarioId: usuario.id || null,
      nome:
        usuario.nome ||
        usuario.name ||
        "Usuário Mundial",
      perfil,
      origem: "MUNDIAL",
    }
  );
}
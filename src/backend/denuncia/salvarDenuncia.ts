"use server";

import { revalidatePath } from "next/cache";
import { PerfilUsuario } from "@prisma/client";

import { auth } from "@/src/auth";

import type {
  Denuncia,
} from "@/src/core/model/Denuncia";

import RepositorioDenuncia from "./RepositorioDenuncia";

const PERFIS_MUNDIAL: PerfilUsuario[] = [
  PerfilUsuario.ADMIN,
  PerfilUsuario.GESTOR,
  PerfilUsuario.PSICOLOGO,
  PerfilUsuario.ASSISTENTE_SOCIAL,
  PerfilUsuario.RECEPCAO,
];

export default async function salvarDenuncia(
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
  };

  if (
    !usuario.perfil ||
    !PERFIS_MUNDIAL.includes(
      usuario.perfil
    )
  ) {
    throw new Error(
      "Somente usuários internos da Mundial podem alterar a denúncia."
    );
  }

  if (!denuncia.id?.trim()) {
    throw new Error(
      "Denúncia não identificada."
    );
  }

  if (!denuncia.titulo?.trim()) {
    throw new Error(
      "Título da denúncia é obrigatório."
    );
  }

  if (!denuncia.descricao?.trim()) {
    throw new Error(
      "Descrição da denúncia é obrigatória."
    );
  }

  if (!denuncia.categoriaId?.trim()) {
    throw new Error(
      "Categoria da denúncia é obrigatória."
    );
  }

  if (
    denuncia.status === "CONCLUIDA" &&
    !denuncia.respostaPublica?.trim()
  ) {
    throw new Error(
      "Informe a resposta final antes de concluir a denúncia."
    );
  }

  const denunciaAtual =
    await RepositorioDenuncia.obterPorId(
      denuncia.id
    );

  const resultado =
    await RepositorioDenuncia.salvar(
      {
        ...denuncia,

        /*
         * Mantém o cliente original e impede
         * manipulação pelo navegador.
         */
        clienteId:
          denunciaAtual.clienteId,

        titulo:
          denuncia.titulo.trim(),

        descricao:
          denuncia.descricao.trim(),

        /*
         * Categoria agora é uma relação.
         * O campo persistido é categoriaId.
         */
        categoriaId:
          denuncia.categoriaId.trim(),

        localOcorrido:
          denuncia.localOcorrido?.trim() ||
          null,

        nomeDenunciante:
          denuncia.nomeDenunciante?.trim() ||
          null,

        emailDenunciante:
          denuncia.emailDenunciante
            ?.trim()
            .toLowerCase() || null,

        telefoneDenunciante:
          denuncia.telefoneDenunciante
            ?.trim() || null,

        respostaPublica:
          denuncia.respostaPublica?.trim() ||
          null,
      },
      {
        usuarioId:
          usuario.id || null,

        nome:
          usuario.nome ||
          usuario.name ||
          usuario.email ||
          "Usuário Mundial",

        perfil:
          usuario.perfil,

        origem:
          "MUNDIAL",
      }
    );

  revalidatePath(
    "/denuncias"
  );

  revalidatePath(
    `/denuncias/${resultado.id}`
  );

  revalidatePath(
    "/minhas-denuncias"
  );

  revalidatePath(
    `/minhas-denuncias/${resultado.id}`
  );

  revalidatePath(
    "/dashboard"
  );

  revalidatePath(
    "/painel-controle"
  );

  return resultado;
}
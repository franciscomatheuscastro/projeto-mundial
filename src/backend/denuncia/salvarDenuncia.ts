"use server";

import { revalidatePath } from "next/cache";
import { PerfilUsuario } from "@prisma/client";

import { auth } from "@/src/auth";
import { Denuncia } from "@/src/core/model/Denuncia";
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
    throw new Error("Usuário não autenticado.");
  }

  const usuario = session.user as {
    id?: string;
    perfil?: PerfilUsuario;
  };

  if (
    !usuario.perfil ||
    !PERFIS_MUNDIAL.includes(usuario.perfil)
  ) {
    throw new Error(
      "Somente usuários internos da Mundial podem alterar a denúncia."
    );
  }

  if (!denuncia.id) {
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

  /*
   * Uma denúncia não deve ser concluída sem uma resposta
   * final que possa ser consultada pelo denunciante.
   */
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

  if (!denunciaAtual) {
    throw new Error(
      "Denúncia não encontrada."
    );
  }

  const resultado =
    await RepositorioDenuncia.salvar({
      ...denuncia,

      /*
       * Impede que o cliente da denúncia seja trocado
       * por um valor manipulado no navegador.
       */
      clienteId: denunciaAtual.clienteId,

      titulo: denuncia.titulo.trim(),
      descricao: denuncia.descricao.trim(),

      categoria:
        denuncia.categoria?.trim() || null,

      localOcorrido:
        denuncia.localOcorrido?.trim() || null,

      respostaPublica:
        denuncia.respostaPublica?.trim() || null,
    });

  revalidatePath("/denuncias");
  revalidatePath(
    `/denuncias/${resultado.id}`
  );

  revalidatePath("/minhas-denuncias");
  revalidatePath(
    `/minhas-denuncias/${resultado.id}`
  );

  revalidatePath("/dashboard");
  revalidatePath("/painel-controle");

  return resultado;
}
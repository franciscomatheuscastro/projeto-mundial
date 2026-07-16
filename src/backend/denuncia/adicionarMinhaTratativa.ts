"use server";

import { revalidatePath } from "next/cache";
import { PerfilUsuario } from "@prisma/client";

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import RepositorioDenuncia from "./RepositorioDenuncia";

type NovaTratativa = {
  titulo: string;
  descricao: string;
  responsavel?: string | null;
};

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
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  if (
    usuario.perfil !== PerfilUsuario.COMITE_CLIENTE
  ) {
    throw new Error(
      "Somente membros do comitê podem registrar tratativas."
    );
  }

  if (!usuario.id) {
    throw new Error("Usuário não identificado.");
  }

  if (!usuario.clienteId) {
    throw new Error(
      "Usuário sem cliente vinculado."
    );
  }

  const titulo = tratativa.titulo?.trim();
  const descricao = tratativa.descricao?.trim();

  if (!titulo) {
    throw new Error(
      "Título da tratativa é obrigatório."
    );
  }

  if (!descricao) {
    throw new Error(
      "Descrição da tratativa é obrigatória."
    );
  }

  const colaborador =
    await prisma.colaboradorCliente.findFirst({
      where: {
        usuarioId: usuario.id,
        clienteId: usuario.clienteId,
        ativo: true,
        podeVerDenuncias: true,
        podeTratarDenuncias: true,
      },
      select: {
        id: true,
        nome: true,
      },
    });

  if (!colaborador) {
    throw new Error(
      "Você não possui permissão para registrar tratativas."
    );
  }

  await RepositorioDenuncia.obterPorIdECliente(
    denunciaId,
    usuario.clienteId
  );

  const resultado =
    await RepositorioDenuncia.adicionarTratativa(
      denunciaId,
      {
        titulo,
        descricao,

        /*
         * O responsável vem do cadastro autenticado.
         * Não usamos o valor enviado pelo navegador.
         */
        responsavel: colaborador.nome,
      }
    );

  revalidatePath("/minhas-denuncias");
  revalidatePath(
    `/minhas-denuncias/${denunciaId}`
  );

  revalidatePath("/denuncias");
  revalidatePath(`/denuncias/${denunciaId}`);

  revalidatePath("/painel-controle");
  revalidatePath("/dashboard");

  return resultado;
}
"use server";

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";

type UsuarioSessao = {
  perfil?: string;
  clienteId?: string | null;
};

export default async function gerarConvitesPesquisaCliente(
  pesquisaId: string,
  quantidade: number
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  if (!pesquisaId?.trim()) {
    throw new Error("Pesquisa não informada.");
  }

  const quantidadeNormalizada = Number(quantidade);

  if (
    !Number.isInteger(quantidadeNormalizada) ||
    quantidadeNormalizada < 1 ||
    quantidadeNormalizada > 500
  ) {
    throw new Error(
      "A quantidade de links deve ser um número inteiro entre 1 e 500."
    );
  }

  const usuario = session.user as UsuarioSessao;

  if (usuario.perfil === "CLIENTE") {
    if (!usuario.clienteId) {
      throw new Error(
        "Usuário cliente não está vinculado a uma empresa."
      );
    }

    const pesquisa = await prisma.pesquisaCliente.findFirst({
      where: {
        id: pesquisaId,
        clienteId: usuario.clienteId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!pesquisa) {
      throw new Error(
        "Pesquisa não encontrada ou acesso não autorizado."
      );
    }

    if (pesquisa.status !== "ABERTA") {
      throw new Error(
        "Não é possível gerar links para uma pesquisa fechada ou arquivada."
      );
    }

    return RepositorioPesquisaCliente.gerarConvites(
      pesquisa.id,
      quantidadeNormalizada
    );
  }

  const perfisPermitidos = [
    "ADMIN",
    "GESTOR",
    "PSICOLOGO",
    "ASSISTENTE_SOCIAL",
    "RECEPCAO",
  ];

  if (
    !usuario.perfil ||
    !perfisPermitidos.includes(usuario.perfil)
  ) {
    throw new Error("Acesso não permitido.");
  }

  const pesquisa = await prisma.pesquisaCliente.findUnique({
    where: {
      id: pesquisaId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!pesquisa) {
    throw new Error("Pesquisa não encontrada.");
  }

  if (pesquisa.status !== "ABERTA") {
    throw new Error(
      "Não é possível gerar links para uma pesquisa fechada ou arquivada."
    );
  }

  return RepositorioPesquisaCliente.gerarConvites(
    pesquisa.id,
    quantidadeNormalizada
  );
}
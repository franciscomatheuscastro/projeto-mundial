"use server";

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export default async function obterColaboradoresPorCliente(
  clienteId: string
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  const usuario = session.user as any;

  const perfisPermitidos = [
    "ADMIN",
    "GESTOR",
    "PSICOLOGO",
    "ASSISTENTE_SOCIAL",
  ];

  if (!perfisPermitidos.includes(usuario.perfil)) {
    throw new Error("Acesso não autorizado.");
  }

  if (!clienteId?.trim()) {
    throw new Error("Cliente não informado.");
  }

  return prisma.colaboradorCliente.findMany({
    where: {
      clienteId,
    },

    orderBy: [
      {
        ativo: "desc",
      },
      {
        nome: "asc",
      },
    ],

    select: {
      id: true,
      nome: true,
      email: true,
      telefone: true,
      setor: true,
      cargo: true,
      ativo: true,
      podeVerDenuncias: true,
      podeTratarDenuncias: true,
    },
  });
}
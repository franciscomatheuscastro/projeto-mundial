"use server";

import { prisma } from "@/src/lib/prisma";
import { ParticipanteClienteDisponivel } from "@/src/core/model/Agendamento";

export default async function obterParticipantesCliente(
  clienteId: string
): Promise<ParticipanteClienteDisponivel[]> {
  if (!clienteId) return [];

  const cliente = await prisma.cliente.findUnique({
    where: { id: clienteId },
    include: {
      usuarios: {
        where: { ativo: true, perfil: "CLIENTE" },
        select: { id: true, nome: true, email: true },
      },
      colaboradores: {
        where: { ativo: true },
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          email: true,
          telefone: true,
          cargo: true,
          setor: true,
        },
      },
    },
  });

  if (!cliente) throw new Error("Cliente não encontrado.");

  const masters: ParticipanteClienteDisponivel[] = cliente.usuarios.map(
    (usuario) => ({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: cliente.telefone,
      origem: "CLIENTE_MASTER",
      descricao: "Cliente master",
    })
  );

  const colaboradores: ParticipanteClienteDisponivel[] =
    cliente.colaboradores.map((colaborador) => ({
      id: colaborador.id,
      nome: colaborador.nome,
      email: colaborador.email,
      telefone: colaborador.telefone,
      origem: "COLABORADOR",
      descricao:
        [colaborador.cargo, colaborador.setor].filter(Boolean).join(" • ") ||
        "Colaborador",
    }));

  return [...masters, ...colaboradores];
}

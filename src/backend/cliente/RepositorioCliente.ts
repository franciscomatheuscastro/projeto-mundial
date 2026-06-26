import { prisma } from "@/src/lib/prisma";
import {
  Cliente,
  ClienteComResumo,
  ClienteDetalhado,
} from "@/src/core/model/Cliente";

export default class RepositorioCliente {
  static async salvar(cliente: Cliente): Promise<Cliente> {
    const nome = cliente.nome?.trim();

    if (!nome) {
      throw new Error("Nome do cliente é obrigatório.");
    }

    const dados = {
      nome,
      empresa: cliente.empresa?.trim() || null,
      email: cliente.email?.trim().toLowerCase() || null,
      telefone: cliente.telefone?.trim() || null,
      documento: cliente.documento?.trim() || null,
      observacoes: cliente.observacoes?.trim() || null,
      ativo: cliente.ativo ?? true,
    };

    if (cliente.id) {
      return prisma.cliente.update({
        where: { id: cliente.id },
        data: dados,
      });
    }

    return prisma.cliente.create({
      data: dados,
    });
  }

  static async obterTodos(): Promise<ClienteComResumo[]> {
    const clientes = await prisma.cliente.findMany({
      orderBy: {
        criadoEm: "desc",
      },
      include: {
        _count: {
          select: {
            pesquisas: true,
          },
        },
      },
    });

    return clientes.map((cliente) => ({
      id: cliente.id,
      nome: cliente.nome,
      empresa: cliente.empresa,
      email: cliente.email,
      telefone: cliente.telefone,
      documento: cliente.documento,
      observacoes: cliente.observacoes,
      ativo: cliente.ativo,
      criadoEm: cliente.criadoEm,
      atualizadoEm: cliente.atualizadoEm,
      totalPesquisas: cliente._count.pesquisas,
    }));
  }

  static async obterPorId(id: string): Promise<ClienteDetalhado> {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        pesquisas: {
          include: {
            modelo: {
              select: {
                id: true,
                titulo: true,
              },
            },
          },
          orderBy: {
            criadoEm: "desc",
          },
        },
      },
    });

    if (!cliente) {
      throw new Error("Cliente não encontrado.");
    }

    return cliente;
  }
}
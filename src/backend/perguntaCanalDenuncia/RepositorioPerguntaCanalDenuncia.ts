import { Prisma, TipoPerguntaCanalDenuncia } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import type {
  PerguntaCanalDenuncia,
  PerguntaCanalPublica,
} from "@/src/core/model/PerguntaCanalDenuncia";

function converterOpcoes(valor: Prisma.JsonValue): string[] {
  return Array.isArray(valor)
    ? valor.filter((item): item is string => typeof item === "string")
    : [];
}

function normalizarOpcoes(
  tipo: TipoPerguntaCanalDenuncia,
  opcoes: string[]
) {
  if (tipo !== "MULTIPLA_ESCOLHA") return [];

  const resultado = Array.from(
    new Set(opcoes.map((item) => item.trim()).filter(Boolean))
  );

  if (resultado.length < 2) {
    throw new Error(
      "Perguntas de múltipla escolha precisam de pelo menos duas opções."
    );
  }

  return resultado;
}

function montar(registro: any): PerguntaCanalDenuncia {
  return {
    id: registro.id,
    enunciado: registro.enunciado,
    descricao: registro.descricao,
    tipo: registro.tipo,
    obrigatoria: registro.obrigatoria,
    opcoes: converterOpcoes(registro.opcoes),
    ativo: registro.ativo,
    ordem: registro.ordem,
    clienteIds: registro.clientes.map((item: any) => item.clienteId),
    clientes: registro.clientes.map((item: any) => ({
      id: item.cliente.id,
      nome: item.cliente.nome,
      empresa: item.cliente.empresa,
    })),
    criadoEm: registro.criadoEm,
    atualizadoEm: registro.atualizadoEm,
  };
}

const includeClientes = {
  clientes: {
    include: {
      cliente: {
        select: { id: true, nome: true, empresa: true },
      },
    },
  },
};

export default class RepositorioPerguntaCanalDenuncia {
  static async obterTodas(): Promise<PerguntaCanalDenuncia[]> {
    const dados = await prisma.perguntaCanalDenuncia.findMany({
      orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
      include: includeClientes,
    });

    return dados.map(montar);
  }

  static async obterPorId(id: string): Promise<PerguntaCanalDenuncia> {
    const dado = await prisma.perguntaCanalDenuncia.findUnique({
      where: { id },
      include: includeClientes,
    });

    if (!dado) throw new Error("Pergunta não encontrada.");
    return montar(dado);
  }

  static async obterAtivasPorCliente(
    clienteId: string
  ): Promise<PerguntaCanalPublica[]> {
    const dados = await prisma.perguntaCanalDenuncia.findMany({
      where: {
        ativo: true,
        clientes: { some: { clienteId } },
      },
      orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
      select: {
        id: true,
        enunciado: true,
        descricao: true,
        tipo: true,
        obrigatoria: true,
        opcoes: true,
        ordem: true,
      },
    });

    return dados.map((item) => ({
      ...item,
      opcoes: converterOpcoes(item.opcoes),
    }));
  }

  static async salvar(
    dados: PerguntaCanalDenuncia
  ): Promise<PerguntaCanalDenuncia> {
    const enunciado = dados.enunciado?.trim();
    if (!enunciado) throw new Error("O enunciado é obrigatório.");

    const clienteIds = Array.from(
      new Set((dados.clienteIds || []).map((id) => id.trim()).filter(Boolean))
    );

    if (!clienteIds.length) {
      throw new Error("Selecione pelo menos um cliente.");
    }

    const quantidadeClientes = await prisma.cliente.count({
      where: { id: { in: clienteIds }, ativo: true },
    });

    if (quantidadeClientes !== clienteIds.length) {
      throw new Error("Há clientes inválidos ou inativos na seleção.");
    }

    const opcoes = normalizarOpcoes(dados.tipo, dados.opcoes || []);

    const salvo = await prisma.$transaction(async (tx) => {
      if (dados.id) {
        await tx.perguntaCanalDenunciaCliente.deleteMany({
          where: { perguntaId: dados.id },
        });

        return tx.perguntaCanalDenuncia.update({
          where: { id: dados.id },
          data: {
            enunciado,
            descricao: dados.descricao?.trim() || null,
            tipo: dados.tipo,
            obrigatoria: dados.obrigatoria,
            opcoes,
            ativo: dados.ativo,
            ordem: Number.isFinite(dados.ordem) ? dados.ordem : 0,
            clientes: {
              create: clienteIds.map((clienteId) => ({ clienteId })),
            },
          },
          include: includeClientes,
        });
      }

      return tx.perguntaCanalDenuncia.create({
        data: {
          enunciado,
          descricao: dados.descricao?.trim() || null,
          tipo: dados.tipo,
          obrigatoria: dados.obrigatoria,
          opcoes,
          ativo: dados.ativo,
          ordem: Number.isFinite(dados.ordem) ? dados.ordem : 0,
          clientes: {
            create: clienteIds.map((clienteId) => ({ clienteId })),
          },
        },
        include: includeClientes,
      });
    });

    return montar(salvo);
  }

  static async excluir(id: string) {
    const quantidadeRespostas =
      await prisma.respostaPerguntaCanalDenuncia.count({
        where: { perguntaId: id },
      });

    if (quantidadeRespostas > 0) {
      return prisma.perguntaCanalDenuncia.update({
        where: { id },
        data: { ativo: false },
      });
    }

    return prisma.perguntaCanalDenuncia.delete({ where: { id } });
  }
}

import { randomUUID } from "crypto";
import { Prisma, TipoPergunta } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import {
  NovaRespostaPesquisa,
  PerguntaRespostaPesquisa,
} from "@/src/core/model/RespostaPesquisa";

function normalizarPerguntas(perguntas: unknown): PerguntaRespostaPesquisa[] {
  if (!Array.isArray(perguntas)) return [];

  return perguntas
    .map((pergunta, index) => {
      const item = pergunta as Partial<PerguntaRespostaPesquisa>;

      return {
        id: item.id || randomUUID(),
        titulo: item.titulo || "Pergunta",
        descricao: item.descricao || null,
        tipo: item.tipo || TipoPergunta.NOTA,
        ordem: item.ordem || index + 1,
        obrigatoria: item.obrigatoria ?? true,
        opcoes: Array.isArray(item.opcoes) ? item.opcoes : [],
      };
    })
    .sort((a, b) => a.ordem - b.ordem);
}

export default class RepositorioRespostaPesquisa {
  static async obterPorToken(token: string) {
    const pesquisa = await prisma.pesquisaCliente.findUnique({
      where: { token },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            empresa: true,
          },
        },
        modelo: {
          select: {
            id: true,
            titulo: true,
            descricao: true,
          },
        },
      },
    });

    if (!pesquisa) return null;

    return {
      id: pesquisa.id,
      titulo: pesquisa.titulo,
      descricao: pesquisa.descricao,
      token: pesquisa.token,
      status: pesquisa.status,
      perguntas: normalizarPerguntas(pesquisa.perguntas),
      cliente: pesquisa.cliente,
      modelo: pesquisa.modelo,
    };
  }

  static async salvar(resposta: NovaRespostaPesquisa) {
    const pesquisa = await prisma.pesquisaCliente.findUnique({
      where: { id: resposta.pesquisaId },
    });

    if (!pesquisa) {
      throw new Error("Pesquisa não encontrada.");
    }

    if (pesquisa.token !== resposta.token) {
      throw new Error("Token inválido.");
    }

    if (pesquisa.status !== "ABERTA") {
      throw new Error("Esta pesquisa não está mais recebendo respostas.");
    }

    const perguntas = normalizarPerguntas(pesquisa.perguntas);

    const respostasTratadas = resposta.respostas
      .map((item) => ({
        id: item.id || randomUUID(),
        perguntaId: item.perguntaId,
        valor: String(item.valor ?? "").trim(),
      }))
      .filter((item) => item.perguntaId && item.valor);

    for (const pergunta of perguntas) {
      const temResposta = respostasTratadas.some(
        (item) => item.perguntaId === pergunta.id
      );

      if (pergunta.obrigatoria && !temResposta) {
        throw new Error(`A pergunta "${pergunta.titulo}" é obrigatória.`);
      }
    }

    return prisma.respostaPesquisa.create({
      data: {
        pesquisaId: resposta.pesquisaId,
        nome: resposta.nome?.trim() || null,
        email: resposta.email?.trim() || null,
        setor: resposta.setor?.trim() || null,
        cargo: resposta.cargo?.trim() || null,
        respostas: respostasTratadas as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
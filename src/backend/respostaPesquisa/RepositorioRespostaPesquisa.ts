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
    const convite = await prisma.convitePesquisa.findUnique({
      where: { token },
      include: {
        pesquisa: {
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
        },
      },
    });

    if (convite) {
      const pesquisa = convite.pesquisa;

      return {
        id: pesquisa.id,
        titulo: pesquisa.titulo,
        descricao: pesquisa.descricao,
        token: pesquisa.token,
        status: pesquisa.status,
        perguntas: normalizarPerguntas(pesquisa.perguntas),
        cliente: pesquisa.cliente,
        modelo: pesquisa.modelo,
        convite: {
          id: convite.id,
          token: convite.token,
          respondido: convite.respondido,
          nome: convite.nome,
          email: convite.email,
          setor: convite.setor,
          cargo: convite.cargo,
        },
      };
    }

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
      convite: null,
    };
  }

  static async salvar(resposta: NovaRespostaPesquisa) {
    const conviteToken = resposta.conviteToken || resposta.token;

    const convite = await prisma.convitePesquisa.findUnique({
      where: { token: conviteToken },
      include: {
        pesquisa: true,
      },
    });

    if (convite) {
      return this.salvarPorConvite(resposta, convite);
    }

    return this.salvarPorTokenPublico(resposta);
  }

  private static async salvarPorConvite(
    resposta: NovaRespostaPesquisa,
    convite: any
  ) {
    const pesquisa = convite.pesquisa;

    if (!pesquisa) {
      throw new Error("Pesquisa não encontrada.");
    }

    if (pesquisa.id !== resposta.pesquisaId) {
      throw new Error("Token inválido para esta pesquisa.");
    }

    if (pesquisa.status !== "ABERTA") {
      throw new Error("Esta pesquisa não está mais recebendo respostas.");
    }

    if (convite.respondido) {
      throw new Error("Esta pesquisa já foi respondida por este link.");
    }

    const perguntas = normalizarPerguntas(pesquisa.perguntas);
    const respostasTratadas = this.validarRespostas(perguntas, resposta);

    return prisma.$transaction(async (tx) => {
      const conviteAtual = await tx.convitePesquisa.findUnique({
        where: { id: convite.id },
      });

      if (!conviteAtual) {
        throw new Error("Convite não encontrado.");
      }

      if (conviteAtual.respondido) {
        throw new Error("Esta pesquisa já foi respondida por este link.");
      }

      const respostaCriada = await tx.respostaPesquisa.create({
        data: {
          pesquisaId: pesquisa.id,
          conviteId: convite.id,

          nome: resposta.nome?.trim() || null,
          email: resposta.email?.trim() || null,
          setor: resposta.setor?.trim() || null,
          cargo: resposta.cargo?.trim() || null,

          respostas: respostasTratadas as unknown as Prisma.InputJsonValue,
        },
      });

      await tx.convitePesquisa.update({
        where: { id: convite.id },
        data: {
          respondido: true,
          respondidoEm: new Date(),
        },
      });

      return respostaCriada;
    });
  }

  private static async salvarPorTokenPublico(resposta: NovaRespostaPesquisa) {
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
    const respostasTratadas = this.validarRespostas(perguntas, resposta);

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

  private static validarRespostas(
    perguntas: PerguntaRespostaPesquisa[],
    resposta: NovaRespostaPesquisa
  ) {
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

    return respostasTratadas;
  }
}
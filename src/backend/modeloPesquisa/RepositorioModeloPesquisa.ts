import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "@/src/lib/prisma";
import {
  ModeloPesquisa,
  ModeloPesquisaComResumo,
  ModeloPesquisaDetalhado,
  PerguntaModelo,
} from "@/src/core/model/ModeloPesquisa";

function normalizarPerguntas(perguntas: unknown): PerguntaModelo[] {
  if (!Array.isArray(perguntas)) return [];

  return perguntas.map((pergunta, index) => {
    const item = pergunta as Partial<PerguntaModelo>;

    return {
      id: item.id || randomUUID(),
      titulo: item.titulo || "Nova pergunta",
      descricao: item.descricao || null,
      tipo: item.tipo || "NOTA",
      ordem: item.ordem || index + 1,
      obrigatoria: item.obrigatoria ?? true,
      opcoes: Array.isArray(item.opcoes) ? item.opcoes : [],
    };
  });
}

export default class RepositorioModeloPesquisa {
  static async salvar(modelo: ModeloPesquisa): Promise<ModeloPesquisaDetalhado> {
    const titulo = modelo.titulo?.trim();

    if (!titulo) {
      throw new Error("Título do modelo é obrigatório.");
    }

    const perguntas = normalizarPerguntas(modelo.perguntas);

    const dados = {
      titulo,
      descricao: modelo.descricao?.trim() || null,
      ativo: modelo.ativo ?? true,
      modeloPadrao: modelo.modeloPadrao ?? false,
      perguntas: perguntas as unknown as Prisma.InputJsonValue,
    };

    const resultado = modelo.id
      ? await prisma.modeloPesquisa.update({
          where: { id: modelo.id },
          data: dados,
        })
      : await prisma.modeloPesquisa.create({
          data: {
            ...dados,
            perguntas:
              perguntas.length > 0
                ? (perguntas as unknown as Prisma.InputJsonValue)
                : ([
                    {
                      id: randomUUID(),
                      titulo: "Nova pergunta",
                      descricao: null,
                      tipo: "NOTA",
                      ordem: 1,
                      obrigatoria: true,
                      opcoes: [],
                    },
                  ] as Prisma.InputJsonValue),
          },
        });

    return {
      ...resultado,
      perguntas: normalizarPerguntas(resultado.perguntas),
    };
  }

  static async obterTodos(): Promise<ModeloPesquisaComResumo[]> {
    const modelos = await prisma.modeloPesquisa.findMany({
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

    return modelos.map((modelo) => {
      const perguntas = normalizarPerguntas(modelo.perguntas);

      return {
        id: modelo.id,
        titulo: modelo.titulo,
        descricao: modelo.descricao,
        ativo: modelo.ativo,
        modeloPadrao: modelo.modeloPadrao,
        perguntas,
        criadoEm: modelo.criadoEm,
        atualizadoEm: modelo.atualizadoEm,
        totalPerguntas: perguntas.length,
        totalPesquisas: modelo._count.pesquisas,
      };
    });
  }

  static async excluir(id: string) {
    const modelo = await prisma.modeloPesquisa.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            pesquisas: true,
          },
        },
      },
    });

    if (!modelo) {
      throw new Error("Modelo de pesquisa não encontrado.");
    }

    if (modelo._count.pesquisas > 0) {
      throw new Error(
        "Não é possível excluir este modelo, pois ele já possui pesquisas vinculadas."
      );
    }

    await prisma.modeloPesquisa.delete({
      where: { id },
    });

    return id;
  }

  static async obterPorId(id: string): Promise<ModeloPesquisaDetalhado> {
    const modelo = await prisma.modeloPesquisa.findUnique({
      where: { id },
    });

    if (!modelo) {
      throw new Error("Modelo de pesquisa não encontrado.");
    }

    return {
      id: modelo.id,
      titulo: modelo.titulo,
      descricao: modelo.descricao,
      ativo: modelo.ativo,
      modeloPadrao: modelo.modeloPadrao,
      perguntas: normalizarPerguntas(modelo.perguntas),
      criadoEm: modelo.criadoEm,
      atualizadoEm: modelo.atualizadoEm,
    };
  }

  static async adicionarPergunta(modeloId: string) {
    const modelo = await this.obterPorId(modeloId);

    const novaPergunta: PerguntaModelo = {
      id: randomUUID(),
      titulo: "Nova pergunta",
      descricao: null,
      tipo: "NOTA",
      ordem: modelo.perguntas.length + 1,
      obrigatoria: true,
      opcoes: [],
    };

    const perguntas = [...modelo.perguntas, novaPergunta];

    await prisma.modeloPesquisa.update({
      where: { id: modeloId },
      data: {
        perguntas: perguntas as unknown as Prisma.InputJsonValue,
      },
    });

    return novaPergunta;
  }

  static async salvarPergunta(modeloId: string, pergunta: PerguntaModelo) {
    const modelo = await this.obterPorId(modeloId);

    const perguntas = modelo.perguntas.map((item) =>
      item.id === pergunta.id
        ? {
            ...item,
            titulo: pergunta.titulo.trim(),
            descricao: pergunta.descricao?.trim() || null,
            tipo: pergunta.tipo,
            obrigatoria: pergunta.obrigatoria ?? true,
            opcoes: Array.isArray(pergunta.opcoes) ? pergunta.opcoes : [],
          }
        : item
    );

    await prisma.modeloPesquisa.update({
      where: { id: modeloId },
      data: {
        perguntas: perguntas as unknown as Prisma.InputJsonValue,
      },
    });

    return pergunta;
  }

  static async excluirPergunta(modeloId: string, perguntaId: string) {
    const modelo = await this.obterPorId(modeloId);

    const perguntas = modelo.perguntas
      .filter((pergunta) => pergunta.id !== perguntaId)
      .map((pergunta, index) => ({
        ...pergunta,
        ordem: index + 1,
      }));

    await prisma.modeloPesquisa.update({
      where: { id: modeloId },
      data: {
        perguntas: perguntas as unknown as Prisma.InputJsonValue,
      },
    });

    return modeloId;
  }

  static async duplicar(id: string) {
    const modelo = await this.obterPorId(id);

    return this.salvar({
      titulo: `${modelo.titulo} - Cópia`,
      descricao: modelo.descricao,
      ativo: true,
      modeloPadrao: false,
      perguntas: modelo.perguntas.map((pergunta, index) => ({
        ...pergunta,
        id: randomUUID(),
        ordem: index + 1,
      })),
    });
  }
}
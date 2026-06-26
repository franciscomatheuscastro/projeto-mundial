import { randomUUID } from "crypto";
import { Prisma, StatusPesquisaCliente, TipoPergunta } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import {
  PerguntaPesquisaCliente,
  PesquisaCliente,
  RespostaPesquisaCliente,
  RespostaPesquisaItem,
} from "@/src/core/model/PesquisaCliente";

function normalizarPerguntas(perguntas: unknown): PerguntaPesquisaCliente[] {
  if (!Array.isArray(perguntas)) return [];

  return perguntas.map((pergunta, index) => {
    const item = pergunta as Partial<PerguntaPesquisaCliente>;

    return {
      id: item.id || randomUUID(),
      titulo: item.titulo || "Nova pergunta",
      descricao: item.descricao || null,
      tipo: item.tipo || TipoPergunta.NOTA,
      ordem: item.ordem || index + 1,
      obrigatoria: item.obrigatoria ?? true,
      opcoes: Array.isArray(item.opcoes) ? item.opcoes : [],
    };
  });
}

function normalizarRespostas(respostas: unknown): RespostaPesquisaItem[] {
  if (!Array.isArray(respostas)) return [];

  return respostas.map((resposta) => {
    const item = resposta as Partial<RespostaPesquisaItem>;

    return {
      id: item.id || randomUUID(),
      perguntaId: item.perguntaId || "",
      valor: item.valor || "",
    };
  });
}

export default class RepositorioPesquisaCliente {
  static async salvar(pesquisa: PesquisaCliente) {
    const titulo = pesquisa.titulo?.trim();

    if (!titulo) throw new Error("Título é obrigatório.");
    if (!pesquisa.clienteId) throw new Error("Cliente é obrigatório.");
    if (!pesquisa.modeloId) throw new Error("Modelo de pesquisa é obrigatório.");

    const cliente = await prisma.cliente.findUnique({
      where: { id: pesquisa.clienteId },
    });

    if (!cliente) throw new Error("Cliente não encontrado.");

    const modelo = await prisma.modeloPesquisa.findUnique({
      where: { id: pesquisa.modeloId },
    });

    if (!modelo) throw new Error("Modelo de pesquisa não encontrado.");

    const perguntasModelo = normalizarPerguntas(modelo.perguntas);

    if (perguntasModelo.length === 0) {
      throw new Error("O modelo selecionado não possui perguntas.");
    }

    const perguntas = normalizarPerguntas(
      pesquisa.perguntas && pesquisa.perguntas.length > 0
        ? pesquisa.perguntas
        : perguntasModelo
    );

    const dados = {
      titulo,
      descricao: pesquisa.descricao?.trim() || null,
      clienteId: pesquisa.clienteId,
      modeloId: pesquisa.modeloId,
      status: pesquisa.status ?? StatusPesquisaCliente.ABERTA,
      perguntas: perguntas as unknown as Prisma.InputJsonValue,
    };

    if (pesquisa.id) {
      const resultado = await prisma.pesquisaCliente.update({
        where: { id: pesquisa.id },
        data: dados,
        include: this.includeCompleto(),
      });

      return this.formatarDetalhada(resultado);
    }

    const resultado = await prisma.pesquisaCliente.create({
      data: {
        ...dados,
        token: pesquisa.token || randomUUID(),
      },
      include: this.includeCompleto(),
    });

    return this.formatarDetalhada(resultado);
  }

  static async obterTodos() {
    const pesquisas = await prisma.pesquisaCliente.findMany({
      orderBy: {
        criadoEm: "desc",
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
          },
        },
        modelo: {
          select: {
            id: true,
            titulo: true,
          },
        },
        _count: {
          select: {
            respostas: true,
          },
        },
      },
    });

    return pesquisas.map((pesquisa) => ({
      id: pesquisa.id,
      titulo: pesquisa.titulo,
      descricao: pesquisa.descricao,
      token: pesquisa.token,
      status: pesquisa.status,
      criadoEm: pesquisa.criadoEm,
      atualizadoEm: pesquisa.atualizadoEm,
      cliente: pesquisa.cliente,
      modelo: pesquisa.modelo,
      totalRespostas: pesquisa._count.respostas,
    }));
  }

  static async obterPorId(id: string) {
    const pesquisa = await prisma.pesquisaCliente.findUnique({
      where: { id },
      include: this.includeCompleto(),
    });

    if (!pesquisa) throw new Error("Pesquisa não encontrada.");

    return this.formatarDetalhada(pesquisa);
  }

  static async excluir(id: string) {
    const pesquisa = await prisma.pesquisaCliente.findUnique({
      where: { id },
    });

    if (!pesquisa) {
      throw new Error("Pesquisa não encontrada.");
    }

    await prisma.pesquisaCliente.delete({
      where: { id },
    });

    return id;
  }

  static async alterarStatus(id: string, status: StatusPesquisaCliente) {
    const pesquisa = await prisma.pesquisaCliente.update({
      where: { id },
      data: { status },
      include: this.includeCompleto(),
    });

    return this.formatarDetalhada(pesquisa);
  }

  static async obterDadosFormulario() {
    const [clientes, modelos] = await Promise.all([
      prisma.cliente.findMany({
        where: { ativo: true },
        orderBy: { nome: "asc" },
      }),

      prisma.modeloPesquisa.findMany({
        where: { ativo: true },
        orderBy: { titulo: "asc" },
      }),
    ]);

    return {
      clientes,
      modelos: modelos.map((modelo) => ({
        id: modelo.id,
        titulo: modelo.titulo,
        descricao: modelo.descricao,
        ativo: modelo.ativo,
        modeloPadrao: modelo.modeloPadrao,
        criadoEm: modelo.criadoEm,
        atualizadoEm: modelo.atualizadoEm,
        perguntas: normalizarPerguntas(modelo.perguntas),
      })),
    };
  }

  static async obterRelatorio(id: string) {
    const pesquisa = await this.obterPorId(id);
    const perguntas = pesquisa.perguntas;

    const perguntasComResumo = perguntas.map((pergunta) => {
      const respostasDaPergunta = pesquisa.respostas.flatMap(
        (respostaCliente: RespostaPesquisaCliente) =>
          respostaCliente.respostas.filter(
            (resposta: RespostaPesquisaItem) =>
              resposta.perguntaId === pergunta.id
          )
      );

      const valoresNumericos = respostasDaPergunta
        .map((resposta: RespostaPesquisaItem) => Number(resposta.valor))
        .filter((valor: number) => !Number.isNaN(valor));

      const media =
        valoresNumericos.length > 0
          ? valoresNumericos.reduce(
              (total: number, valor: number) => total + valor,
              0
            ) / valoresNumericos.length
          : 0;

      return {
        pergunta,
        totalRespostas: respostasDaPergunta.length,
        media,
        respostas: respostasDaPergunta,
      };
    });

    const mediasValidas = perguntasComResumo.filter(
      (item) => item.totalRespostas > 0 && item.media > 0
    );

    const mediaGeral =
      mediasValidas.length > 0
        ? mediasValidas.reduce(
            (total: number, item) => total + item.media,
            0
          ) / mediasValidas.length
        : 0;

    return {
      ...pesquisa,
      perguntasComResumo,
      mediaGeral,
    };
  }

  private static includeCompleto() {
    return {
      cliente: true,
      modelo: true,
      respostas: {
        orderBy: {
          criadoEm: "desc" as const,
        },
      },
    };
  }

  private static formatarDetalhada(pesquisa: any) {
    const perguntasPesquisa = normalizarPerguntas(pesquisa.perguntas);
    const perguntasModelo = normalizarPerguntas(pesquisa.modelo?.perguntas);

    return {
      id: pesquisa.id,
      clienteId: pesquisa.clienteId,
      modeloId: pesquisa.modeloId,
      titulo: pesquisa.titulo,
      descricao: pesquisa.descricao,
      token: pesquisa.token,
      status: pesquisa.status,
      perguntas: perguntasPesquisa,
      criadoEm: pesquisa.criadoEm,
      atualizadoEm: pesquisa.atualizadoEm,
      cliente: pesquisa.cliente,
      modelo: {
        id: pesquisa.modelo.id,
        titulo: pesquisa.modelo.titulo,
        perguntas:
          perguntasModelo.length > 0 ? perguntasModelo : perguntasPesquisa,
      },
      respostas: pesquisa.respostas.map((resposta: any) => ({
        id: resposta.id,
        pesquisaId: resposta.pesquisaId,
        nome: resposta.nome,
        email: resposta.email,
        setor: resposta.setor,
        cargo: resposta.cargo,
        respostas: normalizarRespostas(resposta.respostas),
        criadoEm: resposta.criadoEm,
      })),
      totalRespostas: pesquisa.respostas.length,
    };
  }
}
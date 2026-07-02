import { prisma } from "@/src/lib/prisma";
import {
  AcaoPlanoAcao,
  PlanoAcao,
  PlanoAcaoDetalhado,
  PlanoAcaoResumo,
} from "@/src/core/model/PlanoAcao";

function normalizarAcoes(acoes?: AcaoPlanoAcao[]) {
  return (acoes || []).map((acao, index) => ({
    id: acao.id || `acao-${Date.now()}-${index}`,
    titulo: acao.titulo?.trim() || "Nova ação",
    descricao: acao.descricao?.trim() || null,
    responsavel: acao.responsavel?.trim() || null,
    prioridade: acao.prioridade || "MEDIA",
    prazo: acao.prazo || null,
    status: acao.status || "PENDENTE",
  }));
}

function montarResumo(plano: any): PlanoAcaoResumo {
  const acoes = Array.isArray(plano.acoes) ? plano.acoes : [];

  return {
    id: plano.id,
    pesquisaId: plano.pesquisaId,
    titulo: plano.titulo,
    diagnostico: plano.diagnostico,
    objetivo: plano.objetivo,
    conclusao: plano.conclusao,
    status: plano.status,
    criadoEm: plano.criadoEm,
    atualizadoEm: plano.atualizadoEm,
    totalAcoes: acoes.length,
    pesquisa: {
      id: plano.pesquisa.id,
      titulo: plano.pesquisa.titulo,
      status: plano.pesquisa.status,
      cliente: {
        id: plano.pesquisa.cliente.id,
        nome: plano.pesquisa.cliente.nome,
        empresa: plano.pesquisa.cliente.empresa,
      },
    },
  };
}

function montarDetalhado(plano: any): PlanoAcaoDetalhado {
  return {
    ...montarResumo(plano),
    acoes: Array.isArray(plano.acoes) ? plano.acoes : [],
  };
}

export default class RepositorioPlanoAcao {
  static async salvar(plano: PlanoAcao): Promise<PlanoAcaoDetalhado> {
    const titulo = plano.titulo?.trim();

    if (!titulo) {
      throw new Error("Título do plano de ação é obrigatório.");
    }

    if (!plano.pesquisaId) {
      throw new Error("Pesquisa é obrigatória.");
    }

    const pesquisa = await prisma.pesquisaCliente.findUnique({
      where: { id: plano.pesquisaId },
    });

    if (!pesquisa) {
      throw new Error("Pesquisa não encontrada.");
    }

    const dados = {
      pesquisaId: plano.pesquisaId,
      titulo,
      diagnostico: plano.diagnostico?.trim() || null,
      objetivo: plano.objetivo?.trim() || null,
      conclusao: plano.conclusao?.trim() || null,
      status: plano.status || "RASCUNHO",
      acoes: normalizarAcoes(plano.acoes),
    };

    const resultado = plano.id
      ? await prisma.planoAcao.update({
          where: { id: plano.id },
          data: dados,
          include: {
            pesquisa: {
              include: {
                cliente: true,
              },
            },
          },
        })
      : await prisma.planoAcao.create({
          data: dados,
          include: {
            pesquisa: {
              include: {
                cliente: true,
              },
            },
          },
        });

    return montarDetalhado(resultado);
  }

  static async obterTodos(): Promise<PlanoAcaoResumo[]> {
    const planos = await prisma.planoAcao.findMany({
      orderBy: {
        criadoEm: "desc",
      },
      include: {
        pesquisa: {
          include: {
            cliente: true,
          },
        },
      },
    });

    return planos.map(montarResumo);
  }

  static async obterPorId(id: string): Promise<PlanoAcaoDetalhado> {
    const plano = await prisma.planoAcao.findUnique({
      where: { id },
      include: {
        pesquisa: {
          include: {
            cliente: true,
          },
        },
      },
    });

    if (!plano) {
      throw new Error("Plano de ação não encontrado.");
    }

    return montarDetalhado(plano);
  }

  static async obterPorPesquisa(pesquisaId: string): Promise<PlanoAcaoResumo[]> {
    const planos = await prisma.planoAcao.findMany({
      where: { pesquisaId },
      orderBy: {
        criadoEm: "desc",
      },
      include: {
        pesquisa: {
          include: {
            cliente: true,
          },
        },
      },
    });

    return planos.map(montarResumo);
  }

  static async excluir(id: string): Promise<string> {
    const plano = await prisma.planoAcao.findUnique({
      where: { id },
    });

    if (!plano) {
      throw new Error("Plano de ação não encontrado.");
    }

    await prisma.planoAcao.delete({
      where: { id },
    });

    return id;
  }
}
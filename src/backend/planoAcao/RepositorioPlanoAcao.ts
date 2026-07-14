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
    prazo: acao.prazo?.trim() || null,
    status: acao.status || "PENDENTE",
  }));
}

const includePlano = {
  pesquisa: {
    include: {
      cliente: true,
    },
  },
  denuncia: {
    include: {
      cliente: true,
    },
  },
} as const;

function montarResumo(plano: any): PlanoAcaoResumo {
  const acoes = Array.isArray(plano.acoes) ? plano.acoes : [];

  return {
    id: plano.id,

    tipoOrigem: plano.tipoOrigem,

    pesquisaId: plano.pesquisaId,
    denunciaId: plano.denunciaId,

    titulo: plano.titulo,
    diagnostico: plano.diagnostico,
    objetivo: plano.objetivo,
    conclusao: plano.conclusao,

    status: plano.status,

    criadoEm: plano.criadoEm,
    atualizadoEm: plano.atualizadoEm,

    totalAcoes: acoes.length,

    pesquisa: plano.pesquisa
      ? {
          id: plano.pesquisa.id,
          titulo: plano.pesquisa.titulo,
          status: plano.pesquisa.status,
          cliente: {
            id: plano.pesquisa.cliente.id,
            nome: plano.pesquisa.cliente.nome,
            empresa: plano.pesquisa.cliente.empresa,
          },
        }
      : null,

    denuncia: plano.denuncia
      ? {
          id: plano.denuncia.id,
          protocolo: plano.denuncia.protocolo,
          titulo: plano.denuncia.titulo,
          status: plano.denuncia.status,
          gravidade: plano.denuncia.gravidade,
          cliente: {
            id: plano.denuncia.cliente.id,
            nome: plano.denuncia.cliente.nome,
            empresa: plano.denuncia.cliente.empresa,
          },
        }
      : null,
  };
}

function montarDetalhado(plano: any): PlanoAcaoDetalhado {
  return {
    ...montarResumo(plano),
    acoes: Array.isArray(plano.acoes)
      ? (plano.acoes as AcaoPlanoAcao[])
      : [],
  };
}

function validarOrigem(plano: PlanoAcao) {
  if (plano.tipoOrigem === "PESQUISA_CLIMA") {
    if (!plano.pesquisaId) {
      throw new Error("Selecione a pesquisa de clima do plano.");
    }

    if (plano.denunciaId) {
      throw new Error(
        "Um plano de pesquisa não pode estar vinculado a uma denúncia."
      );
    }

    return;
  }

  if (plano.tipoOrigem === "DENUNCIA") {
    if (!plano.denunciaId) {
      throw new Error("Selecione a denúncia do plano.");
    }

    if (plano.pesquisaId) {
      throw new Error(
        "Um plano de denúncia não pode estar vinculado a uma pesquisa."
      );
    }

    return;
  }

  throw new Error("Tipo de origem do plano inválido.");
}

export default class RepositorioPlanoAcao {
  static async salvar(
    plano: PlanoAcao
  ): Promise<PlanoAcaoDetalhado> {
    const titulo = plano.titulo?.trim();

    if (!titulo) {
      throw new Error("Título do plano de ação é obrigatório.");
    }

    validarOrigem(plano);

    if (plano.tipoOrigem === "PESQUISA_CLIMA") {
      const pesquisa = await prisma.pesquisaCliente.findUnique({
        where: {
          id: plano.pesquisaId!,
        },
      });

      if (!pesquisa) {
        throw new Error("Pesquisa não encontrada.");
      }
    }

    if (plano.tipoOrigem === "DENUNCIA") {
      const denuncia = await prisma.denuncia.findUnique({
        where: {
          id: plano.denunciaId!,
        },
      });

      if (!denuncia) {
        throw new Error("Denúncia não encontrada.");
      }
    }

    if (plano.id) {
      const planoExistente = await prisma.planoAcao.findUnique({
        where: {
          id: plano.id,
        },
      });

      if (!planoExistente) {
        throw new Error("Plano de ação não encontrado.");
      }

      /*
       * Bloqueamos a troca da origem depois da criação.
       * Isso evita que um plano produzido para uma pesquisa seja
       * transferido acidentalmente para uma denúncia.
       */
      if (planoExistente.tipoOrigem !== plano.tipoOrigem) {
        throw new Error(
          "O tipo de origem do plano não pode ser alterado depois da criação."
        );
      }

      if (
        planoExistente.pesquisaId !== (plano.pesquisaId || null) ||
        planoExistente.denunciaId !== (plano.denunciaId || null)
      ) {
        throw new Error(
          "A origem vinculada ao plano não pode ser alterada depois da criação."
        );
      }
    }

    const dados = {
      tipoOrigem: plano.tipoOrigem,

      pesquisaId:
        plano.tipoOrigem === "PESQUISA_CLIMA"
          ? plano.pesquisaId
          : null,

      denunciaId:
        plano.tipoOrigem === "DENUNCIA"
          ? plano.denunciaId
          : null,

      titulo,
      diagnostico: plano.diagnostico?.trim() || null,
      objetivo: plano.objetivo?.trim() || null,
      conclusao: plano.conclusao?.trim() || null,
      status: plano.status || "RASCUNHO",
      acoes: normalizarAcoes(plano.acoes),
    };

    const resultado = plano.id
      ? await prisma.planoAcao.update({
          where: {
            id: plano.id,
          },
          data: dados,
          include: includePlano,
        })
      : await prisma.planoAcao.create({
          data: dados,
          include: includePlano,
        });

    return montarDetalhado(resultado);
  }

  static async obterTodos(): Promise<PlanoAcaoResumo[]> {
    const planos = await prisma.planoAcao.findMany({
      orderBy: {
        criadoEm: "desc",
      },
      include: includePlano,
    });

    return planos.map(montarResumo);
  }

  static async obterMeus(
    clienteId: string
  ): Promise<PlanoAcaoResumo[]> {
    const planos = await prisma.planoAcao.findMany({
      where: {
        OR: [
          {
            pesquisa: {
              clienteId,
            },
          },
          {
            denuncia: {
              clienteId,
            },
          },
        ],
      },
      orderBy: {
        criadoEm: "desc",
      },
      include: includePlano,
    });

    return planos.map(montarResumo);
  }

  static async obterPorId(
    id: string
  ): Promise<PlanoAcaoDetalhado> {
    const plano = await prisma.planoAcao.findUnique({
      where: {
        id,
      },
      include: includePlano,
    });

    if (!plano) {
      throw new Error("Plano de ação não encontrado.");
    }

    return montarDetalhado(plano);
  }

  static async obterPorIdECliente(
    id: string,
    clienteId: string
  ): Promise<PlanoAcaoDetalhado> {
    const plano = await prisma.planoAcao.findFirst({
      where: {
        id,
        OR: [
          {
            pesquisa: {
              clienteId,
            },
          },
          {
            denuncia: {
              clienteId,
            },
          },
        ],
      },
      include: includePlano,
    });

    if (!plano) {
      throw new Error("Plano de ação não encontrado.");
    }

    return montarDetalhado(plano);
  }

  static async obterPorPesquisa(
    pesquisaId: string
  ): Promise<PlanoAcaoResumo[]> {
    const planos = await prisma.planoAcao.findMany({
      where: {
        tipoOrigem: "PESQUISA_CLIMA",
        pesquisaId,
      },
      orderBy: {
        criadoEm: "desc",
      },
      include: includePlano,
    });

    return planos.map(montarResumo);
  }

  static async obterPorDenuncia(
    denunciaId: string
  ): Promise<PlanoAcaoResumo[]> {
    const planos = await prisma.planoAcao.findMany({
      where: {
        tipoOrigem: "DENUNCIA",
        denunciaId,
      },
      orderBy: {
        criadoEm: "desc",
      },
      include: includePlano,
    });

    return planos.map(montarResumo);
  }

  static async excluir(id: string): Promise<string> {
    const plano = await prisma.planoAcao.findUnique({
      where: {
        id,
      },
    });

    if (!plano) {
      throw new Error("Plano de ação não encontrado.");
    }

    await prisma.planoAcao.delete({
      where: {
        id,
      },
    });

    return id;
  }
}
import { prisma } from "@/src/lib/prisma";
import {
  Agendamento,
  AgendamentoDetalhado,
  AgendamentoResumo,
  ParticipanteAgendamento,
} from "@/src/core/model/Agendamento";

function normalizarParticipantes(participantes?: ParticipanteAgendamento[]) {
  return (participantes || []).map((participante, index) => ({
    id: participante.id || `participante-${Date.now()}-${index}`,
    nome: participante.nome?.trim() || "Participante",
    email: participante.email?.trim().toLowerCase() || null,
    telefone: participante.telefone?.trim() || null,
    tipo: participante.tipo || "OUTRO",
  }));
}

function montarAgendamento(agendamento: any): AgendamentoResumo {
  return {
    id: agendamento.id,
    planoAcaoId: agendamento.planoAcaoId,
    titulo: agendamento.titulo,
    descricao: agendamento.descricao,
    dataHora: agendamento.dataHora,
    duracaoMin: agendamento.duracaoMin,
    local: agendamento.local,
    linkReuniao: agendamento.linkReuniao,
    tipo: agendamento.tipo,
    status: agendamento.status,
    participantes: Array.isArray(agendamento.participantes)
      ? agendamento.participantes
      : [],
    criadoEm: agendamento.criadoEm,
    atualizadoEm: agendamento.atualizadoEm,
    planoAcao: agendamento.planoAcao
      ? {
          id: agendamento.planoAcao.id,
          titulo: agendamento.planoAcao.titulo,
          status: agendamento.planoAcao.status,
          pesquisa: {
            id: agendamento.planoAcao.pesquisa.id,
            titulo: agendamento.planoAcao.pesquisa.titulo,
            status: agendamento.planoAcao.pesquisa.status,
            cliente: {
              id: agendamento.planoAcao.pesquisa.cliente.id,
              nome: agendamento.planoAcao.pesquisa.cliente.nome,
              empresa: agendamento.planoAcao.pesquisa.cliente.empresa,
            },
          },
        }
      : null,
  };
}

export default class RepositorioAgendamento {
  static async salvar(
    agendamento: Agendamento
  ): Promise<AgendamentoDetalhado> {
    const titulo = agendamento.titulo?.trim();

    if (!titulo) throw new Error("Título do agendamento é obrigatório.");
    if (!agendamento.dataHora) {
      throw new Error("Data e hora do agendamento são obrigatórias.");
    }

    const dataHora = new Date(agendamento.dataHora);

    if (Number.isNaN(dataHora.getTime())) {
      throw new Error("Data e hora inválidas.");
    }

    if (agendamento.planoAcaoId) {
      const plano = await prisma.planoAcao.findUnique({
        where: { id: agendamento.planoAcaoId },
      });

      if (!plano) throw new Error("Plano de ação não encontrado.");
    }

    const dados = {
      planoAcaoId: agendamento.planoAcaoId || null,
      titulo,
      descricao: agendamento.descricao?.trim() || null,
      dataHora,
      duracaoMin: Number(agendamento.duracaoMin || 60),
      local: agendamento.local?.trim() || null,
      linkReuniao: agendamento.linkReuniao?.trim() || null,
      tipo: agendamento.tipo || "APRESENTACAO_PLANO",
      status: agendamento.status || "AGENDADO",
      participantes: normalizarParticipantes(agendamento.participantes),
    };

    const include = {
      planoAcao: {
        include: {
          pesquisa: {
            include: {
              cliente: true,
            },
          },
        },
      },
    };

    const resultado = agendamento.id
      ? await prisma.agendamento.update({
          where: { id: agendamento.id },
          data: dados,
          include,
        })
      : await prisma.agendamento.create({
          data: dados,
          include,
        });

    return montarAgendamento(resultado);
  }

  static async obterTodos(): Promise<AgendamentoResumo[]> {
    const agendamentos = await prisma.agendamento.findMany({
      orderBy: { dataHora: "asc" },
      include: {
        planoAcao: {
          include: {
            pesquisa: {
              include: {
                cliente: true,
              },
            },
          },
        },
      },
    });

    return agendamentos.map(montarAgendamento);
  }

  static async obterMeus(clienteId: string): Promise<AgendamentoResumo[]> {
    const agendamentos = await prisma.agendamento.findMany({
      where: {
        planoAcao: {
          pesquisa: {
            clienteId,
          },
        },
      },
      orderBy: { dataHora: "asc" },
      include: {
        planoAcao: {
          include: {
            pesquisa: {
              include: {
                cliente: true,
              },
            },
          },
        },
      },
    });

    return agendamentos.map(montarAgendamento);
  }

  static async obterPorId(id: string): Promise<AgendamentoDetalhado> {
    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
      include: {
        planoAcao: {
          include: {
            pesquisa: {
              include: {
                cliente: true,
              },
            },
          },
        },
      },
    });

    if (!agendamento) throw new Error("Agendamento não encontrado.");

    return montarAgendamento(agendamento);
  }

  static async obterPorIdECliente(
    id: string,
    clienteId: string
  ): Promise<AgendamentoDetalhado> {
    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id,
        planoAcao: {
          pesquisa: {
            clienteId,
          },
        },
      },
      include: {
        planoAcao: {
          include: {
            pesquisa: {
              include: {
                cliente: true,
              },
            },
          },
        },
      },
    });

    if (!agendamento) throw new Error("Agendamento não encontrado.");

    return montarAgendamento(agendamento);
  }

  static async excluir(id: string): Promise<string> {
    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
    });

    if (!agendamento) throw new Error("Agendamento não encontrado.");

    await prisma.agendamento.delete({
      where: { id },
    });

    return id;
  }
}
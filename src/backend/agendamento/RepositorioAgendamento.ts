import { Prisma } from "@prisma/client";
import { prisma } from "@/src/lib/prisma";
import {
  Agendamento,
  AgendamentoDetalhado,
  AgendamentoResumo,
  ParticipanteAgendamento,
} from "@/src/core/model/Agendamento";

const includeAgendamento = Prisma.validator<Prisma.AgendamentoInclude>()({
  planoAcao: {
    include: {
      pesquisa: { include: { cliente: true } },
      denuncia: { include: { cliente: true } },
    },
  },
});

type AgendamentoComRelacionamentos = Prisma.AgendamentoGetPayload<{
  include: typeof includeAgendamento;
}>;

function somenteDigitos(valor?: string | null) {
  return (valor || "").replace(/\D/g, "");
}

function normalizarTelefone(valor?: string | null): string | null {
  const digitos = somenteDigitos(valor);
  return digitos || null;
}

function normalizarParticipantes(
  participantes?: ParticipanteAgendamento[]
): ParticipanteAgendamento[] {
  return (participantes || [])
    .filter((participante) => participante.nome?.trim())
    .map((participante, index) => ({
      id: participante.id || `participante-${Date.now()}-${index}`,
      nome: participante.nome.trim(),
      email: participante.email?.trim().toLowerCase() || null,
      telefone: normalizarTelefone(participante.telefone),
      tipo: participante.tipo || "OUTRO",
      origem: participante.origem || "MANUAL",
      origemId: participante.origemId || null,
    }));
}

function converterDataHora(valor: Date | string): Date {
  if (valor instanceof Date) return valor;

  const texto = valor.trim();
  const possuiFuso = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(texto);
  const data = new Date(possuiFuso ? texto : `${texto}:00-03:00`);

  if (Number.isNaN(data.getTime())) {
    throw new Error("Data e hora inválidas.");
  }

  return data;
}

function participantesDoJson(valor: Prisma.JsonValue): ParticipanteAgendamento[] {
  return Array.isArray(valor) ? (valor as ParticipanteAgendamento[]) : [];
}

function montarAgendamento(
  agendamento: AgendamentoComRelacionamentos
): AgendamentoResumo {
  const plano = agendamento.planoAcao;

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
    participantes: participantesDoJson(agendamento.participantes),
    criadoEm: agendamento.criadoEm,
    atualizadoEm: agendamento.atualizadoEm,
    planoAcao: plano
      ? {
          id: plano.id,
          titulo: plano.titulo,
          status: plano.status,
          tipoOrigem: plano.tipoOrigem,
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
                status: plano.denuncia.status,
                cliente: {
                  id: plano.denuncia.cliente.id,
                  nome: plano.denuncia.cliente.nome,
                  empresa: plano.denuncia.cliente.empresa,
                },
              }
            : null,
        }
      : null,
  };
}

export default class RepositorioAgendamento {
  static async salvar(agendamento: Agendamento): Promise<AgendamentoDetalhado> {
    const titulo = agendamento.titulo?.trim();
    if (!titulo) throw new Error("Título do agendamento é obrigatório.");
    if (!agendamento.dataHora) {
      throw new Error("Data e hora do agendamento são obrigatórias.");
    }

    const dataHora = converterDataHora(agendamento.dataHora);
    const duracaoMin = Number(agendamento.duracaoMin || 60);

    if (!Number.isInteger(duracaoMin) || duracaoMin <= 0 || duracaoMin > 1440) {
      throw new Error("A duração deve ser informada em minutos e ser maior que zero.");
    }

    if (agendamento.planoAcaoId) {
      const plano = await prisma.planoAcao.findUnique({
        where: { id: agendamento.planoAcaoId },
        select: { id: true },
      });
      if (!plano) throw new Error("Plano de ação não encontrado.");
    }

    const participantes = normalizarParticipantes(agendamento.participantes);

    for (const participante of participantes) {
      const telefone = somenteDigitos(participante.telefone);
      if (telefone && ![10, 11].includes(telefone.length)) {
        throw new Error(`Telefone inválido para ${participante.nome}.`);
      }
    }

    const dados: Prisma.AgendamentoUncheckedCreateInput = {
      planoAcaoId: agendamento.planoAcaoId || null,
      titulo,
      descricao: agendamento.descricao?.trim() || null,
      dataHora,
      duracaoMin,
      local: agendamento.local?.trim() || null,
      linkReuniao: agendamento.linkReuniao?.trim() || null,
      tipo: agendamento.tipo || "APRESENTACAO_PLANO",
      status: agendamento.status || "AGENDADO",
      participantes: participantes as unknown as Prisma.InputJsonValue,
    };

    const resultado = agendamento.id
      ? await prisma.agendamento.update({
          where: { id: agendamento.id },
          data: dados,
          include: includeAgendamento,
        })
      : await prisma.agendamento.create({
          data: dados,
          include: includeAgendamento,
        });

    return montarAgendamento(resultado);
  }

  static async obterTodos(): Promise<AgendamentoResumo[]> {
    const registros = await prisma.agendamento.findMany({
      orderBy: { dataHora: "asc" },
      include: includeAgendamento,
    });
    return registros.map(montarAgendamento);
  }

  static async obterMeus(clienteId: string): Promise<AgendamentoResumo[]> {
    const registros = await prisma.agendamento.findMany({
      where: {
        planoAcao: {
          OR: [
            { pesquisa: { clienteId } },
            { denuncia: { clienteId } },
          ],
        },
      },
      orderBy: { dataHora: "asc" },
      include: includeAgendamento,
    });
    return registros.map(montarAgendamento);
  }

  static async obterPorId(id: string): Promise<AgendamentoDetalhado> {
    const registro = await prisma.agendamento.findUnique({
      where: { id },
      include: includeAgendamento,
    });
    if (!registro) throw new Error("Agendamento não encontrado.");
    return montarAgendamento(registro);
  }

  static async obterPorIdECliente(
    id: string,
    clienteId: string
  ): Promise<AgendamentoDetalhado> {
    const registro = await prisma.agendamento.findFirst({
      where: {
        id,
        planoAcao: {
          OR: [
            { pesquisa: { clienteId } },
            { denuncia: { clienteId } },
          ],
        },
      },
      include: includeAgendamento,
    });
    if (!registro) throw new Error("Agendamento não encontrado.");
    return montarAgendamento(registro);
  }

  static async excluir(id: string): Promise<string> {
    const registro = await prisma.agendamento.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!registro) throw new Error("Agendamento não encontrado.");
    await prisma.agendamento.delete({ where: { id } });
    return id;
  }
}

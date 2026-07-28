"use server";

import RepositorioAgendamento from "./RepositorioAgendamento";
import { Agendamento } from "@/src/core/model/Agendamento";
import { enviarEmailAgendamento } from "@/src/lib/email";

export default async function salvarAgendamento(agendamento: Agendamento) {
  const resultado = await RepositorioAgendamento.salvar(agendamento);

  const destinatarios = resultado.participantes.filter(
    (participante) => participante.email?.trim()
  );

  if (destinatarios.length === 0) return resultado;

  try {
    await enviarEmailAgendamento({
      titulo: resultado.titulo,
      descricao: resultado.descricao,
      dataHora: resultado.dataHora,
      duracaoMin: resultado.duracaoMin,
      local: resultado.local,
      linkReuniao: resultado.linkReuniao,
      status: resultado.status,
      participantes: destinatarios,
    });

    return resultado;
  } catch (error) {
    console.error("Agendamento salvo, mas o e-mail não foi enviado:", error);
    return {
      ...resultado,
      avisoEmail:
        "O agendamento foi salvo, mas não foi possível enviar um ou mais e-mails.",
    };
  }
}

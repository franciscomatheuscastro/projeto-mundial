"use server";

import { revalidatePath } from "next/cache";
import { Agendamento } from "@/src/core/model/Agendamento";
import RepositorioAgendamento from "./RepositorioAgendamento";

export default async function salvarAgendamento(agendamento: Agendamento) {
  const resultado = await RepositorioAgendamento.salvar(agendamento);

  revalidatePath("/agendamentos");
  revalidatePath(`/agendamentos/${resultado.id}`);
  revalidatePath("/planos-acao");
  revalidatePath("/dashboard");

  return resultado;
}
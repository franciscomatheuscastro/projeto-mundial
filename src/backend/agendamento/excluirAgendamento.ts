"use server";

import { revalidatePath } from "next/cache";
import RepositorioAgendamento from "./RepositorioAgendamento";

export default async function excluirAgendamento(id: string) {
  await RepositorioAgendamento.excluir(id);

  revalidatePath("/agendamentos");
  revalidatePath("/dashboard");

  return id;
}
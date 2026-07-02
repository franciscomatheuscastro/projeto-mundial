"use server";

import RepositorioAgendamento from "./RepositorioAgendamento";

export default async function obterPorId(id: string) {
  return RepositorioAgendamento.obterPorId(id);
}
"use server";

import RepositorioAgendamento from "./RepositorioAgendamento";

export default async function obterTodos() {
  return RepositorioAgendamento.obterTodos();
}
"use server";

import RepositorioCriticidadeDenuncia from "./RepositorioCriticidadeDenuncia";

export default async function obterTodosRegrasCriticidade() {
  return RepositorioCriticidadeDenuncia.obterTodos();
}
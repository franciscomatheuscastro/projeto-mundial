"use server";

import RepositorioCliente from "./RepositorioCliente";

export default async function obterTodos() {
  return RepositorioCliente.obterTodos();
}
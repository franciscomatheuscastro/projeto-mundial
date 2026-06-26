"use server";

import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";

export default async function obterTodosPesquisasCliente() {
  return RepositorioPesquisaCliente.obterTodos();
}
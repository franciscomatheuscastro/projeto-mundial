"use server";

import RepositorioModeloPesquisa from "./RepositorioModeloPesquisa";

export default async function obterTodos() {
  return RepositorioModeloPesquisa.obterTodos();
}
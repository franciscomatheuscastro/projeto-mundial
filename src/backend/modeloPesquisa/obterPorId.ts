"use server";

import RepositorioModeloPesquisa from "./RepositorioModeloPesquisa";

export default async function obterPorId(id: string) {
  return RepositorioModeloPesquisa.obterPorId(id);
}
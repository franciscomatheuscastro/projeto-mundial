"use server";

import RepositorioRespostaPesquisa from "./RepositorioRespostaPesquisa";

export default async function obterPesquisaPublicaPorToken(token: string) {
  return RepositorioRespostaPesquisa.obterPorToken(token);
}
"use server";

import RepositorioPlanoAcao from "./RepositorioPlanoAcao";

export default async function obterPorPesquisa(pesquisaId: string) {
  return RepositorioPlanoAcao.obterPorPesquisa(pesquisaId);
}
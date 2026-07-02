"use server";

import RepositorioPlanoAcao from "./RepositorioPlanoAcao";

export default async function obterTodos() {
  return RepositorioPlanoAcao.obterTodos();
}
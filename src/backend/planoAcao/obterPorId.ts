"use server";

import RepositorioPlanoAcao from "./RepositorioPlanoAcao";

export default async function obterPorId(id: string) {
  return RepositorioPlanoAcao.obterPorId(id);
}
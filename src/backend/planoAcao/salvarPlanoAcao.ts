"use server";

import { revalidatePath } from "next/cache";
import { PlanoAcao } from "@/src/core/model/PlanoAcao";
import RepositorioPlanoAcao from "./RepositorioPlanoAcao";

export default async function salvarPlanoAcao(plano: PlanoAcao) {
  const resultado = await RepositorioPlanoAcao.salvar(plano);

  revalidatePath("/planos-acao");
  revalidatePath(`/planos-acao/${resultado.id}`);
  revalidatePath(`/pesquisas/${resultado.pesquisaId}`);
  revalidatePath("/dashboard");

  return resultado;
}
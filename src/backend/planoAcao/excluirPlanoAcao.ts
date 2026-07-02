"use server";

import { revalidatePath } from "next/cache";
import RepositorioPlanoAcao from "./RepositorioPlanoAcao";

export default async function excluirPlanoAcao(id: string) {
  const plano = await RepositorioPlanoAcao.obterPorId(id);

  await RepositorioPlanoAcao.excluir(id);

  revalidatePath("/planos-acao");
  revalidatePath(`/pesquisas/${plano.pesquisaId}`);
  revalidatePath("/dashboard");

  return id;
}
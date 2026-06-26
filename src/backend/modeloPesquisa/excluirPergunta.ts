"use server";

import { revalidatePath } from "next/cache";
import RepositorioModeloPesquisa from "./RepositorioModeloPesquisa";

export default async function excluirPergunta(
  modeloId: string,
  perguntaId: string
) {
  await RepositorioModeloPesquisa.excluirPergunta(modeloId, perguntaId);

  revalidatePath(`/modelos-pesquisa/${modeloId}`);

  return modeloId;
}
"use server";

import { revalidatePath } from "next/cache";
import RepositorioModeloPesquisa from "./RepositorioModeloPesquisa";

export default async function adicionarPergunta(modeloId: string) {
  const pergunta = await RepositorioModeloPesquisa.adicionarPergunta(modeloId);

  revalidatePath(`/modelos-pesquisa/${modeloId}`);

  return pergunta;
}
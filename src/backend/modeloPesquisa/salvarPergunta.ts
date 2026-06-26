"use server";

import { revalidatePath } from "next/cache";
import { PerguntaModelo } from "@/src/core/model/ModeloPesquisa";
import RepositorioModeloPesquisa from "./RepositorioModeloPesquisa";

export default async function salvarPergunta(
  modeloId: string,
  pergunta: PerguntaModelo
) {
  const resultado = await RepositorioModeloPesquisa.salvarPergunta(
    modeloId,
    pergunta
  );

  revalidatePath(`/modelos-pesquisa/${modeloId}`);

  return resultado;
}
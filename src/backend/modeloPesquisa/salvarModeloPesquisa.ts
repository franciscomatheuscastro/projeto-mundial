"use server";

import { revalidatePath } from "next/cache";
import { ModeloPesquisa } from "@/src/core/model/ModeloPesquisa";
import RepositorioModeloPesquisa from "./RepositorioModeloPesquisa";

export default async function salvarModeloPesquisa(modelo: ModeloPesquisa) {
  const resultado = await RepositorioModeloPesquisa.salvar(modelo);

  revalidatePath("/modelos-pesquisa");
  revalidatePath(`/modelos-pesquisa/${resultado.id}`);
  revalidatePath("/dashboard");

  return resultado;
}
"use server";

import { revalidatePath } from "next/cache";
import RepositorioModeloPesquisa from "./RepositorioModeloPesquisa";

export default async function duplicarModeloPesquisa(id: string) {
  const novoModelo = await RepositorioModeloPesquisa.duplicar(id);

  revalidatePath("/modelos-pesquisa");
  revalidatePath(`/modelos-pesquisa/${novoModelo.id}`);

  return novoModelo;
}
"use server";

import { revalidatePath } from "next/cache";
import RepositorioModeloPesquisa from "./RepositorioModeloPesquisa";

export default async function excluirModeloPesquisa(id: string) {
  await RepositorioModeloPesquisa.excluir(id);

  revalidatePath("/modelos-pesquisa");
  revalidatePath("/dashboard");

  return id;
}
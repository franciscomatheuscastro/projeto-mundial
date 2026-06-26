"use server";

import { revalidatePath } from "next/cache";
import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";

export default async function excluirPesquisaCliente(id: string) {
  await RepositorioPesquisaCliente.excluir(id);

  revalidatePath("/pesquisas");
  revalidatePath("/dashboard");

  return id;
}
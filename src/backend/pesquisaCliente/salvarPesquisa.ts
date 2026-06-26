"use server";

import { revalidatePath } from "next/cache";
import { PesquisaCliente } from "@/src/core/model/PesquisaCliente";
import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";

export default async function salvarPesquisa(pesquisa: PesquisaCliente) {
  const resultado = await RepositorioPesquisaCliente.salvar(pesquisa);

  revalidatePath("/pesquisas");
  revalidatePath("/dashboard");

  return resultado;
}
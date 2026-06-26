"use server";

import { revalidatePath } from "next/cache";
import { StatusPesquisaCliente } from "@prisma/client";
import RepositorioPesquisaCliente from "./RepositorioPesquisaCliente";

export default async function alterarStatusPesquisaCliente(
  id: string,
  status: StatusPesquisaCliente
) {
  const resultado = await RepositorioPesquisaCliente.alterarStatus(id, status);

  revalidatePath("/pesquisas");
  revalidatePath(`/pesquisas/${id}`);
  revalidatePath("/dashboard");

  return resultado;
}
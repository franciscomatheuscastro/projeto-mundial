"use server";

import { revalidatePath } from "next/cache";
import { Cliente } from "@/src/core/model/Cliente";
import RepositorioCliente from "./RepositorioCliente";

export default async function salvarCliente(cliente: Cliente) {
  const resultado = await RepositorioCliente.salvar(cliente);

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${resultado.id}`);
  revalidatePath("/dashboard");

  return resultado;
}
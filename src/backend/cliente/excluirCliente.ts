"use server";

import { revalidatePath } from "next/cache";
import RepositorioCliente from "./RepositorioCliente";

export default async function excluirCliente(id: string) {
  await RepositorioCliente.excluir(id);

  revalidatePath("/clientes");
  revalidatePath("/dashboard");

  return id;
}
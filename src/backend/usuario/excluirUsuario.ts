"use server";

import { revalidatePath } from "next/cache";
import RepositorioUsuario from "./RepositorioUsuario";

export default async function excluirUsuario(id: string) {
  await RepositorioUsuario.excluir(id);

  revalidatePath("/usuarios");
  revalidatePath("/dashboard");
}
"use server";

import { revalidatePath } from "next/cache";
import { Usuario } from "@/src/core/model/Usuario";
import RepositorioUsuario from "./RepositorioUsuario";

export default async function salvarUsuario(usuario: Usuario) {
  const resultado = await RepositorioUsuario.salvar(usuario);

  revalidatePath("/usuarios");
  revalidatePath("/dashboard");

  return resultado;
}
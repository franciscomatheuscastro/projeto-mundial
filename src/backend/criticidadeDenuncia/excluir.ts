"use server";

import { revalidatePath } from "next/cache";
import RepositorioCriticidadeDenuncia from "./RepositorioCriticidadeDenuncia";

export default async function excluirRegraCriticidade(id: string) {
  const resultado = await RepositorioCriticidadeDenuncia.excluir(id);

  revalidatePath("/denuncias/criticidade");
  revalidatePath("/dashboard");

  return resultado;
}
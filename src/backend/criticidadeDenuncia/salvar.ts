"use server";

import { revalidatePath } from "next/cache";
import { RegraCriticidadeDenuncia } from "@/src/core/model/RegraCriticidadeDenuncia";
import RepositorioCriticidadeDenuncia from "./RepositorioCriticidadeDenuncia";

export default async function salvarRegraCriticidade(
  regra: RegraCriticidadeDenuncia
) {
  const resultado = await RepositorioCriticidadeDenuncia.salvar(regra);

  revalidatePath("/denuncias/criticidade");
  revalidatePath("/dashboard");

  return resultado;
}
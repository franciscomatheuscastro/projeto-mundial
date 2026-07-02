"use server";

import { revalidatePath } from "next/cache";
import { DenunciaPublica } from "@/src/core/model/Denuncia";
import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function criarDenunciaPublica(dados: DenunciaPublica) {
  const resultado = await RepositorioDenuncia.criarPublica(dados);

  revalidatePath("/denuncias");
  revalidatePath("/dashboard");

  return resultado;
}
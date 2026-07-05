"use server";

import { revalidatePath } from "next/cache";
import { Denuncia } from "@/src/core/model/Denuncia";
import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function criarDenunciaManual(denuncia: Denuncia) {
  const resultado = await RepositorioDenuncia.criarManual(denuncia);

  revalidatePath("/denuncias");
  revalidatePath("/dashboard");

  return resultado;
}
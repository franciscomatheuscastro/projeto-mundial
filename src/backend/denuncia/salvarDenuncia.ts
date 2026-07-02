"use server";

import { revalidatePath } from "next/cache";
import { Denuncia } from "@/src/core/model/Denuncia";
import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function salvarDenuncia(denuncia: Denuncia) {
  const resultado = await RepositorioDenuncia.salvar(denuncia);

  revalidatePath("/denuncias");
  revalidatePath(`/denuncias/${resultado.id}`);
  revalidatePath("/dashboard");

  return resultado;
}
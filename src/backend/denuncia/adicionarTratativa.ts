"use server";

import { revalidatePath } from "next/cache";
import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function adicionarTratativa(
  denunciaId: string,
  tratativa: {
    titulo: string;
    descricao: string;
    responsavel?: string | null;
  }
) {
  const resultado = await RepositorioDenuncia.adicionarTratativa(
    denunciaId,
    tratativa
  );

  revalidatePath("/denuncias");
  revalidatePath(`/denuncias/${resultado.id}`);

  return resultado;
}
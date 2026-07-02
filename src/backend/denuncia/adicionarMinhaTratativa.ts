"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/src/auth";
import RepositorioDenuncia from "./RepositorioDenuncia";

type NovaTratativa = {
  titulo: string;
  descricao: string;
  responsavel?: string | null;
};

export default async function adicionarMinhaTratativa(
  denunciaId: string,
  tratativa: NovaTratativa
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Usuário não autenticado.");
  }

  if ((session.user as any).perfil !== "CLIENTE") {
    throw new Error("Acesso não autorizado.");
  }

  const clienteId = (session.user as any).clienteId;

  if (!clienteId) {
    throw new Error("Usuário sem cliente vinculado.");
  }

  await RepositorioDenuncia.obterPorIdECliente(denunciaId, clienteId);

  const resultado = await RepositorioDenuncia.adicionarTratativa(
    denunciaId,
    tratativa
  );

  revalidatePath("/cliente/denuncias");
  revalidatePath(`/cliente/denuncias/${denunciaId}`);

  return resultado;
}
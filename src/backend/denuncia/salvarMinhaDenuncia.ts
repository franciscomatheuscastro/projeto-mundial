"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/src/auth";
import { Denuncia } from "@/src/core/model/Denuncia";
import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function salvarMinhaDenuncia(denuncia: Denuncia) {
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

  const denunciaBanco = await RepositorioDenuncia.obterPorIdECliente(
    denuncia.id!,
    clienteId
  );

  const resultado = await RepositorioDenuncia.salvar({
    ...denuncia,
    clienteId: denunciaBanco.clienteId,
  });

  revalidatePath("/cliente/denuncias");
  revalidatePath(`/cliente/denuncias/${denuncia.id}`);

  return resultado;
}
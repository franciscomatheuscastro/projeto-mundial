"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/src/auth";
import { Denuncia } from "@/src/core/model/Denuncia";
import RepositorioDenuncia from "./RepositorioDenuncia";

export default async function criarMinhaDenunciaManual(denuncia: Denuncia) {
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

  const resultado = await RepositorioDenuncia.criarManualCliente(
    clienteId,
    denuncia
  );

  revalidatePath("/minhas-denuncias");
  revalidatePath("/painel-controle");

  return resultado;
}
import { auth } from "@/src/auth";

import { PerfilUsuario } from "@prisma/client";

import { redirect } from "next/navigation";

export default async function MinhaNovaDenunciaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as {
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  const podeAcessarPainelCliente =
    usuario.perfil === PerfilUsuario.CLIENTE ||
    usuario.perfil ===
      PerfilUsuario.COMITE_CLIENTE;

  if (
    !podeAcessarPainelCliente ||
    !usuario.clienteId
  ) {
    redirect("/dashboard");
  }

  redirect("/minhas-denuncias");
}
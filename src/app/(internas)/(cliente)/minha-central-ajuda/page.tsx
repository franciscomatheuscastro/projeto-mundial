import {
  PerfilUsuario,
} from "@prisma/client";

import { auth } from "@/src/auth";

import { redirect } from "next/navigation";

import CentralAjudaTela from "@/src/app/components/ajuda/CentralAjudaTela";

export default async function CentralAjudaClientePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as {
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  if (!usuario.clienteId) {
    redirect("/painel-controle");
  }

  if (
    usuario.perfil ===
    PerfilUsuario.CLIENTE
  ) {
    return (
      <CentralAjudaTela perfil="CLIENTE" />
    );
  }

  if (
    usuario.perfil ===
    PerfilUsuario.COMITE_CLIENTE
  ) {
    return (
      <CentralAjudaTela perfil="COMITE" />
    );
  }

  redirect("/painel-controle");
}
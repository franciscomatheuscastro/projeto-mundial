import {
  PerfilUsuario,
} from "@prisma/client";

import { redirect } from "next/navigation";

import { auth } from "@/src/auth";

import MinhaContaTela from "@/src/app/components/clientes/MinhaContaTela";

type UsuarioSessao = {
  perfil?: PerfilUsuario;
  clienteId?: string | null;
};

export default async function MinhaContaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario =
    session.user as UsuarioSessao;

  if (
    usuario.perfil !==
      PerfilUsuario.CLIENTE ||
    !usuario.clienteId
  ) {
    redirect("/painel-controle");
  }

  return <MinhaContaTela />;
}
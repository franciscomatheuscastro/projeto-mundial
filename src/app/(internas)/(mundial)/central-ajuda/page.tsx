import { auth } from "@/src/auth";

import { redirect } from "next/navigation";

import CentralAjudaTela from "@/src/app/components/ajuda/CentralAjudaTela";

const PERFIS_MUNDIAL = [
  "ADMIN",
  "GESTOR",
  "PSICOLOGO",
  "ASSISTENTE_SOCIAL",
];

export default async function CentralAjudaMundialPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as {
    perfil?: string;
  };

  if (
    !usuario.perfil ||
    !PERFIS_MUNDIAL.includes(
      usuario.perfil
    )
  ) {
    redirect("/painel-controle");
  }

  return (
    <CentralAjudaTela perfil="MUNDIAL" />
  );
}
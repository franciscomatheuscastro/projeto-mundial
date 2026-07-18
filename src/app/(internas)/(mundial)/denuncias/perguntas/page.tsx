import { auth } from "@/src/auth";

import { redirect } from "next/navigation";

import PerguntasCanalDenunciaTela from "@/src/app/components/denuncias/PerguntasCanalDenunciaTela";

const PERFIS_PERMITIDOS = [
  "ADMIN",
  "GESTOR",
  "PSICOLOGO",
  "ASSISTENTE_SOCIAL",
];

export default async function PerguntasCanalPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as {
    perfil?: string;
  };

  if (
    !usuario.perfil ||
    !PERFIS_PERMITIDOS.includes(
      usuario.perfil
    )
  ) {
    redirect("/painel-controle");
  }

  return <PerguntasCanalDenunciaTela />;
}
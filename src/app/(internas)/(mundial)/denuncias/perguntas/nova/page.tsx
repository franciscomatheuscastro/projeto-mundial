import { auth } from "@/src/auth";

import { redirect } from "next/navigation";

import PerguntaCanalDenunciaFormulario from "@/src/app/components/denuncias/PerguntaCanalDenunciaFormulario";

const PERFIS_PERMITIDOS = [
  "ADMIN",
  "GESTOR",
  "PSICOLOGO",
  "ASSISTENTE_SOCIAL",
];

export default async function NovaPerguntaCanalPage() {
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

  return (
    <PerguntaCanalDenunciaFormulario />
  );
}
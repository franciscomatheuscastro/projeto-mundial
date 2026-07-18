import { auth } from "@/src/auth";
import { redirect } from "next/navigation";

import DenunciasTela from "@/src/app/components/denuncias/DenunciasTela";

export default async function DenunciasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as any;

  const perfisPermitidos = [
    "ADMIN",
    "GESTOR",
    "PSICOLOGO",
    "ASSISTENTE_SOCIAL",
  ];

  if (!perfisPermitidos.includes(usuario.perfil)) {
    redirect("/painel-controle");
  }

  return (
    <DenunciasTela
      contexto="mundial"
      podeCriar
    />
  );
}
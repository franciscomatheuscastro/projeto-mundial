import { auth } from "@/src/auth";
import { redirect } from "next/navigation";

import CategoriasDenunciaTela from "@/src/app/components/denuncias/CategoriasDenunciasTela";

export default async function CategoriasDenunciaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const perfil = (session.user as any)
    .perfil;

  if (
    perfil !== "ADMIN" &&
    perfil !== "GESTOR"
  ) {
    redirect("/");
  }

  return <CategoriasDenunciaTela />;
}
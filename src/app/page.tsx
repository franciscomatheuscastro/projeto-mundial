import { auth } from "@/src/auth";
import { PerfilUsuario } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const perfil = (session.user as {
    perfil?: PerfilUsuario;
  }).perfil;

  if (
    perfil === PerfilUsuario.CLIENTE ||
    perfil === PerfilUsuario.COMITE_CLIENTE
  ) {
    redirect("/painel-controle");
  }

  redirect("/dashboard");
}
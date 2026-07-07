import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import CriticidadeDenunciaTela from "@/src/app/components/denuncias/CriticidadeDenunciaTela";

export default async function CriticidadeDenunciaPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil === "CLIENTE") redirect("/painel-controle");

  return <CriticidadeDenunciaTela />;
}
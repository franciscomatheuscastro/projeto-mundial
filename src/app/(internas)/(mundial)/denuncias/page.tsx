import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import DenunciasTela from "@/src/app/components/denuncias/DenunciasTela";

export default async function DenunciasPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil === "CLIENTE") redirect("/painel-controle");

  return <DenunciasTela contexto="mundial" />;
}
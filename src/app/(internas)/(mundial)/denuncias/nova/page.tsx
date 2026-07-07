import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import DenunciaFormularioTela from "@/src/app/components/denuncias/DenunciaFormularioTela";

export default async function NovaDenunciaPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil === "CLIENTE") redirect("/painel-controle");

  return <DenunciaFormularioTela contexto="mundial" />;
}
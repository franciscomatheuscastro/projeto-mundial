import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import PlanosAcaoTela from "@/src/app/components/planos-acao/PlanosAcaoTela";

export default async function PlanosAcaoPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil === "CLIENTE") redirect("/painel-controle");

  return <PlanosAcaoTela contexto="mundial" />;
}
// pesquisas/nova/page.tsx
import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import PesquisasTela from "@/src/app/components/pesquisas/PesquisasTela";

export default async function NovaPesquisaPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil === "CLIENTE") redirect("/painel-controle");

  return <PesquisasTela modo="nova" contexto="mundial" />;
}
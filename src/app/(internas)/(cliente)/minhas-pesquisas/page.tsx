// minhas-pesquisas/page.tsx
import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import PesquisasTela from "@/src/app/components/pesquisas/PesquisasTela";

export default async function MinhasPesquisasPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil !== "CLIENTE") redirect("/dashboard");
  if (!(session.user as any).clienteId) redirect("/login");

  return <PesquisasTela modo="lista" contexto="cliente" />;
}
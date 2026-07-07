// minhas-pesquisas/[id]/relatorio/page.tsx
import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import PesquisasTela from "@/src/app/components/pesquisas/PesquisasTela";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MinhaPesquisaRelatorioPage({
  params,
}: PageProps) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil !== "CLIENTE") redirect("/dashboard");
  if (!(session.user as any).clienteId) redirect("/login");

  const { id } = await params;

  return <PesquisasTela modo="relatorio" pesquisaId={id} contexto="cliente" />;
}
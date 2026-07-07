// pesquisas/[id]/page.tsx
import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import PesquisasTela from "@/src/app/components/pesquisas/PesquisasTela";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PesquisaDetalhePage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil === "CLIENTE") redirect("/painel-controle");

  const { id } = await params;

  return <PesquisasTela modo="detalhe" pesquisaId={id} contexto="mundial" />;
}
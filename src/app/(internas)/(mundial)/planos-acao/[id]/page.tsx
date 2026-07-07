import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import PlanoAcaoDetalheTela from "@/src/app/components/planos-acao/PlanoAcaoDetalheTela";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PlanoAcaoDetalhePage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil === "CLIENTE") redirect("/painel-controle");

  const { id } = await params;

  return <PlanoAcaoDetalheTela id={id} contexto="mundial" />;
}
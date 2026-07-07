import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import PlanoAcaoRelatorioTela from "@/src/app/components/planos-acao/PlanoAcaoRelatorioTela";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MeuPlanoAcaoRelatorioPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil !== "CLIENTE") redirect("/planos-acao");

  const { id } = await params;

  return <PlanoAcaoRelatorioTela id={id} contexto="cliente" />;
}
import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import AgendamentoDetalheTela from "@/src/app/components/agendamentos/AgendamentoDetalheTela";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MeuAgendamentoDetalhePage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil !== "CLIENTE") redirect("/agendamentos");

  const { id } = await params;

  return <AgendamentoDetalheTela id={id} contexto="cliente" />;
}
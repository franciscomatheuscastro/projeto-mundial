import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import AgendamentosTela from "@/src/app/components/agendamentos/AgendamentosTela";

export default async function AgendamentosPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil === "CLIENTE") redirect("/painel-controle");

  return <AgendamentosTela contexto="mundial" />;
}
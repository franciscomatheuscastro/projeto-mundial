import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import AgendamentoFormularioTela from "@/src/app/components/agendamentos/AgendamentoFormularioTela";

export default async function NovoAgendamentoPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil === "CLIENTE") redirect("/painel-controle");

  return <AgendamentoFormularioTela contexto="mundial" />;
}
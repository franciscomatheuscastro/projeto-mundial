import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import AgendamentoFormularioTela from "@/src/app/components/agendamentos/AgendamentoFormularioTela";

export default async function NovoAgendamentoPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const perfil = (session.user as { perfil?: string }).perfil;

  if (perfil === "CLIENTE" || perfil === "COMITE_CLIENTE") {
    redirect("/painel-controle");
  }

  return <AgendamentoFormularioTela contexto="mundial" />;
}
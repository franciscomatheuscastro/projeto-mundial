import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import AgendamentosTela from "@/src/app/components/agendamentos/AgendamentosTela";

export default async function AgendamentosPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const perfil = (session.user as { perfil?: string }).perfil;

  if (perfil === "CLIENTE" || perfil === "COMITE_CLIENTE") {
    redirect("/painel-controle");
  }

  return <AgendamentosTela contexto="mundial" />;
}
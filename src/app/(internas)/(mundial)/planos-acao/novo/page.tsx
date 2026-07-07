import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import PlanoAcaoFormularioTela from "@/src/app/components/planos-acao/PlanoAcaoFormularioTela";

export default async function NovoPlanoAcaoPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil === "CLIENTE") redirect("/painel-controle");

  return <PlanoAcaoFormularioTela contexto="mundial" />;
}
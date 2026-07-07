import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import ModelosPesquisaTela from "@/src/app/components/modelos-pesquisa/ModelosPesquisaTela";

export default async function NovoModeloPesquisaPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  if ((session.user as any).perfil === "CLIENTE") {
    redirect("/painel-controle");
  }

  return <ModelosPesquisaTela modo="novo" />;
}
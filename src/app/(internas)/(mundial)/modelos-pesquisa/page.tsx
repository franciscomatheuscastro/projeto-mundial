import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import ModelosPesquisaTela from "@/src/app/components/modelos-pesquisa/ModelosPesquisaTela";

export default async function ModelosPesquisaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <ModelosPesquisaTela modo="lista" />;
}
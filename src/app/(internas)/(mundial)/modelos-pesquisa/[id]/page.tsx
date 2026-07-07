import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import ModelosPesquisaTela from "@/src/app/components/modelos-pesquisa/ModelosPesquisaTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarModeloPesquisaPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) redirect("/login");

  if ((session.user as any).perfil === "CLIENTE") {
    redirect("/painel-controle");
  }

  const { id } = await params;

  return <ModelosPesquisaTela modo="editar" modeloId={id} />;
}
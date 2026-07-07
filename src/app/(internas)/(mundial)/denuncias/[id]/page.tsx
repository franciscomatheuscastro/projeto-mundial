import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import DenunciaDetalheTela from "@/src/app/components/denuncias/DenunciaDetalheTela";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DenunciaDetalhePage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil === "CLIENTE") redirect("/painel-controle");

  const { id } = await params;

  return <DenunciaDetalheTela id={id} contexto="mundial" />;
}
import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import ClientesTela from "@/src/app/components/clientes/ClientesTela";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarClientePage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  return <ClientesTela modo="editar" clienteId={id} />;
}
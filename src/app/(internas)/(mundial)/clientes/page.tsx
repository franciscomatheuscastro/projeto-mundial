import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import ClientesTela from "@/src/app/components/clientes/ClientesTela";

export default async function ClientesPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  if ((session.user as any).perfil === "CLIENTE") {
    redirect("/painel-controle");
  }

  return <ClientesTela modo="lista" />;
}
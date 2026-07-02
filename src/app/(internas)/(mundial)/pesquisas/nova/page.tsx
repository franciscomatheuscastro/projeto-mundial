import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import PesquisasTela from "@/src/app/components/pesquisas/PesquisasTela";

export default async function NovaPesquisaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <PesquisasTela modo="nova" />;
}
import { auth } from "@/src/auth";
import { redirect } from "next/navigation";
import DenunciaFormularioTela from "@/src/app/components/denuncias/DenunciaFormularioTela";

export default async function MinhaNovaDenunciaPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");
  if ((session.user as any).perfil !== "CLIENTE") redirect("/denuncias");

  return <DenunciaFormularioTela contexto="cliente" />;
}
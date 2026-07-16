import { redirect } from "next/navigation";
import { PerfilUsuario } from "@prisma/client";
import { auth } from "@/src/auth";
import MeusColaboradoresTela from "@/src/app/components/colaboradores/MeusColaboradoresTela";

export default async function MeusColaboradoresPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as {
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  if (
    usuario.perfil !== PerfilUsuario.CLIENTE ||
    !usuario.clienteId
  ) {
    redirect("/painel-controle");
  }

  return <MeusColaboradoresTela />;
}
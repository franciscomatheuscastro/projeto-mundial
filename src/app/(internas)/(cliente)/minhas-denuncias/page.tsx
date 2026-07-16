import { auth } from "@/src/auth";
import { PerfilUsuario } from "@prisma/client";
import { redirect } from "next/navigation";
import DenunciasTela from "@/src/app/components/denuncias/DenunciasTela";

export default async function ClienteDenunciasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as {
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  const podeAcessar =
    usuario.perfil === PerfilUsuario.CLIENTE ||
    usuario.perfil === PerfilUsuario.COMITE_CLIENTE;

  if (!podeAcessar || !usuario.clienteId) {
    redirect("/dashboard");
  }

  return (
    <DenunciasTela
      contexto="cliente"
      podeCriar={false}
    />
  );
}
import { auth } from "@/src/auth";
import { PerfilUsuario } from "@prisma/client";
import { redirect } from "next/navigation";
import { MenuCliente } from "@/src/app/components/menu-interno/cliente/MenuInterno";

export default async function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const usuario = session.user as {
    perfil?: PerfilUsuario;
    clienteId?: string | null;
  };

  const podeAcessarPainelCliente =
    usuario.perfil === PerfilUsuario.CLIENTE ||
    usuario.perfil === PerfilUsuario.COMITE_CLIENTE;

  if (!podeAcessarPainelCliente) {
    redirect("/dashboard");
  }

  if (!usuario.clienteId) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <MenuCliente />

      <div className="min-h-screen lg:pl-72">
        {children}
      </div>
    </div>
  );
}
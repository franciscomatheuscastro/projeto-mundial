import { auth } from "@/src/auth";
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

  if ((session.user as any).perfil !== "CLIENTE") {
    redirect("/dashboard");
  }

  if (!(session.user as any).clienteId) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <MenuCliente />

      <div className="min-h-screen lg:pl-72">{children}</div>
    </div>
  );
}
import Link from "next/link";
import { signOut } from "@/src/auth";

export function MenuInterno() {
  async function sair() {
    "use server";

    await signOut({
      redirectTo: "/login",
    });
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-72 flex-col bg-gradient-to-b from-blue-700 via-blue-600 to-cyan-500 px-5 py-6 text-white">
      <div className="mb-10 px-2">
        <div className="text-xs font-semibold tracking-[0.35em] text-blue-300">
          GRUPO
        </div>
        <div className="mt-1 text-3xl font-bold">
          Mundial<span className="font-light text-blue-200">RH</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-8">        

        <div>
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
            Visão geral
          </p>

          <div className="ml-3 flex flex-col gap-1 border-l border-white/10 pl-3">
            <MenuLink href="/dashboard">Dashboard</MenuLink>
            <MenuLink href="/clientes">Clientes</MenuLink>
            <MenuLink href="/agendamentos">Agendamentos</MenuLink>            
          </div>
        </div>

        <div>
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.28em] text-slate-400">
            Pesquisa de Clima
          </p>

          <div className="ml-3 flex flex-col gap-1 border-l border-white/10 pl-3">
            
            <MenuLink href="/modelos-pesquisa">Modelos de Pesquisas</MenuLink>
            <MenuLink href="/pesquisas">Pesquisas</MenuLink>
            <MenuLink href="/planos-acao">Planos de ação</MenuLink>
            
          </div>
        </div>


      <div>
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.28em] text-blue-100/80">
          Canal de Denúncias
        </p>

        <div className="ml-3 flex flex-col gap-1 border-l border-white/20 pl-3">
          <MenuLink href="/denuncias">Denúncias</MenuLink>
          <MenuLink href="/criticidade">Criticidade</MenuLink>
        </div>
      </div>

      </nav>



      <form action={sair} className="mt-4">
        <button className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50">
          Sair
        </button>
      </form>
    </aside>
  );
}

function MenuLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
    >
      {children}
    </Link>
  );
}
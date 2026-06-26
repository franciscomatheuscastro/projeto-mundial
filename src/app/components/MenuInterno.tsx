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
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-72 flex-col bg-gradient-to-b from-blue-700 via-blue-600 to-cyan-500 px-6 py-6 text-white">
      <div className="mb-10">
        <div className="text-sm tracking-[0.3em] text-blue-100">GRUPO</div>
        <div className="text-3xl font-bold">
          Mundial<span className="font-light">RH</span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        <Link href="/dashboard" className="rounded-xl px-4 py-3 font-medium hover:bg-white/15">
          Dashboard
        </Link>

        <Link href="/modelos-pesquisa" className="rounded-xl px-4 py-3 font-medium hover:bg-white/15">
          Modelos de Pesquisa
        </Link>

        <Link href="/clientes" className="rounded-xl px-4 py-3 font-medium hover:bg-white/15">
          Clientes
        </Link>

        <Link href="/pesquisas" className="rounded-xl px-4 py-3 font-medium hover:bg-white/15">
          Pesquisas
        </Link>
      </nav>

      

      <form action={sair} className="mt-4">
        <button className="w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-50">
          Sair
        </button>
      </form>
    </aside>
  );
}
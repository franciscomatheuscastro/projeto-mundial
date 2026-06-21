"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const itensMenu = [
  { nome: "Dashboard", href: "/dashboard" },
  { nome: "Pacientes", href: "/pacientes" },
  { nome: "Agenda", href: "/agenda" },
  { nome: "Atendimentos", href: "/atendimentos" },
  { nome: "Prontuários", href: "/prontuarios" },
  { nome: "Relatórios", href: "/relatorios" },
  { nome: "Usuários", href: "/usuarios" },
];

export function MenuInterno() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-900/80 p-6 lg:block">
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
          Mundial
        </p>
        <h1 className="mt-2 text-2xl font-black text-white">
          Psicossocial
        </h1>
      </div>

      <nav className="space-y-2">
        {itensMenu.map((item) => {
          const ativo =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                ativo
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.nome}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
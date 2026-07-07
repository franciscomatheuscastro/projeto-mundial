// src/app/components/layout/CabecalhoPagina.tsx
import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
};

export default function CabecalhoPagina({
  eyebrow = "MUNDIALSAFE",
  titulo,
  descricao,
  acao,
}: Props) {
  return (
    <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">
              {eyebrow}
            </p>
          )}

          <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
            {titulo}
          </h1>

          {descricao && (
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              {descricao}
            </p>
          )}
        </div>

        {acao && <div className="shrink-0">{acao}</div>}
      </div>
    </header>
  );
}
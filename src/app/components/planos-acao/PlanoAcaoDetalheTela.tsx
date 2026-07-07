"use client";

import Link from "next/link";
import { useEffect } from "react";
import PlanoAcaoFormularioTela from "./PlanoAcaoFormularioTela";
import { usePlanosAcao } from "@/src/app/data/hooks/usePlanosAcao";

type Props = {
  id: string;
  contexto?: "mundial" | "cliente";
};

export default function PlanoAcaoDetalheTela({
  id,
  contexto = "mundial",
}: Props) {
  const { planoSelecionado, carregando, erro, carregarPlanoPorId } =
    usePlanosAcao(false, contexto);

  const baseHref = contexto === "cliente" ? "/meus-planos-acao" : "/planos-acao";

  useEffect(() => {
    carregarPlanoPorId(id);
  }, [id, carregarPlanoPorId]);

  if (contexto === "cliente") {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            MundialSafe
          </p>

          <h1 className="mt-2 text-xl font-bold text-slate-900">
            Acesso restrito
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            O cliente pode visualizar apenas o relatório final do plano de ação.
          </p>

          <Link
            href={`${baseHref}/${id}/relatorio`}
            className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
          >
            Ver relatório
          </Link>
        </div>
      </main>
    );
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Carregando plano...
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {erro}
        </div>
      </main>
    );
  }

  if (!planoSelecionado) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Plano de ação não encontrado.
        </div>
      </main>
    );
  }

  return (
    <PlanoAcaoFormularioTela
      planoInicial={planoSelecionado}
      contexto={contexto}
    />
  );
}
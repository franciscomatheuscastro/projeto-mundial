"use client";

import { useEffect } from "react";
import PlanoAcaoFormularioTela from "./PlanoAcaoFormularioTela";
import { usePlanosAcao } from "@/src/app/data/hooks/usePlanosAcao";

type Props = {
  id: string;
};

export default function PlanoAcaoDetalheTela({ id }: Props) {
  const { planoSelecionado, carregando, erro, carregarPlanoPorId } =
    usePlanosAcao(false);

  useEffect(() => {
    carregarPlanoPorId(id);
  }, [id]);

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 px-8 py-6">
        <div className="text-sm text-slate-500">Carregando plano...</div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="min-h-screen bg-slate-100 px-8 py-6">
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {erro}
        </div>
      </main>
    );
  }

  if (!planoSelecionado) {
    return (
      <main className="min-h-screen bg-slate-100 px-8 py-6">
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
          Plano de ação não encontrado.
        </div>
      </main>
    );
  }

  return <PlanoAcaoFormularioTela planoInicial={planoSelecionado} />;
}
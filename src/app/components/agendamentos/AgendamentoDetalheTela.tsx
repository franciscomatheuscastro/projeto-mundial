"use client";

import { useEffect } from "react";
import AgendamentoFormularioTela from "./AgendamentoFormularioTela";
import { useAgendamentos } from "@/src/app/data/hooks/useAgendamentos";

type Props = {
  id: string;
  contexto?: "mundial" | "cliente";
};

export default function AgendamentoDetalheTela({
  id,
  contexto = "mundial",
}: Props) {
  const { agendamentoSelecionado, carregando, erro, carregarAgendamentoPorId } =
    useAgendamentos(false, contexto);

  useEffect(() => {
    carregarAgendamentoPorId(id);
  }, [id, carregarAgendamentoPorId]);

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Carregando agendamento...
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

  if (!agendamentoSelecionado) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Agendamento não encontrado.
        </div>
      </main>
    );
  }

  return (
    <AgendamentoFormularioTela
      agendamentoInicial={agendamentoSelecionado}
      contexto={contexto}
    />
  );
}
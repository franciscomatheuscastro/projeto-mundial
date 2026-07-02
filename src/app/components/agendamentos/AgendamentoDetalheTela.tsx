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
  }, [id]);

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 px-8 py-6">
        <div className="text-sm text-slate-500">Carregando agendamento...</div>
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

  if (!agendamentoSelecionado) {
    return (
      <main className="min-h-screen bg-slate-100 px-8 py-6">
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
          Agendamento não encontrado.
        </div>
      </main>
    );
  }

  return (
    <AgendamentoFormularioTela agendamentoInicial={agendamentoSelecionado} />
  );
}
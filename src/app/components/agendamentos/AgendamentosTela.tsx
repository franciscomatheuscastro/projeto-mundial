"use client";

import Link from "next/link";
import { useAgendamentos } from "@/src/app/data/hooks/useAgendamentos";

type Props = {
  contexto?: "mundial" | "cliente";
};

function formatarData(data: Date | string) {
  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function AgendamentosTela({ contexto = "mundial" }: Props) {
  const { agendamentos, carregando, erro, excluirAgendamento, processando } =
    useAgendamentos(true, contexto);

  const baseHref =
    contexto === "cliente" ? "/meus-agendamentos" : "/agendamentos";

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agendamentos</h1>
          <p className="text-sm text-slate-500">
            {contexto === "cliente"
              ? "Acompanhe reuniões, devolutivas e apresentações da sua empresa."
              : "Reuniões, devolutivas e apresentações dos planos de ação."}
          </p>
        </div>

        {contexto === "mundial" && (
          <Link
            href="/agendamentos/novo"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Novo agendamento
          </Link>
        )}
      </header>

      <section className="space-y-6 px-8 py-6">
        {erro && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          {carregando ? (
            <div className="p-6 text-sm text-slate-500">Carregando...</div>
          ) : agendamentos.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              Nenhum agendamento cadastrado.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Título</th>
                  {contexto === "mundial" && (
                    <th className="px-4 py-3">Cliente</th>
                  )}
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Opções</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {agendamentos.map((agendamento) => (
                  <tr key={agendamento.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatarData(agendamento.dataHora)}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {agendamento.titulo}
                    </td>

                    {contexto === "mundial" && (
                      <td className="px-4 py-3 text-slate-600">
                        {agendamento.planoAcao?.pesquisa.cliente.empresa ||
                          agendamento.planoAcao?.pesquisa.cliente.nome ||
                          "-"}
                      </td>
                    )}

                    <td className="px-4 py-3 text-slate-600">
                      {agendamento.tipo}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {agendamento.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`${baseHref}/${agendamento.id}`}
                          className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                        >
                          Abrir
                        </Link>

                        {contexto === "mundial" && (
                          <button
                            disabled={processando}
                            onClick={() => {
                              if (confirm("Deseja excluir este agendamento?")) {
                                excluirAgendamento(agendamento.id);
                              }
                            }}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
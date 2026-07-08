"use client";

import type { ReactNode } from "react";
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

function formatarTexto(valor: string) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

export default function AgendamentosTela({ contexto = "mundial" }: Props) {
  const { agendamentos, carregando, erro, excluirAgendamento, processando } =
    useAgendamentos(true, contexto);

  const usuarioMundial = contexto === "mundial";
  const baseHref = usuarioMundial ? "/agendamentos" : "/meus-agendamentos";

  return (
    <main className="min-h-screen bg-slate-100">

      
      <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Agendamentos
            </p>

            <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              Gestão de Agendamentos
            </h1>

            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              {usuarioMundial
                ? "Reuniões, devolutivas e apresentações dos planos de ação."
                : "Acompanhe reuniões, devolutivas e apresentações da sua empresa."}
            </p>
          </div>

          {usuarioMundial && (
            <Link
              href="/agendamentos/novo"
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
            >
              Novo agendamento
            </Link>
          )}
        </div>
      </header>

      <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {erro && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Data</Th>
                  <Th>Título</Th>
                  {usuarioMundial && <Th>Cliente</Th>}
                  <Th>Tipo</Th>
                  <Th>Status</Th>
                  <Th direita>Opções</Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <LinhaVazia
                    colunas={usuarioMundial ? 6 : 5}
                    texto="Carregando agendamentos..."
                  />
                ) : agendamentos.length === 0 ? (
                  <LinhaVazia
                    colunas={usuarioMundial ? 6 : 5}
                    texto="Nenhum agendamento cadastrado."
                  />
                ) : (
                  agendamentos.map((agendamento) => (
                    <tr
                      key={agendamento.id}
                      className="border-t border-slate-100 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        {formatarData(agendamento.dataHora)}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div className="max-w-xs truncate">
                          {agendamento.titulo}
                        </div>
                      </td>

                      {usuarioMundial && (
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {agendamento.planoAcao?.pesquisa.cliente.empresa ||
                            agendamento.planoAcao?.pesquisa.cliente.nome ||
                            "-"}
                        </td>
                      )}

                      <td className="px-4 py-4">
                        <Badge texto={agendamento.tipo} />
                      </td>

                      <td className="px-4 py-4">
                        <Badge texto={agendamento.status} />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-3 whitespace-nowrap">
                          <Link
                            href={`${baseHref}/${agendamento.id}`}
                            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                          >
                            Abrir
                          </Link>

                          {usuarioMundial && (
                            <button
                              type="button"
                              disabled={processando}
                              onClick={() => {
                                if (
                                  confirm("Deseja excluir este agendamento?")
                                ) {
                                  excluirAgendamento(agendamento.id);
                                }
                              }}
                              className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Excluir
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function Badge({ texto }: { texto: string }) {
  const classe =
    texto === "REALIZADO"
      ? "bg-green-100 text-green-700"
      : texto === "CANCELADO"
      ? "bg-red-100 text-red-700"
      : texto === "REAGENDADO"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-blue-100 text-blue-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classe}`}>
      {formatarTexto(texto)}
    </span>
  );
}

function Th({
  children,
  direita = false,
}: {
  children: ReactNode;
  direita?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 ${
        direita ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function LinhaVazia({ colunas, texto }: { colunas: number; texto: string }) {
  return (
    <tr>
      <td
        colSpan={colunas}
        className="px-4 py-12 text-center text-sm text-slate-500"
      >
        {texto}
      </td>
    </tr>
  );
}
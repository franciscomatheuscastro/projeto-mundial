"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePlanosAcao } from "@/src/app/data/hooks/usePlanosAcao";

type Props = {
  contexto?: "mundial" | "cliente";
};

export default function PlanosAcaoTela({ contexto = "mundial" }: Props) {
  const router = useRouter();

  const { planos, carregando, erro, excluirPlano, processando } =
    usePlanosAcao(true, contexto);

  const baseHref = contexto === "cliente" ? "/meus-planos-acao" : "/planos-acao";
  const usuarioMundial = contexto === "mundial";

  async function excluirPlanoAtual(id: string) {
    const confirmado = confirm("Deseja excluir este plano de ação?");
    if (!confirmado) return;

    await excluirPlano(id);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-100">

      
      <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Pesquisa de Clima
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-900">
              Planos de ação
            </h1>

            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              {usuarioMundial
                ? "Gestão dos planos criados a partir das pesquisas de clima."
                : "Visualize os relatórios finais dos planos de ação da sua empresa."}
            </p>
          </div>

          {usuarioMundial && (
            <Link
              href="/planos-acao/novo"
              className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
            >
              Novo plano
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card titulo="Planos" valor={planos.length} />
          <Card
            titulo="Em andamento"
            valor={planos.filter((p) => p.status === "EM_ANDAMENTO").length}
          />
          <Card
            titulo="Concluídos"
            valor={planos.filter((p) => p.status === "CONCLUIDO").length}
          />
          <Card
            titulo="Ações"
            valor={planos.reduce((total, plano) => total + plano.totalAcoes, 0)}
          />
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Plano</Th>
                  {usuarioMundial && <Th>Cliente</Th>}
                  <Th>Pesquisa</Th>
                  <Th>Ações</Th>
                  <Th>Status</Th>
                  <Th direita>Opções</Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <LinhaVazia
                    colunas={usuarioMundial ? 6 : 5}
                    texto="Carregando planos de ação..."
                  />
                ) : planos.length === 0 ? (
                  <LinhaVazia
                    colunas={usuarioMundial ? 6 : 5}
                    texto="Nenhum plano de ação cadastrado."
                  />
                ) : (
                  planos.map((plano) => (
                    <tr
                      key={plano.id}
                      className="border-t border-slate-100 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4">
                        <div className="max-w-xs font-semibold text-slate-900">
                          {plano.titulo}
                        </div>
                      </td>

                      {usuarioMundial && (
                        <td className="px-4 py-4 text-sm text-slate-700">
                          {plano.pesquisa.cliente.empresa ||
                            plano.pesquisa.cliente.nome}
                        </td>
                      )}

                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div className="max-w-xs truncate">
                          {plano.pesquisa.titulo}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm font-medium text-slate-700">
                        {plano.totalAcoes}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={plano.status} />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-3 whitespace-nowrap">
                          {usuarioMundial && (
                            <Link
                              href={`${baseHref}/${plano.id}`}
                              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
                            >
                              Editar
                            </Link>
                          )}

                          <Link
                            href={`${baseHref}/${plano.id}/relatorio`}
                            className="text-sm font-semibold text-slate-700 hover:text-slate-950"
                          >
                            Relatório
                          </Link>

                          {usuarioMundial && (
                            <button
                              type="button"
                              disabled={processando}
                              onClick={() => excluirPlanoAtual(plano.id)}
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

function Card({ titulo, valor }: { titulo: string; valor: number | string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-3xl font-bold text-slate-900">
        {valor}
      </strong>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classe =
    status === "CONCLUIDO"
      ? "bg-green-100 text-green-700"
      : status === "EM_ANDAMENTO"
      ? "bg-blue-100 text-blue-700"
      : status === "ARQUIVADO"
      ? "bg-slate-200 text-slate-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classe}`}>
      {formatarStatus(status)}
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

function formatarStatus(valor: string) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}
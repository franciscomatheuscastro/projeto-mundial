"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePlanosAcao } from "@/src/app/data/hooks/usePlanosAcao";

export default function PlanosAcaoTela() {
  const router = useRouter();
  const { planos, carregando, erro, excluirPlano, processando } =
    usePlanosAcao();

  async function excluirPlanoAtual(id: string) {
    const confirmado = confirm("Deseja excluir este plano de ação?");
    if (!confirmado) return;

    await excluirPlano(id);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Planos de ação</h1>
          <p className="text-sm text-slate-500">
            Gestão dos planos criados a partir das pesquisas de clima.
          </p>
        </div>

        <Link
          href="/planos-acao/novo"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Novo plano
        </Link>
      </header>

      <section className="px-8 py-6">
        {erro && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
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

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <Th>Plano</Th>
                <Th>Cliente</Th>
                <Th>Pesquisa</Th>
                <Th>Ações</Th>
                <Th>Status</Th>
                <Th direita>Opções</Th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <LinhaVazia colunas={6} texto="Carregando planos de ação..." />
              ) : planos.length === 0 ? (
                <LinhaVazia colunas={6} texto="Nenhum plano de ação cadastrado." />
              ) : (
                planos.map((plano) => (
                  <tr key={plano.id} className="border-t">
                    <td className="px-4 py-4 font-medium text-slate-900">
                      {plano.titulo}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {plano.pesquisa.cliente.empresa ||
                        plano.pesquisa.cliente.nome}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {plano.pesquisa.titulo}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {plano.totalAcoes}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={plano.status} />
                    </td>

                    <td className="px-4 py-4 text-right">
                      <Link
                        href={`/planos-acao/${plano.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        Abrir
                      </Link>

                      <button
                        type="button"
                        disabled={processando}
                        onClick={() => excluirPlanoAtual(plano.id)}
                        className="ml-4 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-60"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number | string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="text-3xl text-slate-900">{valor}</strong>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const classes =
    status === "CONCLUIDO"
      ? "bg-green-100 text-green-700"
      : status === "EM_ANDAMENTO"
      ? "bg-blue-100 text-blue-700"
      : status === "ARQUIVADO"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${classes}`}>
      {status}
    </span>
  );
}

function Th({
  children,
  direita = false,
}: {
  children: React.ReactNode;
  direita?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-sm font-semibold text-slate-600 ${
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
        className="px-4 py-10 text-center text-sm text-slate-500"
      >
        {texto}
      </td>
    </tr>
  );
}
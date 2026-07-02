import { prisma } from "@/src/lib/prisma";

export default async function DashboardPage() {
  const [clientes, modelos, pesquisas, respostas] = await Promise.all([
    prisma.cliente.count(),
    prisma.modeloPesquisa.count(),
    prisma.pesquisaCliente.count(),
    prisma.respostaPesquisa.count(),
  ]);

  return (
    <main className="min-h-screen">
      <header className="border-b bg-white px-8 py-6">
        <p className="text-sm font-semibold text-blue-600">MundialSafe</p>
        <h1 className="text-3xl font-bold text-slate-900">
          Painel Mundial
        </h1>
        <p className="mt-1 text-slate-500">
          Gestão de pesquisas, clima organizacional e relatórios.
        </p>
      </header>

      <section className="px-8 py-8">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-blue-700 to-cyan-500 p-8 text-white shadow-sm">
          <h2 className="text-3xl font-bold">Segurança e transparência.</h2>
          <p className="mt-2 max-w-2xl text-blue-50">
            Uma plataforma para ouvir colaboradores, gerar indicadores e apoiar decisões de gestão.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          <Card titulo="Clientes" valor={clientes} />
          <Card titulo="Modelos" valor={modelos} />
          <Card titulo="Pesquisas" valor={pesquisas} />
          <Card titulo="Respostas" valor={respostas} />
        </div>
      </section>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="mt-2 block text-4xl text-slate-900">{valor}</strong>
    </div>
  );
}
// src/app/(internas)/dashboard/pesquisas/page.tsx

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PesquisasPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const pesquisas = await prisma.pesquisaCliente.findMany({
    orderBy: { criadoEm: "desc" },
    include: {
      cliente: true,
      modelo: true,
      respostas: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pesquisas</h1>
          <p className="text-sm text-slate-500">
            Gere links de pesquisa para clientes responderem.
          </p>
        </div>

        <Link
          href="/pesquisas/nova"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nova pesquisa
        </Link>
      </header>

      <section className="px-8 py-6">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card titulo="Pesquisas" valor={pesquisas.length} />
          <Card
            titulo="Abertas"
            valor={pesquisas.filter((p) => p.status === "ABERTA").length}
          />
          <Card
            titulo="Fechadas"
            valor={pesquisas.filter((p) => p.status === "FECHADA").length}
          />
          <Card
            titulo="Respostas"
            valor={pesquisas.reduce((t, p) => t + p.respostas.length, 0)}
          />
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Pesquisa
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Modelo
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Respostas
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {pesquisas.map((pesquisa) => (
                <tr key={pesquisa.id} className="border-t">
                  <td className="px-4 py-4 font-medium text-slate-900">
                    {pesquisa.titulo}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-700">
                    {pesquisa.cliente.nome}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-700">
                    {pesquisa.modelo.titulo}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-700">
                    {pesquisa.respostas.length}
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      {pesquisa.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/pesquisas/${pesquisa.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}

              {pesquisas.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Nenhuma pesquisa gerada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <strong className="text-3xl text-slate-900">{valor}</strong>
    </div>
  );
}
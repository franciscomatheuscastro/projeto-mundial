// src/app/(internas)/dashboard/clientes/page.tsx

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ClientesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const clientes = await prisma.cliente.findMany({
    orderBy: {
      criadoEm: "desc",
    },
    include: {
      pesquisas: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500">
            Gerencie os clientes que receberão pesquisas.
          </p>
        </div>

        <Link
          href="/clientes/novo"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Novo cliente
        </Link>
      </header>

      <section className="px-8 py-6">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Clientes</p>
            <strong className="text-3xl text-slate-900">{clientes.length}</strong>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Ativos</p>
            <strong className="text-3xl text-slate-900">
              {clientes.filter((c) => c.ativo).length}
            </strong>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pesquisas vinculadas</p>
            <strong className="text-3xl text-slate-900">
              {clientes.reduce((total, cliente) => total + cliente.pesquisas.length, 0)}
            </strong>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Contato
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Pesquisas
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
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="border-t">
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">
                      {cliente.nome}
                    </div>
                    <div className="text-sm text-slate-500">
                      {cliente.empresa || "Sem empresa informada"}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-700">
                    <div>{cliente.email || "Sem e-mail"}</div>
                    <div className="text-slate-500">
                      {cliente.telefone || "Sem telefone"}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-700">
                    {cliente.pesquisas.length}
                  </td>

                  <td className="px-4 py-4">
                    {cliente.ativo ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        Ativo
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                        Inativo
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/clientes/${cliente.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}

              {clientes.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Nenhum cliente cadastrado.
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
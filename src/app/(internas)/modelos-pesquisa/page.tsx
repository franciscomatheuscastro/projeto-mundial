import { auth, signOut } from "@/src/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import Link from "next/link";

export default async function ModelosPesquisaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const modelos = await prisma.modeloPesquisa.findMany({
    orderBy: {
      criadoEm: "desc",
    },
    include: {
      perguntas: {
        orderBy: {
          ordem: "asc",
        },
      },
      pesquisas: true,
    },
  });

  async function sair() {
    "use server";

    await signOut({
      redirectTo: "/login",
    });
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Modelos de Pesquisa
          </h1>
          <p className="text-sm text-slate-500">
            Gerencie os formulários base da pesquisa de clima.
          </p>
        </div>

        <form action={sair}>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Sair
          </button>
        </form>
      </header>

      <section className="px-8 py-6">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Modelos</p>
            <strong className="text-3xl text-slate-900">{modelos.length}</strong>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Modelos ativos</p>
            <strong className="text-3xl text-slate-900">
              {modelos.filter((m) => m.ativo).length}
            </strong>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Modelos padrão</p>
            <strong className="text-3xl text-slate-900">
              {modelos.filter((m) => m.modeloPadrao).length}
            </strong>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pesquisas geradas</p>
            <strong className="text-3xl text-slate-900">
              {modelos.reduce((total, modelo) => total + modelo.pesquisas.length, 0)}
            </strong>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Lista de modelos
          </h2>

          <Link
            href="/modelos-pesquisa/novo"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Novo modelo
          </Link>
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Modelo
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                  Perguntas
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
              {modelos.map((modelo) => (
                <tr key={modelo.id} className="border-t">
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">
                      {modelo.titulo}
                    </div>
                    <div className="text-sm text-slate-500">
                      {modelo.descricao || "Sem descrição"}
                    </div>
                    {modelo.modeloPadrao && (
                      <span className="mt-2 inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        Modelo padrão
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-700">
                    {modelo.perguntas.length}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-700">
                    {modelo.pesquisas.length}
                  </td>

                  <td className="px-4 py-4">
                    {modelo.ativo ? (
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
                      href={`/modelos-pesquisa/${modelo.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}

              {modelos.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Nenhum modelo cadastrado.
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
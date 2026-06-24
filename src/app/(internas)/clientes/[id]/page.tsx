// src/app/(internas)/dashboard/clientes/[id]/page.tsx

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarClientePage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: {
      pesquisas: {
        include: {
          modelo: true,
        },
        orderBy: {
          criadoEm: "desc",
        },
      },
    },
  });

  if (!cliente) {
    redirect("/clientes");
  }

  async function salvarCliente(formData: FormData) {
    "use server";

    const nome = String(formData.get("nome") ?? "").trim();
    const empresa = String(formData.get("empresa") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const telefone = String(formData.get("telefone") ?? "").trim();
    const documento = String(formData.get("documento") ?? "").trim();
    const observacoes = String(formData.get("observacoes") ?? "").trim();
    const ativo = formData.get("ativo") === "on";

    await prisma.cliente.update({
      where: { id },
      data: {
        nome,
        empresa: empresa || null,
        email: email || null,
        telefone: telefone || null,
        documento: documento || null,
        observacoes: observacoes || null,
        ativo,
      },
    });

    redirect(`/clientes/${id}`);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Editar Cliente</h1>
          <p className="text-sm text-slate-500">
            Atualize os dados cadastrais e acompanhe pesquisas vinculadas.
          </p>
        </div>

        <Link
          href="/clientes"
          className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Voltar
        </Link>
      </header>

      <section className="grid gap-6 px-8 py-8 lg:grid-cols-[420px_1fr]">
        <form action={salvarCliente} className="h-fit rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nome do cliente
            </label>
            <input
              name="nome"
              required
              defaultValue={cliente.nome}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Empresa
            </label>
            <input
              name="empresa"
              defaultValue={cliente.empresa ?? ""}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                E-mail
              </label>
              <input
                name="email"
                type="email"
                defaultValue={cliente.email ?? ""}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Telefone
              </label>
              <input
                name="telefone"
                defaultValue={cliente.telefone ?? ""}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Documento
            </label>
            <input
              name="documento"
              defaultValue={cliente.documento ?? ""}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Observações
            </label>
            <textarea
              name="observacoes"
              rows={4}
              defaultValue={cliente.observacoes ?? ""}
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <label className="mb-6 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="ativo" defaultChecked={cliente.ativo} />
            Cliente ativo
          </label>

          <button className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700">
            Salvar alterações
          </button>
        </form>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Pesquisas do cliente
              </h2>
              <p className="text-sm text-slate-500">
                Histórico de pesquisas geradas para este cliente.
              </p>
            </div>

            <Link
              href="/pesquisas/nova"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              + Nova pesquisa
            </Link>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                    Pesquisa
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                    Modelo
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {cliente.pesquisas.map((pesquisa) => (
                  <tr key={pesquisa.id} className="border-t">
                    <td className="px-4 py-4 text-sm text-slate-900">
                      {pesquisa.titulo}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {pesquisa.modelo.titulo}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {pesquisa.status}
                    </td>
                  </tr>
                ))}

                {cliente.pesquisas.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Nenhuma pesquisa gerada para este cliente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
// src/app/(internas)/dashboard/pesquisas/nova/page.tsx

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { randomUUID } from "crypto";

export default async function NovaPesquisaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const clientes = await prisma.cliente.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  const modelos = await prisma.modeloPesquisa.findMany({
    where: { ativo: true },
    orderBy: { titulo: "asc" },
  });

  async function criarPesquisa(formData: FormData) {
    "use server";

    const clienteId = String(formData.get("clienteId") ?? "");
    const modeloId = String(formData.get("modeloId") ?? "");
    const titulo = String(formData.get("titulo") ?? "").trim();
    const descricao = String(formData.get("descricao") ?? "").trim();

    if (!clienteId || !modeloId || !titulo) {
      return;
    }

    const pesquisa = await prisma.pesquisaCliente.create({
      data: {
        clienteId,
        modeloId,
        titulo,
        descricao: descricao || null,
        token: randomUUID(),
        status: "ABERTA",
      },
    });

    redirect(`/pesquisas/${pesquisa.id}`);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-8 py-4">
        <h1 className="text-xl font-bold text-slate-900">Nova Pesquisa</h1>
        <p className="text-sm text-slate-500">
          Vincule um cliente a um modelo e gere um link público.
        </p>
      </header>

      <section className="mx-auto max-w-3xl px-8 py-8">
        <form action={criarPesquisa} className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Título da pesquisa
            </label>
            <input
              name="titulo"
              required
              placeholder="Ex: Pesquisa de Clima 2026"
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Cliente
            </label>
            <select
              name="clienteId"
              required
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nome} {cliente.empresa ? `- ${cliente.empresa}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Modelo de pesquisa
            </label>
            <select
              name="modeloId"
              required
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            >
              <option value="">Selecione um modelo</option>
              {modelos.map((modelo) => (
                <option key={modelo.id} value={modelo.id}>
                  {modelo.titulo}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Descrição
            </label>
            <textarea
              name="descricao"
              rows={4}
              placeholder="Mensagem de orientação para quem irá responder"
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-between">
            <Link
              href="/pesquisas"
              className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Voltar
            </Link>

            <button className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Gerar pesquisa
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
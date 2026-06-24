// src/app/(internas)/dashboard/clientes/novo/page.tsx

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NovoClientePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  async function criarCliente(formData: FormData) {
    "use server";

    const nome = String(formData.get("nome") ?? "").trim();
    const empresa = String(formData.get("empresa") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const telefone = String(formData.get("telefone") ?? "").trim();
    const documento = String(formData.get("documento") ?? "").trim();
    const observacoes = String(formData.get("observacoes") ?? "").trim();

    if (!nome) {
      return;
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome,
        empresa: empresa || null,
        email: email || null,
        telefone: telefone || null,
        documento: documento || null,
        observacoes: observacoes || null,
      },
    });

    redirect(`/clientes/${cliente.id}`);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-8 py-4">
        <h1 className="text-xl font-bold text-slate-900">Novo Cliente</h1>
        <p className="text-sm text-slate-500">
          Cadastre uma empresa ou responsável para receber pesquisas.
        </p>
      </header>

      <section className="mx-auto max-w-3xl px-8 py-8">
        <form action={criarCliente} className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Nome do cliente
            </label>
            <input
              name="nome"
              required
              placeholder="Ex: Transordi"
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Empresa
            </label>
            <input
              name="empresa"
              placeholder="Ex: Transordi Transportes"
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
                placeholder="contato@empresa.com"
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Telefone
              </label>
              <input
                name="telefone"
                placeholder="(00) 00000-0000"
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
              placeholder="CNPJ ou CPF"
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Observações
            </label>
            <textarea
              name="observacoes"
              rows={4}
              placeholder="Informações internas"
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-between">
            <Link
              href="/clientes"
              className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Voltar
            </Link>

            <button className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Salvar cliente
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
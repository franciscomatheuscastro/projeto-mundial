// src/app/(internas)/dashboard/modelos-pesquisa/novo/page.tsx

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NovoModeloPesquisaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  async function criarModelo(formData: FormData) {
    "use server";

    const titulo = String(formData.get("titulo") ?? "").trim();
    const descricao = String(formData.get("descricao") ?? "").trim();

    if (!titulo) {
      return;
    }

    const modelo = await prisma.modeloPesquisa.create({
      data: {
        titulo,
        descricao: descricao || null,
        perguntas: {
          create: [
            {
              titulo: "Nova pergunta",
              tipo: "NOTA",
              ordem: 1,
              obrigatoria: true,
            },
          ],
        },
      },
    });

    redirect(`/modelos-pesquisa/${modelo.id}`);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-8 py-4">
        <h1 className="text-xl font-bold text-slate-900">Novo Modelo</h1>
        <p className="text-sm text-slate-500">
          Crie um novo formulário base de pesquisa.
        </p>
      </header>

      <section className="mx-auto max-w-3xl px-8 py-8">
        <form action={criarModelo} className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Título do modelo
            </label>
            <input
              name="titulo"
              required
              placeholder="Ex: Pesquisa de Satisfação"
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Descrição
            </label>
            <textarea
              name="descricao"
              rows={4}
              placeholder="Explique o objetivo da pesquisa"
              className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-between">
            <Link
              href="/modelos-pesquisa"
              className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Voltar
            </Link>

            <button className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Criar modelo
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
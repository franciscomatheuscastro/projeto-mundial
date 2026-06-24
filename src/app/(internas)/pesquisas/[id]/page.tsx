// src/app/(internas)/dashboard/pesquisas/[id]/page.tsx

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DetalhePesquisaPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const pesquisa = await prisma.pesquisaCliente.findUnique({
    where: { id },
    include: {
      cliente: true,
      modelo: {
        include: {
          perguntas: {
            orderBy: { ordem: "asc" },
          },
        },
      },
      respostas: true,
    },
  });

  if (!pesquisa) {
    redirect("/pesquisas");
  }

  const linkPublico = `http://localhost:3001/pesquisa/${pesquisa.token}`;

  async function fecharPesquisa() {
    "use server";

    await prisma.pesquisaCliente.update({
      where: { id },
      data: { status: "FECHADA" },
    });

    redirect(`/pesquisas/${id}`);
  }

  async function abrirPesquisa() {
    "use server";

    await prisma.pesquisaCliente.update({
      where: { id },
      data: { status: "ABERTA" },
    });

    redirect(`/pesquisas/${id}`);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {pesquisa.titulo}
          </h1>
          <p className="text-sm text-slate-500">
            Cliente: {pesquisa.cliente.nome} | Modelo: {pesquisa.modelo.titulo}
          </p>
        </div>

        <Link
          href="/pesquisas"
          className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Voltar
        </Link>
      </header>

      <section className="grid gap-6 px-8 py-8 lg:grid-cols-[420px_1fr]">
        <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Link público
          </h2>

          <div className="mb-4 rounded-lg border bg-slate-50 p-3 text-sm text-slate-700">
            {linkPublico}
          </div>

          <a
            href={linkPublico}
            target="_blank"
            className="mb-3 block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-blue-700"
          >
            Abrir pesquisa pública
          </a>

          <Link
            href={`/pesquisas/${pesquisa.id}/relatorio`}
            className="mb-3 block w-full rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white hover:bg-slate-700"
          >
            Ver relatório
          </Link>

          <div className="mb-6 text-sm text-slate-500">
            Envie esse link para o cliente responder a pesquisa.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Info titulo="Status" valor={pesquisa.status} />
            <Info titulo="Respostas" valor={String(pesquisa.respostas.length)} />
            <Info
              titulo="Perguntas"
              valor={String(pesquisa.modelo.perguntas.length)}
            />
            <Info titulo="Cliente" valor={pesquisa.cliente.nome} />
          </div>

          {pesquisa.status === "ABERTA" ? (
            <form action={fecharPesquisa} className="mt-6">
              <button className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700">
                Fechar pesquisa
              </button>
            </form>
          ) : (
            <form action={abrirPesquisa} className="mt-6">
              <button className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700">
                Reabrir pesquisa
              </button>
            </form>
          )}
        </aside>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Perguntas vinculadas
          </h2>

          <div className="space-y-3">
            {pesquisa.modelo.perguntas.map((pergunta) => (
              <div key={pergunta.id} className="rounded-lg border p-4">
                <div className="mb-1 text-xs font-medium text-slate-400">
                  Pergunta {pergunta.ordem} | {pergunta.tipo}
                </div>

                <div className="font-medium text-slate-900">
                  {pergunta.titulo}
                </div>

                {pergunta.descricao && (
                  <div className="mt-1 text-sm text-slate-500">
                    {pergunta.descricao}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{titulo}</p>
      <strong className="text-sm text-slate-900">{valor}</strong>
    </div>
  );
}
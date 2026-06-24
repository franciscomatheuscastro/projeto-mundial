// src/app/(internas)/dashboard/pesquisas/[id]/relatorio/page.tsx

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RelatorioPesquisaPage({ params }: PageProps) {
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
      respostas: {
        include: {
          respostas: {
            include: {
              pergunta: true,
            },
          },
        },
        orderBy: {
          criadoEm: "desc",
        },
      },
    },
  });

  if (!pesquisa) {
    redirect("/pesquisas");
  }

  const perguntas = pesquisa.modelo.perguntas;

  const perguntasNota = perguntas.filter((p) => p.tipo === "NOTA");

  const medias = perguntasNota.map((pergunta) => {
    const valores = pesquisa.respostas
      .flatMap((resposta) => resposta.respostas)
      .filter((resposta) => resposta.perguntaId === pergunta.id)
      .map((resposta) => Number(resposta.valor))
      .filter((valor) => !Number.isNaN(valor));

    const media =
      valores.length > 0
        ? valores.reduce((total, valor) => total + valor, 0) / valores.length
        : 0;

    return {
      pergunta,
      media,
      quantidade: valores.length,
    };
  });

  const mediaGeral =
    medias.length > 0
      ? medias.reduce((total, item) => total + item.media, 0) / medias.length
      : 0;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Relatório da Pesquisa
          </h1>
          <p className="text-sm text-slate-500">
            {pesquisa.titulo} | Cliente: {pesquisa.cliente.nome}
          </p>
        </div>

        <Link
          href={`/pesquisas/${pesquisa.id}`}
          className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Voltar
        </Link>
      </header>

      <section className="px-8 py-8">
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card titulo="Respostas" valor={pesquisa.respostas.length} />
          <Card titulo="Perguntas" valor={perguntas.length} />
          <Card titulo="Notas avaliadas" valor={perguntasNota.length} />
          <Card titulo="Média geral" valor={mediaGeral.toFixed(1)} />
        </div>

        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Média por pergunta
          </h2>

          <div className="space-y-4">
            {medias.map((item) => (
              <div key={item.pergunta.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {item.pergunta.titulo}
                    </p>
                    <p className="text-xs text-slate-500">
                      {item.quantidade} resposta(s)
                    </p>
                  </div>

                  <strong className="text-xl text-slate-900">
                    {item.media.toFixed(1)}
                  </strong>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${Math.min((item.media / 5) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}

            {medias.length === 0 && (
              <p className="text-sm text-slate-500">
                Nenhuma pergunta do tipo nota encontrada.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Respostas recebidas
          </h2>

          <div className="space-y-5">
            {pesquisa.respostas.map((resposta, index) => (
              <div key={resposta.id} className="rounded-lg border p-5">
                <div className="mb-4">
                  <h3 className="font-semibold text-slate-900">
                    Resposta #{pesquisa.respostas.length - index}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {resposta.nome || "Anônimo"}{" "}
                    {resposta.setor ? `| Setor: ${resposta.setor}` : ""}
                    {resposta.cargo ? ` | Cargo: ${resposta.cargo}` : ""}
                  </p>
                </div>

                <div className="space-y-3">
                  {resposta.respostas.map((item) => (
                    <div key={item.id} className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        {item.pergunta.titulo}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {item.valor}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {pesquisa.respostas.length === 0 && (
              <div className="rounded-lg border p-8 text-center text-sm text-slate-500">
                Nenhuma resposta recebida ainda.
              </div>
            )}
          </div>
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
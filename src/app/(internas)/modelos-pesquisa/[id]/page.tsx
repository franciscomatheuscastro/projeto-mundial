// src/app/(internas)/dashboard/modelos-pesquisa/[id]/page.tsx

import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TipoPergunta } from "@prisma/client";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarModeloPesquisaPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const modelo = await prisma.modeloPesquisa.findUnique({
    where: { id },
    include: {
      perguntas: {
        orderBy: {
          ordem: "asc",
        },
      },
    },
  });

  if (!modelo) {
    redirect("/modelos-pesquisa");
  }

  async function salvarModelo(formData: FormData) {
    "use server";

    const titulo = String(formData.get("titulo") ?? "").trim();
    const descricao = String(formData.get("descricao") ?? "").trim();
    const ativo = formData.get("ativo") === "on";

    await prisma.modeloPesquisa.update({
      where: { id },
      data: {
        titulo,
        descricao: descricao || null,
        ativo,
      },
    });

    redirect(`/modelos-pesquisa/${id}`);
  }

  async function adicionarPergunta() {
    "use server";

    const total = await prisma.perguntaPesquisa.count({
      where: {
        modeloId: id,
      },
    });

    await prisma.perguntaPesquisa.create({
      data: {
        modeloId: id,
        titulo: "Nova pergunta",
        tipo: TipoPergunta.NOTA,
        ordem: total + 1,
        obrigatoria: true,
      },
    });

    redirect(`/modelos-pesquisa/${id}`);
  }

  async function salvarPergunta(formData: FormData) {
    "use server";

    const perguntaId = String(formData.get("perguntaId"));
    const titulo = String(formData.get("titulo") ?? "").trim();
    const descricao = String(formData.get("descricao") ?? "").trim();
    const tipo = String(formData.get("tipo")) as TipoPergunta;
    const obrigatoria = formData.get("obrigatoria") === "on";
    const opcoes = String(formData.get("opcoes") ?? "").trim();

    await prisma.perguntaPesquisa.update({
      where: {
        id: perguntaId,
      },
      data: {
        titulo,
        descricao: descricao || null,
        tipo,
        obrigatoria,
        opcoes: opcoes || null,
      },
    });

    redirect(`/modelos-pesquisa/${id}`);
  }

  async function excluirPergunta(formData: FormData) {
    "use server";

    const perguntaId = String(formData.get("perguntaId"));

    await prisma.perguntaPesquisa.delete({
      where: {
        id: perguntaId,
      },
    });

    const perguntasRestantes = await prisma.perguntaPesquisa.findMany({
      where: {
        modeloId: id,
      },
      orderBy: {
        ordem: "asc",
      },
    });

    for (let index = 0; index < perguntasRestantes.length; index++) {
      await prisma.perguntaPesquisa.update({
        where: {
          id: perguntasRestantes[index].id,
        },
        data: {
          ordem: index + 1,
        },
      });
    }

    redirect(`/modelos-pesquisa/${id}`);
  }

  async function duplicarModelo() {
    "use server";

    const modeloOriginal = await prisma.modeloPesquisa.findUnique({
      where: { id },
      include: {
        perguntas: {
          orderBy: {
            ordem: "asc",
          },
        },
      },
    });

    if (!modeloOriginal) {
      redirect("/modelos-pesquisa");
    }

    const novoModelo = await prisma.modeloPesquisa.create({
      data: {
        titulo: `${modeloOriginal.titulo} - Cópia`,
        descricao: modeloOriginal.descricao,
        ativo: true,
        modeloPadrao: false,
        perguntas: {
          create: modeloOriginal.perguntas.map((pergunta) => ({
            titulo: pergunta.titulo,
            descricao: pergunta.descricao,
            tipo: pergunta.tipo,
            ordem: pergunta.ordem,
            obrigatoria: pergunta.obrigatoria,
            opcoes: pergunta.opcoes,
          })),
        },
      },
    });

    redirect(`/modelos-pesquisa/${novoModelo.id}`);
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between border-b bg-white px-8 py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Construtor de Modelo
          </h1>
          <p className="text-sm text-slate-500">
            Edite perguntas, tipos de resposta e configurações do formulário.
          </p>
        </div>

        <Link
          href="/modelos-pesquisa"
          className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Voltar
        </Link>
      </header>

      <section className="grid gap-6 px-8 py-8 lg:grid-cols-[380px_1fr]">
        <aside className="h-fit rounded-xl bg-white p-6 shadow-sm">
          <form action={salvarModelo}>
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Título
              </label>
              <input
                name="titulo"
                defaultValue={modelo.titulo}
                required
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Descrição
              </label>
              <textarea
                name="descricao"
                rows={5}
                defaultValue={modelo.descricao ?? ""}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <label className="mb-6 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="ativo"
                defaultChecked={modelo.ativo}
              />
              Modelo ativo
            </label>

            <button className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700">
              Salvar modelo
            </button>
          </form>

          <form action={duplicarModelo} className="mt-3">
            <button className="w-full rounded-lg border px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Duplicar modelo
            </button>
          </form>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Perguntas do formulário
              </h2>
              <p className="text-sm text-slate-500">
                Total: {modelo.perguntas.length} pergunta(s)
              </p>
            </div>

            <form action={adicionarPergunta}>
              <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                + Adicionar pergunta
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {modelo.perguntas.map((pergunta) => (
              <div key={pergunta.id} className="rounded-xl bg-white p-5 shadow-sm">
                <form action={salvarPergunta}>
                  <input type="hidden" name="perguntaId" value={pergunta.id} />

                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      Pergunta {pergunta.ordem}
                    </span>

                    <span className="text-xs text-slate-400">
                      {pergunta.tipo}
                    </span>
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Enunciado
                    </label>
                    <input
                      name="titulo"
                      defaultValue={pergunta.titulo}
                      required
                      className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Descrição complementar
                    </label>
                    <input
                      name="descricao"
                      defaultValue={pergunta.descricao ?? ""}
                      placeholder="Opcional"
                      className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="mb-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Tipo da pergunta
                      </label>
                      <select
                        name="tipo"
                        defaultValue={pergunta.tipo}
                        className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                      >
                        <option value="NOTA">Nota de 1 a 5</option>
                        <option value="SIM_NAO">Sim ou Não</option>
                        <option value="TEXTO">Texto curto</option>
                        <option value="TEXTO_LONGO">Texto longo</option>
                        <option value="MULTIPLA_ESCOLHA">
                          Múltipla escolha
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Opções
                      </label>
                      <input
                        name="opcoes"
                        defaultValue={pergunta.opcoes ?? ""}
                        placeholder='Ex: ["Ruim","Bom","Excelente"]'
                        className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <label className="mb-5 flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      name="obrigatoria"
                      defaultChecked={pergunta.obrigatoria}
                    />
                    Pergunta obrigatória
                  </label>

                  <div className="flex items-center justify-between">
                    <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                      Salvar pergunta
                    </button>
                  </div>
                </form>

                <form action={excluirPergunta} className="mt-3">
                  <input type="hidden" name="perguntaId" value={pergunta.id} />
                  <button className="text-sm font-medium text-red-600 hover:text-red-800">
                    Excluir pergunta
                  </button>
                </form>
              </div>
            ))}

            {modelo.perguntas.length === 0 && (
              <div className="rounded-xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                Nenhuma pergunta cadastrada.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
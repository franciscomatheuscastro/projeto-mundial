import { prisma } from "@/src/lib/prisma";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function PesquisaPublicaPage({ params }: PageProps) {
  const { token } = await params;

  const pesquisa = await prisma.pesquisaCliente.findUnique({
    where: { token },
    include: {
      cliente: true,
      modelo: {
        include: {
          perguntas: {
            orderBy: { ordem: "asc" },
          },
        },
      },
    },
  });

  if (!pesquisa) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Pesquisa não encontrada
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Verifique se o link está correto.
          </p>
        </div>
      </main>
    );
  }

  if (pesquisa.status !== "ABERTA") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">
            Pesquisa encerrada
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Esta pesquisa não está mais recebendo respostas.
          </p>
        </div>
      </main>
    );
  }

  const pesquisaId = pesquisa.id;
  const modeloId = pesquisa.modeloId;
  const tokenAtual = token;

  async function enviarResposta(formData: FormData) {
    "use server";

    const nome = String(formData.get("nome") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const setor = String(formData.get("setor") ?? "").trim();
    const cargo = String(formData.get("cargo") ?? "").trim();

    const pesquisaAtual = await prisma.pesquisaCliente.findUnique({
      where: { id: pesquisaId },
    });

    if (!pesquisaAtual || pesquisaAtual.status !== "ABERTA") {
      redirect(`/pesquisa/${tokenAtual}`);
    }

    const perguntas = await prisma.perguntaPesquisa.findMany({
      where: {
        modeloId,
      },
      orderBy: {
        ordem: "asc",
      },
    });

    const resposta = await prisma.respostaPesquisa.create({
      data: {
        pesquisaId,
        nome: nome || null,
        email: email || null,
        setor: setor || null,
        cargo: cargo || null,
      },
    });

    for (const pergunta of perguntas) {
      const valor = String(formData.get(`pergunta_${pergunta.id}`) ?? "").trim();

      if (valor) {
        await prisma.respostaPergunta.create({
          data: {
            respostaId: resposta.id,
            perguntaId: pergunta.id,
            valor,
          },
        });
      }
    }

    redirect(`/pesquisa/${tokenAtual}/obrigado`);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <section className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-blue-600">
            {pesquisa.cliente.empresa || pesquisa.cliente.nome}
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            {pesquisa.titulo}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {pesquisa.descricao ||
              pesquisa.modelo.descricao ||
              "Responda com sinceridade. Suas respostas ajudarão na construção de melhorias."}
          </p>
        </div>

        <form action={enviarResposta} className="space-y-5">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Identificação
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Campo name="nome" label="Nome" placeholder="Opcional" />
              <Campo name="email" label="E-mail" placeholder="Opcional" />
              <Campo name="setor" label="Setor" placeholder="Ex: Operacional" />
              <Campo name="cargo" label="Cargo" placeholder="Ex: Motorista" />
            </div>
          </div>

          {pesquisa.modelo.perguntas.map((pergunta) => (
            <div key={pergunta.id} className="rounded-xl bg-white p-6 shadow-sm">
              <div className="mb-3">
                <p className="text-xs font-medium text-slate-400">
                  Pergunta {pergunta.ordem}
                </p>

                <h3 className="text-base font-semibold text-slate-900">
                  {pergunta.titulo}
                  {pergunta.obrigatoria && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </h3>

                {pergunta.descricao && (
                  <p className="mt-1 text-sm text-slate-500">
                    {pergunta.descricao}
                  </p>
                )}
              </div>

              <CampoResposta pergunta={pergunta} />
            </div>
          ))}

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <button className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700">
              Enviar resposta
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Campo({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        name={name}
        placeholder={placeholder}
        className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
      />
    </div>
  );
}

function CampoResposta({ pergunta }: { pergunta: any }) {
  const name = `pergunta_${pergunta.id}`;

  if (pergunta.tipo === "NOTA") {
    return (
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((nota) => (
          <label
            key={nota}
            className="flex cursor-pointer items-center justify-center rounded-lg border p-3 text-sm font-medium hover:bg-slate-50"
          >
            <input
              type="radio"
              name={name}
              value={String(nota)}
              required={pergunta.obrigatoria}
              className="mr-2"
            />
            {nota}
          </label>
        ))}
      </div>
    );
  }

  if (pergunta.tipo === "SIM_NAO") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {["Sim", "Não"].map((opcao) => (
          <label
            key={opcao}
            className="flex cursor-pointer items-center justify-center rounded-lg border p-3 text-sm font-medium hover:bg-slate-50"
          >
            <input
              type="radio"
              name={name}
              value={opcao}
              required={pergunta.obrigatoria}
              className="mr-2"
            />
            {opcao}
          </label>
        ))}
      </div>
    );
  }

  if (pergunta.tipo === "MULTIPLA_ESCOLHA") {
    let opcoes: string[] = [];

    try {
      opcoes = pergunta.opcoes ? JSON.parse(pergunta.opcoes) : [];
    } catch {
      opcoes = [];
    }

    return (
      <div className="space-y-2">
        {opcoes.map((opcao) => (
          <label
            key={opcao}
            className="flex cursor-pointer items-center rounded-lg border p-3 text-sm font-medium hover:bg-slate-50"
          >
            <input
              type="radio"
              name={name}
              value={opcao}
              required={pergunta.obrigatoria}
              className="mr-2"
            />
            {opcao}
          </label>
        ))}
      </div>
    );
  }

  if (pergunta.tipo === "TEXTO_LONGO") {
    return (
      <textarea
        name={name}
        required={pergunta.obrigatoria}
        rows={5}
        className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
      />
    );
  }

  return (
    <input
      name={name}
      required={pergunta.obrigatoria}
      className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
    />
  );
}
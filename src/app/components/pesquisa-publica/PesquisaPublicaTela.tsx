"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PesquisaPublica } from "@/src/core/model/RespostaPesquisa";
import { useRespostaPesquisaPublica } from "@/src/app/data/hooks/useRespostaPesquisaPublica";

type Props = {
  pesquisa: PesquisaPublica;
};

export default function PesquisaPublicaTela({ pesquisa }: Props) {
  const router = useRouter();
  const { erro, processando, salvarResposta } = useRespostaPesquisaPublica();

  const pesquisaJaRespondida = pesquisa.convite?.respondido === true;

  async function enviarResposta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pesquisaJaRespondida) return;

    const formData = new FormData(event.currentTarget);

    const respostas = pesquisa.perguntas.map((pergunta, index) => ({
      id: `${pergunta.id}-${index}`,
      perguntaId: pergunta.id,
      valor: String(formData.get(`pergunta_${pergunta.id}`) ?? "").trim(),
    }));

    await salvarResposta({
      pesquisaId: pesquisa.id,
      token: pesquisa.token,
      conviteToken: pesquisa.convite?.token ?? null,
      nome: String(formData.get("nome") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      setor: String(formData.get("setor") ?? "").trim() || null,
      cargo: String(formData.get("cargo") ?? "").trim() || null,
      respostas,
    });

    router.push("/pesquisa/obrigado");
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
            Pesquisa
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-600">
            {pesquisa.cliente.empresa || pesquisa.cliente.nome}
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {pesquisa.titulo}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {pesquisa.descricao ||
              pesquisa.modelo.descricao ||
              "Responda com sinceridade. Suas respostas ajudarão na construção de melhorias."}
          </p>
        </div>

        {pesquisaJaRespondida ? (
          <div className="rounded-3xl border border-yellow-100 bg-yellow-50 p-6 text-sm font-semibold leading-6 text-yellow-800 shadow-sm">
            Esta pesquisa já foi respondida por este link. Caso acredite que
            isso seja um erro, entre em contato com a empresa responsável.
          </div>
        ) : (
          <form onSubmit={enviarResposta} className="space-y-5">
            {erro && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {erro}
              </div>
            )}

            <Card
              titulo="Identificação"
              descricao="Essas informações são opcionais."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <Campo name="nome" label="Nome" placeholder="Opcional" />
                <Campo name="email" label="E-mail" placeholder="Opcional" />
                <Campo
                  name="setor"
                  label="Setor"
                  placeholder="Ex: Operacional"
                />
                <Campo name="cargo" label="Cargo" placeholder="Ex: Motorista" />
              </div>
            </Card>

            {pesquisa.perguntas.map((pergunta) => (
              <Card key={pergunta.id}>
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Pergunta {pergunta.ordem}
                  </p>

                  <h3 className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                    {pergunta.titulo}
                    {pergunta.obrigatoria && (
                      <span className="ml-1 text-red-500">*</span>
                    )}
                  </h3>

                  {pergunta.descricao && (
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {pergunta.descricao}
                    </p>
                  )}
                </div>

                <CampoResposta pergunta={pergunta} />
              </Card>
            ))}

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <button
                type="submit"
                disabled={processando}
                className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processando ? "Enviando..." : "Enviar resposta"}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}

function Card({
  titulo,
  descricao,
  children,
}: {
  titulo?: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {titulo && (
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>

          {descricao && (
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {descricao}
            </p>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

function Campo({
  name,
  label,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
            className="flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 p-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
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
            className="flex cursor-pointer items-center justify-center rounded-2xl border border-slate-200 p-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
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
    return (
      <div className="space-y-2">
        {(pergunta.opcoes || []).map((opcao: string) => (
          <label
            key={opcao}
            className="flex cursor-pointer items-center rounded-2xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
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
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    );
  }

  return (
    <input
      name={name}
      required={pergunta.obrigatoria}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    />
  );
}
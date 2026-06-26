"use client";

import { FormEvent } from "react";
import { randomUUID } from "crypto";
import { PesquisaPublica } from "@/src/core/model/RespostaPesquisa";
import { useRespostaPesquisaPublica } from "@/src/app/data/hooks/useRespostaPesquisaPublica";

type Props = {
  pesquisa: PesquisaPublica;
};

export default function PesquisaPublicaTela({ pesquisa }: Props) {
  const { erro, processando, salvarResposta } = useRespostaPesquisaPublica();

  async function enviarResposta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const respostas = pesquisa.perguntas.map((pergunta) => ({
      id: randomUUID(),
      perguntaId: pergunta.id,
      valor: String(formData.get(`pergunta_${pergunta.id}`) ?? "").trim(),
    }));

    await salvarResposta({
      pesquisaId: pesquisa.id,
      token: pesquisa.token,
      nome: String(formData.get("nome") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      setor: String(formData.get("setor") ?? "").trim() || null,
      cargo: String(formData.get("cargo") ?? "").trim() || null,
      respostas,
    });
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

        <form onSubmit={enviarResposta} className="space-y-5">
          {erro && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {erro}
            </div>
          )}

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

          {pesquisa.perguntas.map((pergunta) => (
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
            <button
              disabled={processando}
              className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processando ? "Enviando..." : "Enviar resposta"}
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
    return (
      <div className="space-y-2">
        {pergunta.opcoes.map((opcao: string) => (
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
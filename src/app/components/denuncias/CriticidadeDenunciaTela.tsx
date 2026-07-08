"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { GravidadeDenuncia } from "@prisma/client";
import { useCriticidadeDenuncia } from "@/src/app/data/hooks/useCriticidadeDenuncia";

export default function CriticidadeDenunciaTela() {
  const { regras, carregando, processando, erro, salvarRegra, excluirRegra } =
    useCriticidadeDenuncia();

  const [gravidade, setGravidade] = useState<GravidadeDenuncia>("ALTA");

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    await salvarRegra({
      termo: String(formData.get("termo") || ""),
      categoria: String(formData.get("categoria") || "") || null,
      gravidade,
      ativo: true,
    });

    form.reset();
    setGravidade("ALTA");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Canal de Denúncias
        </p>

        <h1 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
          Regras de criticidade
        </h1>

        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Configure palavras-chave para classificar denúncias automaticamente.
        </p>
      </header>

      <section className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {erro && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        <form
          onSubmit={salvar}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="grid gap-4 lg:grid-cols-4">
            <Campo name="termo" label="Termo-chave" required />
            <Campo name="categoria" label="Categoria" />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Gravidade automática
              </label>

              <select
                value={gravidade}
                onChange={(e) =>
                  setGravidade(e.target.value as GravidadeDenuncia)
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                disabled={processando}
                className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processando ? "Salvando..." : "Salvar regra"}
              </button>
            </div>
          </div>
        </form>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[750px] w-full border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Termo</Th>
                  <Th>Categoria</Th>
                  <Th>Gravidade</Th>
                  <Th>Status</Th>
                  <Th direita>Opções</Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <LinhaVazia texto="Carregando regras..." />
                ) : regras.length === 0 ? (
                  <LinhaVazia texto="Nenhuma regra cadastrada." />
                ) : (
                  regras.map((regra) => (
                    <tr
                      key={regra.id}
                      className="border-t border-slate-100 hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                        {regra.termo}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {regra.categoria || "-"}
                      </td>

                      <td className="px-4 py-4">
                        <Badge texto={regra.gravidade} />
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-700">
                        {regra.ativo ? "Ativa" : "Inativa"}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          disabled={processando}
                          onClick={() => {
                            if (confirm("Deseja excluir esta regra?")) {
                              excluirRegra(regra.id!);
                            }
                          }}
                          className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function Campo({
  name,
  label,
  required,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        name={name}
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

function Th({
  children,
  direita = false,
}: {
  children: ReactNode;
  direita?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 ${
        direita ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Badge({ texto }: { texto: string }) {
  const classe =
    texto === "CRITICA"
      ? "bg-red-100 text-red-700"
      : texto === "ALTA"
      ? "bg-orange-100 text-orange-700"
      : texto === "MEDIA"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-green-100 text-green-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classe}`}>
      {formatarTexto(texto)}
    </span>
  );
}

function LinhaVazia({ texto }: { texto: string }) {
  return (
    <tr>
      <td
        colSpan={5}
        className="px-4 py-12 text-center text-sm text-slate-500"
      >
        {texto}
      </td>
    </tr>
  );
}

function formatarTexto(valor: string) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}
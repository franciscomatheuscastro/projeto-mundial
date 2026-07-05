"use client";

import { FormEvent, useState } from "react";
import { GravidadeDenuncia } from "@prisma/client";
import { useCriticidadeDenuncia } from "@/src/app/data/hooks/useCriticidadeDenuncia";

export default function CriticidadeDenunciaTela() {
  const { regras, carregando, processando, erro, salvarRegra, excluirRegra } =
    useCriticidadeDenuncia();

  const [gravidade, setGravidade] = useState<GravidadeDenuncia>("ALTA");

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    await salvarRegra({
      termo: String(formData.get("termo") || ""),
      categoria: String(formData.get("categoria") || "") || null,
      gravidade,
      ativo: true,
    });

    event.currentTarget.reset();
    setGravidade("ALTA");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-8 py-5">
        <h1 className="text-2xl font-bold text-slate-900">
          Regras de criticidade
        </h1>
        <p className="text-sm text-slate-500">
          Configure palavras-chave para classificar denúncias automaticamente.
        </p>
      </header>

      <section className="space-y-6 px-8 py-8">
        {erro && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        <form onSubmit={salvar} className="rounded-xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <Campo name="termo" label="Termo-chave" required />
            <Campo name="categoria" label="Categoria" />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Gravidade automática
              </label>

              <select
                value={gravidade}
                onChange={(e) =>
                  setGravidade(e.target.value as GravidadeDenuncia)
                }
                className="w-full rounded-lg border px-4 py-3 text-slate-900"
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
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Salvar regra
              </button>
            </div>
          </div>
        </form>

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <table className="w-full border-collapse">
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
                  <tr key={regra.id} className="border-t">
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
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
                        disabled={processando}
                        onClick={() => {
                          if (confirm("Deseja excluir esta regra?")) {
                            excluirRegra(regra.id!);
                          }
                        }}
                        className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-60"
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
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        name={name}
        required={required}
        className="w-full rounded-lg border px-4 py-3 text-slate-900"
      />
    </div>
  );
}

function Th({
  children,
  direita = false,
}: {
  children: React.ReactNode;
  direita?: boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-sm font-semibold text-slate-600 ${
        direita ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Badge({ texto }: { texto: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
      {texto}
    </span>
  );
}

function LinhaVazia({ texto }: { texto: string }) {
  return (
    <tr>
      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
        {texto}
      </td>
    </tr>
  );
}
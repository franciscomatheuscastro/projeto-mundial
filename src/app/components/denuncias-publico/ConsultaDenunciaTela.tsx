"use client";

import { FormEvent, useState } from "react";
import { useDenuncias } from "@/src/app/data/hooks/useDenuncias";

type Props = {
  clienteId: string;
};

export default function CanalDenunciasPublicoTela({ clienteId }: Props) {
  const { criarDenunciaPublica, processando, erro } = useDenuncias(false);
  const [anonima, setAnonima] = useState(true);
  const [protocolo, setProtocolo] = useState<string | null>(null);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const resultado = await criarDenunciaPublica({
      clienteId,
      titulo: String(formData.get("titulo") || ""),
      descricao: String(formData.get("descricao") || ""),
      categoria: String(formData.get("categoria") || "") || null,
      localOcorrido: String(formData.get("localOcorrido") || "") || null,
      dataOcorrido: String(formData.get("dataOcorrido") || "") || null,
      anonima,
      nomeDenunciante: String(formData.get("nomeDenunciante") || "") || null,
      emailDenunciante: String(formData.get("emailDenunciante") || "") || null,
      telefoneDenunciante:
        String(formData.get("telefoneDenunciante") || "") || null,
    });

    setProtocolo(resultado.protocolo ?? null);
    event.currentTarget.reset();
  }

  if (protocolo) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Denúncia registrada
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Guarde este protocolo para acompanhar o andamento:
          </p>

          <div className="mt-5 rounded-xl bg-slate-100 p-4 text-2xl font-bold text-blue-700">
            {protocolo}
          </div>

          <p className="mt-4 text-xs text-slate-500">
            A consulta poderá ser feita informando este protocolo no canal de
            acompanhamento.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <section className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-blue-600">Canal seguro</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Canal de denúncias
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Registre sua denúncia de forma segura. Você pode se identificar ou
            permanecer anônimo.
          </p>
        </div>

        {erro && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        <form onSubmit={enviar} className="space-y-5">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Dados da denúncia
            </h2>

            <div className="grid gap-4">
              <Campo name="titulo" label="Título" required />
              <Campo name="categoria" label="Categoria" placeholder="Opcional" />
              <Campo
                name="localOcorrido"
                label="Local do ocorrido"
                placeholder="Opcional"
              />
              <Campo
                name="dataOcorrido"
                label="Data do ocorrido"
                type="date"
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Descrição
                </label>
                <textarea
                  name="descricao"
                  required
                  rows={6}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Identificação
            </h2>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={anonima}
                onChange={(e) => setAnonima(e.target.checked)}
              />
              Quero fazer a denúncia de forma anônima
            </label>

            {!anonima && (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Campo name="nomeDenunciante" label="Nome" />
                <Campo name="emailDenunciante" label="E-mail" />
                <Campo name="telefoneDenunciante" label="Telefone" />
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <button
              disabled={processando}
              className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {processando ? "Enviando..." : "Registrar denúncia"}
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
  required,
  type = "text",
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
      />
    </div>
  );
}
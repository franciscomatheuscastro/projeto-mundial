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

    const form = event.currentTarget;
    const formData = new FormData(form);

    const resultado = await criarDenunciaPublica({
      clienteId,
      titulo: String(formData.get("titulo") || "").trim(),
      descricao: String(formData.get("descricao") || "").trim(),
      categoria: String(formData.get("categoria") || "").trim() || null,
      localOcorrido: String(formData.get("localOcorrido") || "").trim() || null,
      dataOcorrido: String(formData.get("dataOcorrido") || "").trim() || null,
      anonima,
      nomeDenunciante: anonima
        ? null
        : String(formData.get("nomeDenunciante") || "").trim() || null,
      emailDenunciante: anonima
        ? null
        : String(formData.get("emailDenunciante") || "").trim() || null,
      telefoneDenunciante: anonima
        ? null
        : String(formData.get("telefoneDenunciante") || "").trim() || null,
    });

    setProtocolo(resultado.protocolo ?? null);
    form.reset();
    setAnonima(true);
  }

  if (protocolo) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
            ✓
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Denúncia registrada
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Guarde este protocolo para acompanhar o andamento da denúncia.
          </p>

          <div className="mt-5 rounded-2xl bg-slate-100 p-4 text-2xl font-bold text-blue-700">
            {protocolo}
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            A consulta poderá ser feita informando este protocolo no canal de
            acompanhamento.
          </p>

          <button
            type="button"
            onClick={() => setProtocolo(null)}
            className="mt-6 w-full rounded-2xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Registrar nova denúncia
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
            Canal seguro
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Canal de denúncias
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Registre sua denúncia de forma segura. Você pode se identificar ou
            permanecer anônimo.
          </p>
        </div>

        {erro && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {erro}
          </div>
        )}

        <form onSubmit={enviar} className="space-y-5">
          <Card titulo="Dados da denúncia">
            <div className="grid gap-4 md:grid-cols-2">
              <Campo name="titulo" label="Título" required />
              <Campo name="categoria" label="Categoria" placeholder="Opcional" />
              <Campo
                name="localOcorrido"
                label="Local do ocorrido"
                placeholder="Opcional"
              />
              <Campo name="dataOcorrido" label="Data do ocorrido" type="date" />

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Descrição
                </label>

                <textarea
                  name="descricao"
                  required
                  rows={6}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>
          </Card>

          <Card
            titulo="Identificação"
            descricao="Você pode optar por não informar seus dados pessoais."
          >
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
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
                <Campo name="emailDenunciante" label="E-mail" type="email" />
                <Campo name="telefoneDenunciante" label="Telefone" />
              </div>
            )}
          </Card>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <button
              type="submit"
              disabled={processando}
              className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processando ? "Enviando..." : "Registrar denúncia"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function Card({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
        {descricao && <p className="mt-1 text-sm text-slate-500">{descricao}</p>}
      </div>

      {children}
    </div>
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
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}
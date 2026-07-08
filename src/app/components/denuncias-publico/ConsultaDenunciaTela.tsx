"use client";

import { FormEvent, useState } from "react";
import { useDenuncias } from "@/src/app/data/hooks/useDenuncias";
import { ConsultaDenunciaPublica } from "@/src/core/model/Denuncia";

type Props = {
  clienteId: string;
};

export default function ConsultaDenunciaTela({ clienteId }: Props) {
  const { consultarDenunciaPublica, carregando, erro } = useDenuncias(false);

  const [resultado, setResultado] =
    useState<ConsultaDenunciaPublica | null>(null);

  async function consultar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const protocolo = String(formData.get("protocolo") || "").trim();

    if (!protocolo) return;

    const dados = await consultarDenunciaPublica(clienteId, protocolo);

    setResultado(dados);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
            Consulta segura
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Consultar denúncia
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Informe o protocolo recebido para acompanhar o andamento da denúncia.
          </p>
        </div>

        {erro && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {erro}
          </div>
        )}

        <form
          onSubmit={consultar}
          className="mb-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Protocolo
          </label>

          <input
            name="protocolo"
            required
            placeholder="Ex: DEN-2026-0001"
            className="mb-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Consultando..." : "Consultar protocolo"}
          </button>
        </form>

        {resultado && (
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                  Resultado
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Resultado da consulta
                </h2>
              </div>

              <Badge texto={resultado.status} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Protocolo" valor={resultado.protocolo} />
              <Info label="Status" valor={formatarTexto(resultado.status)} />
              <Info
                label="Criado em"
                valor={new Date(resultado.criadoEm).toLocaleString("pt-BR")}
              />
              <Info
                label="Atualizado em"
                valor={new Date(resultado.atualizadoEm).toLocaleString("pt-BR")}
              />
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-700">
                Resposta pública
              </p>

              <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {resultado.respostaPublica ||
                  "Ainda não há resposta pública registrada."}
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {valor}
      </p>
    </div>
  );
}

function Badge({ texto }: { texto: string }) {
  const classe =
    texto === "CONCLUIDA" || texto === "RESOLVIDA" || texto === "FINALIZADA"
      ? "bg-green-100 text-green-700"
      : texto === "ARQUIVADA" || texto === "CANCELADA"
      ? "bg-red-100 text-red-700"
      : texto === "EM_ANALISE" || texto === "EM_ANDAMENTO"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-blue-100 text-blue-700";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${classe}`}>
      {formatarTexto(texto)}
    </span>
  );
}

function formatarTexto(valor: string) {
  return valor
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}
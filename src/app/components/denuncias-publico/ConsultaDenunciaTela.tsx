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
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <section className="mx-auto max-w-2xl">
        <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-blue-600">
            Consulta segura
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900">
            Consultar denúncia
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Informe o protocolo recebido para acompanhar o andamento da denúncia.
          </p>
        </div>

        {erro && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        <form
          onSubmit={consultar}
          className="mb-6 rounded-xl bg-white p-6 shadow-sm"
        >
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Protocolo
          </label>

          <input
            name="protocolo"
            required
            placeholder="Ex: DEN-2026-0001"
            className="mb-4 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
          />

          <button
            disabled={carregando}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {carregando ? "Consultando..." : "Consultar protocolo"}
          </button>
        </form>

        {resultado && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Resultado da consulta
            </h2>

            <div className="mt-4 grid gap-4">
              <Info label="Protocolo" valor={resultado.protocolo} />
              <Info label="Status" valor={resultado.status} />
              <Info
                label="Criado em"
                valor={new Date(resultado.criadoEm).toLocaleString("pt-BR")}
              />
              <Info
                label="Atualizado em"
                valor={new Date(resultado.atualizadoEm).toLocaleString("pt-BR")}
              />

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Resposta pública
                </p>

                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                  {resultado.respostaPublica ||
                    "Ainda não há resposta pública registrada."}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function Info({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-sm text-slate-900">{valor}</p>
    </div>
  );
}
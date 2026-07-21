"use client";

import type { FormEvent } from "react";

import { useState } from "react";

import { useDenuncias } from "@/src/app/data/hooks/useDenuncias";

import type {
  ConsultaDenunciaPublica,
} from "@/src/core/model/Denuncia";

export default function ConsultaDenunciaTela() {
  const {
    consultarDenunciaPublica,
    carregando,
    erro,
  } = useDenuncias(false);

  const [resultado, setResultado] =
    useState<ConsultaDenunciaPublica | null>(null);

  async function consultar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (carregando) {
      return;
    }

    const formData = new FormData(event.currentTarget);

    const protocolo = String(
      formData.get("protocolo") || ""
    )
      .trim()
      .toUpperCase();

    if (!protocolo) {
      return;
    }

    setResultado(null);

    try {
      const dados =
        await consultarDenunciaPublica(protocolo);

      setResultado(dados);
    } catch {
      // O hook já registra e exibe o erro.
    }
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
            Informe o protocolo recebido para acompanhar o andamento da
            denúncia. As tratativas internas e os dados confidenciais não
            são exibidos nesta consulta.
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
          <label
            htmlFor="protocolo"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Protocolo
          </label>

          <input
            id="protocolo"
            name="protocolo"
            required
            autoComplete="off"
            disabled={carregando}
            placeholder="Ex.: DEN-2026-123456"
            className="mb-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm uppercase text-slate-900 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando
              ? "Consultando..."
              : "Consultar protocolo"}
          </button>
        </form>

        {resultado && (
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                    Resultado
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    Acompanhamento da denúncia
                  </h2>
                </div>

                <Badge texto={resultado.status} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Info
                  label="Protocolo"
                  valor={resultado.protocolo}
                />

                <Info
                  label="Status atual"
                  valor={formatarTexto(resultado.status)}
                />

                <Info
                  label="Registrada em"
                  valor={formatarDataHora(resultado.criadoEm)}
                />

                <Info
                  label="Última atualização"
                  valor={formatarDataHora(resultado.atualizadoEm)}
                />
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-700">
                  Resposta pública
                </p>

                <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {resultado.respostaPublica ||
                    "Ainda não há uma resposta pública registrada."}
                </p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                Histórico
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-900">
                Linha do tempo
              </h2>

              <div className="mt-6">
                {!resultado.historico ||
                resultado.historico.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                    Nenhuma atualização pública foi registrada.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {resultado.historico.map((evento) => (
                      <div
                        key={evento.id}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <p className="text-sm font-semibold text-slate-900">
                            {evento.titulo}
                          </p>

                          <time className="shrink-0 text-xs text-slate-400">
                            {formatarDataHora(evento.criadoEm)}
                          </time>
                        </div>

                        {evento.descricao && (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {evento.descricao}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function Info({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
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

function Badge({
  texto,
}: {
  texto: string;
}) {
  const classe =
    texto === "CONCLUIDA"
      ? "bg-green-100 text-green-700"
      : texto === "ARQUIVADA"
        ? "bg-slate-200 text-slate-700"
        : texto === "EM_TRATATIVA"
          ? "bg-blue-100 text-blue-700"
          : texto === "EM_ANALISE"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${classe}`}
    >
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

function formatarDataHora(data: Date | string) {
  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return "-";
  }

  return valor.toLocaleString("pt-BR");
}

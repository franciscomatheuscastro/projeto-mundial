"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";

import Backend from "@/src/backend";

import type {
  PerguntaCanalDenuncia,
} from "@/src/core/model/PerguntaCanalDenuncia";

export default function PerguntasCanalDenunciaTela() {
  const [perguntas, setPerguntas] =
    useState<PerguntaCanalDenuncia[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState<string | null>(null);

  async function carregar() {
    try {
      setCarregando(true);
      setErro(null);

      setPerguntas(
        await Backend.perguntasCanalDenuncia.obterTodas()
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar perguntas."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  async function excluir(
    id: string
  ) {
    if (
      !window.confirm(
        "Deseja excluir ou desativar esta pergunta?"
      )
    ) {
      return;
    }

    try {
      setErro(null);

      await Backend.perguntasCanalDenuncia.excluir(
        id
      );

      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao excluir pergunta."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
              Canal de denúncias
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-900">
              Perguntas personalizadas
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Configure perguntas adicionais por cliente.
            </p>
          </div>

          <Link
            href="/denuncias/perguntas/nova"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Nova pergunta
          </Link>
        </div>
      </header>

      <section className="px-4 py-6 sm:px-6 lg:px-8">
        {erro && (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {erro}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Ordem</Th>
                  <Th>Pergunta</Th>
                  <Th>Tipo</Th>
                  <Th>Canais</Th>
                  <Th>Status</Th>
                  <Th direita>
                    Opções
                  </Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <Linha
                    colunas={6}
                    texto="Carregando..."
                  />
                ) : perguntas.length ===
                  0 ? (
                  <Linha
                    colunas={6}
                    texto="Nenhuma pergunta cadastrada."
                  />
                ) : (
                  perguntas.map(
                    (pergunta) => {
                      const canais =
                        pergunta.clientes
                          ?.map(
                            (cliente) =>
                              cliente.empresa ||
                              cliente.nome
                          )
                          .filter(Boolean) ||
                        [];

                      return (
                        <tr
                          key={pergunta.id}
                          className="border-t border-slate-100"
                        >
                          <td className="px-4 py-4 text-sm">
                            {pergunta.ordem}
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900">
                              {pergunta.enunciado}
                            </p>

                            {pergunta.obrigatoria && (
                              <p className="mt-1 text-xs font-semibold text-amber-700">
                                Obrigatória
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {formatarTipo(
                              pergunta.tipo
                            )}
                          </td>

                          <td className="px-4 py-4 text-sm text-slate-600">
                            {canais.length > 0
                              ? canais.join(", ")
                              : "-"}
                          </td>

                          <td className="px-4 py-4 text-sm">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                pergunta.ativo
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {pergunta.ativo
                                ? "Ativa"
                                : "Inativa"}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-right">
                            <Link
                              href={`/denuncias/perguntas/${pergunta.id}`}
                              className="mr-3 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                            >
                              Editar
                            </Link>

                            <button
                              type="button"
                              onClick={() =>
                                excluir(
                                  pergunta.id!
                                )
                              }
                              className="text-sm font-semibold text-red-600 transition hover:text-red-800"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
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
        direita
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

function Linha({
  colunas,
  texto,
}: {
  colunas: number;
  texto: string;
}) {
  return (
    <tr>
      <td
        colSpan={colunas}
        className="px-4 py-12 text-center text-sm text-slate-500"
      >
        {texto}
      </td>
    </tr>
  );
}

function formatarTipo(
  tipo: string
) {
  const nomes: Record<string, string> = {
    TEXTO: "Texto curto",
    TEXTO_LONGO: "Texto longo",
    SIM_NAO: "Sim ou não",
    MULTIPLA_ESCOLHA:
      "Múltipla escolha",
  };

  return nomes[tipo] || tipo;
}

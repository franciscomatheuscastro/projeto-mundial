"use client";

import type {
  ReactNode,
} from "react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  aplicarCanaisPerguntasEmMassa,
  excluirPerguntaCanalDenuncia,
  obterTodasPerguntasCanalDenuncia,
} from "@/src/backend/perguntaCanalDenuncia/acoesPerguntasCanalDenuncia";

import type {
  PerguntaCanalDenunciaDto,
} from "@/src/backend/perguntaCanalDenuncia/acoesPerguntasCanalDenuncia";

import {
  useClientes,
} from "@/src/app/data/hooks/useClientes";


export default function PerguntasCanalDenunciaTela() {
  const [
    perguntas,
    setPerguntas,
  ] =
    useState<
      PerguntaCanalDenunciaDto[]
    >(
      []
    );


  const [
    carregando,
    setCarregando,
  ] =
    useState(
      true
    );


  const [
    erro,
    setErro,
  ] =
    useState<string | null>(
      null
    );


  const [
    sucesso,
    setSucesso,
  ] =
    useState<string | null>(
      null
    );


  const [
    selecionadas,
    setSelecionadas,
  ] =
    useState<string[]>(
      []
    );


  const [
    todosCanaisMassa,
    setTodosCanaisMassa,
  ] =
    useState(
      false
    );


  const [
    clienteIdsMassa,
    setClienteIdsMassa,
  ] =
    useState<string[]>(
      []
    );


  const [
    aplicandoMassa,
    setAplicandoMassa,
  ] =
    useState(
      false
    );


  const {
    clientes,
    carregarClientes,
  } =
    useClientes();


  async function carregar() {
    try {
      setCarregando(
        true
      );

      setErro(
        null
      );


      const dados =
        await obterTodasPerguntasCanalDenuncia();


      setPerguntas(
        dados
      );


      setSelecionadas(
        atual =>
          atual.filter(
            id =>
              dados.some(
                pergunta =>
                  pergunta.id ===
                  id
              )
          )
      );
    } catch (
      error
    ) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar perguntas."
      );
    } finally {
      setCarregando(
        false
      );
    }
  }


  useEffect(
    () => {
      void carregar();

      void carregarClientes();
    },
    [
      carregarClientes,
    ]
  );


  const todasSelecionadas =
    perguntas.length >
      0 &&
    perguntas.every(
      pergunta =>
        selecionadas.includes(
          pergunta.id
        )
    );


  const quantidadeSelecionada =
    selecionadas.length;


  const idsClientesDisponiveis =
    useMemo(
      () =>
        clientes.map(
          cliente =>
            cliente.id
        ),
      [
        clientes,
      ]
    );


  function alternarPergunta(
    id: string
  ) {
    setSelecionadas(
      atual =>
        atual.includes(
          id
        )
          ? atual.filter(
              item =>
                item !==
                id
            )
          : [
              ...atual,
              id,
            ]
    );
  }


  function alternarTodasPerguntas() {
    if (
      todasSelecionadas
    ) {
      setSelecionadas(
        []
      );

      return;
    }


    setSelecionadas(
      perguntas.map(
        pergunta =>
          pergunta.id
      )
    );
  }


  function alternarClienteMassa(
    id: string
  ) {
    setTodosCanaisMassa(
      false
    );


    setClienteIdsMassa(
      atual =>
        atual.includes(
          id
        )
          ? atual.filter(
              item =>
                item !==
                id
            )
          : [
              ...atual,
              id,
            ]
    );
  }


  function marcarTodosCanaisMassa(
    marcado: boolean
  ) {
    setTodosCanaisMassa(
      marcado
    );


    if (
      marcado
    ) {
      setClienteIdsMassa(
        []
      );
    }
  }


  async function aplicarEmMassa() {
    if (
      quantidadeSelecionada ===
      0
    ) {
      return;
    }


    if (
      !todosCanaisMassa &&
      clienteIdsMassa.length ===
        0
    ) {
      setErro(
        "Selecione pelo menos um cliente ou marque Todos os canais."
      );

      return;
    }


    try {
      setAplicandoMassa(
        true
      );

      setErro(
        null
      );

      setSucesso(
        null
      );


      await aplicarCanaisPerguntasEmMassa({
        perguntaIds:
          selecionadas,

        todosCanais:
          todosCanaisMassa,

        clienteIds:
          todosCanaisMassa
            ? []
            : clienteIdsMassa,
      });


      setSucesso(
        `${quantidadeSelecionada} pergunta(s) atualizada(s) com sucesso.`
      );


      setSelecionadas(
        []
      );

      setTodosCanaisMassa(
        false
      );

      setClienteIdsMassa(
        []
      );


      await carregar();
    } catch (
      error
    ) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível aplicar os canais em massa."
      );
    } finally {
      setAplicandoMassa(
        false
      );
    }
  }


  async function excluir(
    id: string
  ) {
    if (
      !window.confirm(
        "Deseja excluir esta pergunta? Se ela já possuir respostas, será apenas desativada."
      )
    ) {
      return;
    }


    try {
      setErro(
        null
      );

      setSucesso(
        null
      );


      await excluirPerguntaCanalDenuncia(
        id
      );


      await carregar();
    } catch (
      error
    ) {
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
              Configure perguntas adicionais por cliente ou aplique várias perguntas aos mesmos canais de uma só vez.
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


      <section className="space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        {erro && (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {
              erro
            }
          </div>
        )}


        {sucesso && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {
              sucesso
            }
          </div>
        )}


        {quantidadeSelecionada >
          0 && (
          <section className="rounded-3xl border border-blue-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                  Edição em massa
                </p>

                <h2 className="mt-1 text-lg font-black text-slate-900">
                  {quantidadeSelecionada} pergunta(s) selecionada(s)
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Defina em quais canais todas as perguntas selecionadas deverão aparecer.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelecionadas(
                    []
                  )
                }
                className="text-sm font-bold text-slate-500 hover:text-slate-800"
              >
                Limpar seleção
              </button>
            </div>


            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-blue-200 bg-blue-50 p-4">
              <input
                type="checkbox"
                checked={
                  todosCanaisMassa
                }
                onChange={
                  event =>
                    marcarTodosCanaisMassa(
                      event.target.checked
                    )
                }
                className="mt-1 h-4 w-4 accent-blue-600"
              />

              <span>
                <strong className="block text-sm text-blue-950">
                  Todos os canais, atuais e futuros
                </strong>

                <span className="mt-1 block text-xs leading-5 text-blue-700">
                  As perguntas selecionadas serão exibidas para todos os clientes atuais e também serão atribuídas automaticamente aos novos clientes cadastrados.
                </span>
              </span>
            </label>


            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {clientes.map(
                cliente => (
                  <label
                    key={
                      cliente.id
                    }
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                      todosCanaisMassa
                        ? "border-slate-200 bg-slate-100 opacity-70"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={
                        todosCanaisMassa ||
                        clienteIdsMassa.includes(
                          cliente.id
                        )
                      }
                      disabled={
                        todosCanaisMassa ||
                        aplicandoMassa
                      }
                      onChange={() =>
                        alternarClienteMassa(
                          cliente.id
                        )
                      }
                      className="h-4 w-4 accent-blue-600"
                    />

                    <span className="text-sm font-semibold text-slate-800">
                      {cliente.empresa ||
                        cliente.nome}
                    </span>
                  </label>
                )
              )}
            </div>


            <div className="mt-5 flex justify-end">
              <button
                type="button"
                disabled={
                  aplicandoMassa
                }
                onClick={
                  aplicarEmMassa
                }
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {aplicandoMassa
                  ? "Aplicando..."
                  : "Aplicar canais às perguntas selecionadas"}
              </button>
            </div>
          </section>
        )}


        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px]">
              <thead className="bg-slate-50">
                <tr>
                  <Th>
                    <input
                      type="checkbox"
                      checked={
                        todasSelecionadas
                      }
                      onChange={
                        alternarTodasPerguntas
                      }
                      aria-label="Selecionar todas as perguntas"
                      className="h-4 w-4 accent-blue-600"
                    />
                  </Th>

                  <Th>
                    Ordem
                  </Th>

                  <Th>
                    Pergunta
                  </Th>

                  <Th>
                    Tipo
                  </Th>

                  <Th>
                    Canais
                  </Th>

                  <Th>
                    Visibilidade
                  </Th>

                  <Th>
                    Status
                  </Th>

                  <Th direita>
                    Opções
                  </Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <Linha
                    colunas={
                      8
                    }
                    texto="Carregando..."
                  />
                ) : perguntas.length ===
                  0 ? (
                  <Linha
                    colunas={
                      8
                    }
                    texto="Nenhuma pergunta cadastrada."
                  />
                ) : (
                  perguntas.map(
                    pergunta => (
                      <tr
                        key={
                          pergunta.id
                        }
                        className={`border-t border-slate-100 ${
                          selecionadas.includes(
                            pergunta.id
                          )
                            ? "bg-blue-50/60"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={
                              selecionadas.includes(
                                pergunta.id
                              )
                            }
                            onChange={() =>
                              alternarPergunta(
                                pergunta.id
                              )
                            }
                            aria-label={`Selecionar ${pergunta.enunciado}`}
                            className="h-4 w-4 accent-blue-600"
                          />
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {
                            pergunta.ordem
                          }
                        </td>

                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">
                            {
                              pergunta.enunciado
                            }
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
                          {pergunta.todosCanais ? (
                            <div>
                              <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                                Todos os canais
                              </span>

                              <p className="mt-1 text-xs text-slate-500">
                                Inclui novos clientes automaticamente
                              </p>
                            </div>
                          ) : pergunta.clientes.length >
                            0 ? (
                            pergunta.clientes
                              .map(
                                cliente =>
                                  cliente.empresa ||
                                  cliente.nome
                              )
                              .join(
                                ", "
                              )
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {pergunta.exclusivaMundial ? (
                            <div>
                              <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold text-violet-700">
                                Somente Mundial
                              </span>

                              <p className="mt-1 text-xs text-slate-500">
                                O cliente não visualiza a resposta
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              Mundial e cliente
                            </span>
                          )}
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
                                pergunta.id
                              )
                            }
                            className="text-sm font-semibold text-red-600 transition hover:text-red-800"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    )
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
      {
        children
      }
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
        colSpan={
          colunas
        }
        className="px-4 py-12 text-center text-sm text-slate-500"
      >
        {
          texto
        }
      </td>
    </tr>
  );
}


function formatarTipo(
  tipo: string
) {
  const nomes: Record<
    string,
    string
  > = {
    TEXTO:
      "Texto curto",

    TEXTO_LONGO:
      "Texto longo",

    SIM_NAO:
      "Sim ou não",

    MULTIPLA_ESCOLHA:
      "Múltipla escolha",
  };


  return nomes[tipo] ||
    tipo;
}

"use client";

import Link from "next/link";

import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  StatusPesquisaCliente,
  TipoModuloPesquisa,
} from "@prisma/client";

import {
  useModuloPesquisa,
} from "@/src/app/data/hooks/useModuloPesquisa";


type Props = {
  modo:
    | "lista"
    | "nova"
    | "detalhe"
    | "relatorio";

  tipo:
    TipoModuloPesquisa;

  tituloModulo:
    string;

  baseHref:
    string;

  pesquisaId?:
    string;

  contexto?:
    | "mundial"
    | "cliente";
};


const inputClass =
  "min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";


function montarLink(
  token?: string | null
) {
  if (!token) {
    return "";
  }

  if (
    typeof window ===
    "undefined"
  ) {
    return `/pesquisa/${token}`;
  }

  return `${window.location.origin}/pesquisa/${token}`;
}


export default function PesquisasModuloTela({
  modo,
  tipo,
  tituloModulo,
  baseHref,
  pesquisaId,
  contexto = "mundial",
}: Props) {
  const router =
    useRouter();

  const mundial =
    contexto ===
    "mundial";

  const {
    pesquisas,
    pesquisaSelecionada,
    relatorio,
    dadosFormulario,

    carregando,
    processando,
    erro,

    carregarDadosFormulario,
    carregarPesquisaPorId,
    carregarRelatorio,

    salvar,
    excluir,
    alterarStatus,
    gerarConvites,
  } =
    useModuloPesquisa(
      tipo,
      modo === "lista",
      contexto
    );


  const [
    titulo,
    setTitulo,
  ] =
    useState("");

  const [
    descricao,
    setDescricao,
  ] =
    useState("");

  const [
    clienteId,
    setClienteId,
  ] =
    useState("");

  const [
    modeloId,
    setModeloId,
  ] =
    useState("");

  const [
    quantidadeConvites,
    setQuantidadeConvites,
  ] =
    useState(30);


  useEffect(() => {
    if (
      modo === "nova" &&
      mundial
    ) {
      void carregarDadosFormulario();
    }

    if (
      modo === "detalhe" &&
      pesquisaId
    ) {
      void carregarPesquisaPorId(
        pesquisaId
      );
    }

    if (
      modo === "relatorio" &&
      pesquisaId
    ) {
      void carregarRelatorio(
        pesquisaId
      );
    }
  }, [
    modo,
    pesquisaId,
    mundial,
    carregarDadosFormulario,
    carregarPesquisaPorId,
    carregarRelatorio,
  ]);


  const linkPublico =
    useMemo(
      () =>
        montarLink(
          pesquisaSelecionada?.token
        ),
      [
        pesquisaSelecionada?.token,
      ]
    );


  async function enviar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!mundial) {
      return;
    }

    const resultado =
      await salvar({
        titulo,

        descricao:
          descricao ||
          null,

        clienteId,

        modeloId,
      });

    router.push(
      `${baseHref}/${resultado.id}`
    );

    router.refresh();
  }


  async function excluirAtual(
    id: string
  ) {
    if (!mundial) {
      return;
    }

    if (
      !confirm(
        "Excluir esta aplicação e todas as respostas?"
      )
    ) {
      return;
    }

    await excluir(
      id
    );

    router.push(
      baseHref
    );

    router.refresh();
  }


  async function alternarStatus() {
    if (
      !mundial ||
      !pesquisaSelecionada
    ) {
      return;
    }

    const novo =
      pesquisaSelecionada.status ===
      StatusPesquisaCliente.ABERTA
        ? StatusPesquisaCliente.FECHADA
        : StatusPesquisaCliente.ABERTA;

    await alterarStatus(
      pesquisaSelecionada.id,
      novo
    );
  }


  async function gerarLinks() {
    if (
      !mundial ||
      !pesquisaSelecionada
    ) {
      return;
    }

    const quantidade =
      Math.min(
        500,
        Math.max(
          1,
          Number(
            quantidadeConvites
          ) || 1
        )
      );

    await gerarConvites(
      pesquisaSelecionada.id,
      quantidade
    );
  }


  /*
   * LISTA
   */
  if (
    modo === "lista"
  ) {
    const abertas =
      pesquisas.filter(
        (item) =>
          item.status ===
          "ABERTA"
      ).length;

    const fechadas =
      pesquisas.filter(
        (item) =>
          item.status ===
          "FECHADA"
      ).length;

    const respostas =
      pesquisas.reduce(
        (
          total,
          item
        ) =>
          total +
          (item.totalRespostas ||
            0),
        0
      );


    return (
      <main className="min-h-screen bg-slate-100">
        <Header
          modulo={
            tituloModulo
          }
          titulo={
            mundial
              ? "Aplicações"
              : tituloModulo
          }
          descricao={
            mundial
              ? `Gerencie questionários e resultados de ${tituloModulo.toLowerCase()}.`
              : `Acompanhe os resultados de ${tituloModulo.toLowerCase()} da sua empresa.`
          }
        >
          {mundial && (
            <>
              <Link
                href={`${baseHref}/relatorio`}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Relatório
              </Link>

              <Link
                href={`${baseHref}/nova`}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                + Nova aplicação
              </Link>
            </>
          )}
        </Header>


        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Erro
            mensagem={
              erro
            }
          />


          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              titulo="Aplicações"
              valor={
                pesquisas.length
              }
            />

            <Card
              titulo="Abertas"
              valor={
                abertas
              }
            />

            <Card
              titulo="Fechadas"
              valor={
                fechadas
              }
            />

            <Card
              titulo="Respostas"
              valor={
                respostas
              }
            />
          </div>


          <div className="overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full min-w-[850px]">
              <thead className="bg-slate-50">
                <tr>
                  <Th>
                    Aplicação
                  </Th>

                  {mundial && (
                    <Th>
                      Cliente
                    </Th>
                  )}

                  <Th>
                    Modelo
                  </Th>

                  <Th>
                    Respostas
                  </Th>

                  <Th>
                    Status
                  </Th>

                  <Th direita>
                    Ações
                  </Th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <Vazia
                    colSpan={
                      mundial
                        ? 6
                        : 5
                    }
                    texto="Carregando..."
                  />
                ) : pesquisas.length ===
                  0 ? (
                  <Vazia
                    colSpan={
                      mundial
                        ? 6
                        : 5
                    }
                    texto="Nenhuma aplicação encontrada."
                  />
                ) : (
                  pesquisas.map(
                    (
                      pesquisa
                    ) => (
                      <tr
                        key={
                          pesquisa.id
                        }
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-4 font-bold text-slate-900">
                          {
                            pesquisa.titulo
                          }
                        </td>

                        {mundial && (
                          <td className="px-4 py-4 text-sm text-slate-700">
                            {
                              pesquisa.cliente
                                ?.nome
                            }
                          </td>
                        )}

                        <td className="px-4 py-4 text-sm text-slate-700">
                          {
                            pesquisa.modelo
                              ?.titulo
                          }
                        </td>

                        <td className="px-4 py-4 font-bold text-slate-700">
                          {
                            pesquisa.totalRespostas
                          }
                        </td>

                        <td className="px-4 py-4">
                          <Status
                            valor={
                              pesquisa.status
                            }
                          />
                        </td>

                        <td className="px-4 py-4 text-right">
                          <Link
                            href={`${baseHref}/${pesquisa.id}`}
                            className="text-sm font-bold text-blue-600 hover:text-blue-700"
                          >
                            Abrir
                          </Link>

                          <Link
                            href={`${baseHref}/${pesquisa.id}/relatorio`}
                            className="ml-4 text-sm font-bold text-slate-700 hover:text-slate-900"
                          >
                            Relatório
                          </Link>

                          {mundial && (
                            <button
                              type="button"
                              disabled={
                                processando
                              }
                              onClick={() =>
                                void excluirAtual(
                                  pesquisa.id
                                )
                              }
                              className="ml-4 text-sm font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                            >
                              Excluir
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    );
  }


  /*
   * NOVA
   */
  if (
    modo === "nova"
  ) {
    if (!mundial) {
      return (
        <main className="min-h-screen bg-slate-100">
          <Header
            modulo={
              tituloModulo
            }
            titulo="Acesso restrito"
            descricao="A criação de aplicações é realizada pela Mundial RH."
          >
            <Link
              href={
                baseHref
              }
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
            >
              Voltar
            </Link>
          </Header>
        </main>
      );
    }


    return (
      <main className="min-h-screen bg-slate-100">
        <Header
          modulo={
            tituloModulo
          }
          titulo="Nova aplicação"
          descricao="Selecione cliente e modelo de questionário."
        >
          <Link
            href={
              baseHref
            }
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
          >
            Voltar
          </Link>
        </Header>


        <section className="mx-auto max-w-3xl px-4 py-6">
          <form
            onSubmit={
              enviar
            }
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
          >
            <Erro
              mensagem={
                erro
              }
            />

            <Campo
              label="Título"
              value={
                titulo
              }
              onChange={
                setTitulo
              }
            />

            <Select
              label="Cliente"
              value={
                clienteId
              }
              onChange={
                setClienteId
              }
            >
              <option value="">
                Selecione
              </option>

              {dadosFormulario.clientes.map(
                (
                  cliente: any
                ) => (
                  <option
                    key={
                      cliente.id
                    }
                    value={
                      cliente.id
                    }
                  >
                    {
                      cliente.nome
                    }
                  </option>
                )
              )}
            </Select>

            <Select
              label="Modelo"
              value={
                modeloId
              }
              onChange={
                setModeloId
              }
            >
              <option value="">
                Selecione
              </option>

              {dadosFormulario.modelos.map(
                (
                  modelo: any
                ) => (
                  <option
                    key={
                      modelo.id
                    }
                    value={
                      modelo.id
                    }
                  >
                    {
                      modelo.titulo
                    }{" "}
                    (
                    {
                      modelo.perguntas
                        ?.length ||
                      0
                    }{" "}
                    perguntas)
                  </option>
                )
              )}
            </Select>

            <Area
              label="Descrição"
              value={
                descricao
              }
              onChange={
                setDescricao
              }
            />

            {dadosFormulario.modelos.length ===
              0 &&
              !carregando && (
                <div className="mb-5 rounded-2xl bg-yellow-50 p-4 text-sm font-bold text-yellow-800">
                  Não há modelos ativos deste tipo. Crie um no Construtor de Modelos.
                </div>
              )}

            <button
              type="submit"
              disabled={
                processando ||
                !titulo ||
                !clienteId ||
                !modeloId
              }
              className="min-h-12 w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {processando
                ? "Gerando..."
                : "Gerar aplicação"}
            </button>
          </form>
        </section>
      </main>
    );
  }


  /*
   * DETALHE
   */
  if (
    modo === "detalhe"
  ) {
    return (
      <main className="min-h-screen bg-slate-100">
        <Header
          modulo={
            tituloModulo
          }
          titulo={
            pesquisaSelecionada
              ?.titulo ||
            "Carregando..."
          }
          descricao={
            pesquisaSelecionada
              ? mundial
                ? `${pesquisaSelecionada.cliente?.nome || ""} · ${pesquisaSelecionada.modelo?.titulo || ""}`
                : pesquisaSelecionada.modelo?.titulo ||
                  tituloModulo
              : "Carregando aplicação..."
          }
        >
          <Link
            href={
              baseHref
            }
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
          >
            Voltar
          </Link>
        </Header>


        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[380px_1fr]">
          <Erro
            mensagem={
              erro
            }
          />

          {!pesquisaSelecionada ? (
            <div className="rounded-3xl bg-white p-10 text-center lg:col-span-2">
              {carregando
                ? "Carregando..."
                : "Aplicação não encontrada."}
            </div>
          ) : (
            <>
              <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-lg font-black text-slate-900">
                  {mundial
                    ? "Painel"
                    : "Resumo"}
                </h2>


                {mundial && (
                  <>
                    <div className="mb-4 break-all rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                      {
                        linkPublico
                      }
                    </div>

                    <a
                      href={
                        linkPublico
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-3 block rounded-2xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white"
                    >
                      Abrir questionário
                    </a>
                  </>
                )}


                <Link
                  href={`${baseHref}/${pesquisaSelecionada.id}/relatorio`}
                  className="mb-5 block rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white"
                >
                  Ver relatório
                </Link>


                <div className="grid grid-cols-2 gap-3">
                  <Info
                    titulo="Respostas"
                    valor={String(
                      pesquisaSelecionada.totalRespostas ||
                        0
                    )}
                  />

                  {mundial && (
                    <>
                      <Info
                        titulo="Convites"
                        valor={String(
                          pesquisaSelecionada.totalConvites ||
                            0
                        )}
                      />

                      <Info
                        titulo="Respondidos"
                        valor={String(
                          pesquisaSelecionada.totalConvitesRespondidos ||
                            0
                        )}
                      />
                    </>
                  )}

                  <Info
                    titulo="Perguntas"
                    valor={String(
                      pesquisaSelecionada.perguntas
                        ?.length ||
                        0
                    )}
                  />

                  {!mundial && (
                    <Info
                      titulo="Status"
                      valor={
                        pesquisaSelecionada.status
                      }
                    />
                  )}
                </div>


                {mundial && (
                  <button
                    type="button"
                    disabled={
                      processando
                    }
                    onClick={() =>
                      void alternarStatus()
                    }
                    className="mt-5 min-h-12 w-full rounded-2xl bg-slate-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {pesquisaSelecionada.status ===
                    "ABERTA"
                      ? "Fechar aplicação"
                      : "Reabrir aplicação"}
                  </button>
                )}
              </aside>


              <div className="space-y-6">
                {mundial && (
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h2 className="text-lg font-black text-slate-900">
                      Links individuais
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Cada link individual pode ser respondido uma única vez.
                    </p>

                    <div className="mt-4 flex gap-3">
                      <input
                        type="number"
                        min={
                          1
                        }
                        max={
                          500
                        }
                        value={
                          quantidadeConvites
                        }
                        onChange={(
                          event
                        ) =>
                          setQuantidadeConvites(
                            Number(
                              event.target
                                .value
                            )
                          )
                        }
                        className={
                          inputClass
                        }
                      />

                      <button
                        type="button"
                        disabled={
                          processando
                        }
                        onClick={() =>
                          void gerarLinks()
                        }
                        className="rounded-2xl bg-blue-600 px-5 font-bold text-white disabled:opacity-50"
                      >
                        {processando
                          ? "Gerando..."
                          : "Gerar"}
                      </button>
                    </div>


                    {pesquisaSelecionada
                      .convites
                      ?.length >
                      0 && (
                      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
                        {pesquisaSelecionada.convites.map(
                          (
                            convite: any
                          ) => {
                            const link =
                              montarLink(
                                convite.token
                              );

                            return (
                              <div
                                key={
                                  convite.id
                                }
                                className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm text-slate-600">
                                    {
                                      link
                                    }
                                  </p>
                                </div>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                                    convite.respondido
                                      ? "bg-green-100 text-green-700"
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}
                                >
                                  {convite.respondido
                                    ? "Respondido"
                                    : "Pendente"}
                                </span>

                                <a
                                  href={
                                    link
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-bold text-blue-600"
                                >
                                  Abrir
                                </a>
                              </div>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                )}


                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <h2 className="mb-4 text-lg font-black text-slate-900">
                    Perguntas
                  </h2>

                  <div className="space-y-3">
                    {pesquisaSelecionada.perguntas
                      ?.length >
                    0 ? (
                      pesquisaSelecionada.perguntas.map(
                        (
                          pergunta: any
                        ) => (
                          <div
                            key={
                              pergunta.id
                            }
                            className="rounded-2xl border border-slate-200 p-4"
                          >
                            <p className="text-xs font-bold text-slate-400">
                              Pergunta{" "}
                              {
                                pergunta.ordem
                              }{" "}
                              ·{" "}
                              {
                                pergunta.tipo
                              }
                            </p>

                            <p className="mt-1 font-bold text-slate-900">
                              {
                                pergunta.titulo
                              }
                            </p>

                            {pergunta.descricao && (
                              <p className="mt-2 text-sm text-slate-500">
                                {
                                  pergunta.descricao
                                }
                              </p>
                            )}
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-sm text-slate-500">
                        Nenhuma pergunta encontrada.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    );
  }


  /*
   * RELATÓRIO INDIVIDUAL
   */
  return (
    <main className="min-h-screen bg-slate-100">
      <Header
        modulo={
          tituloModulo
        }
        titulo="Relatório da aplicação"
        descricao={
          relatorio
            ? mundial
              ? `${relatorio.titulo} · ${relatorio.cliente?.nome || ""}`
              : relatorio.titulo
            : "Carregando relatório..."
        }
      >
        <Link
          href={`${baseHref}/${pesquisaId}`}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
        >
          Voltar
        </Link>
      </Header>


      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Erro
          mensagem={
            erro
          }
        />

        {!relatorio ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            {carregando
              ? "Carregando..."
              : "Relatório não encontrado."}
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <Card
                titulo="Respostas"
                valor={
                  relatorio.totalRespostas ||
                  0
                }
              />

              <Card
                titulo="Perguntas"
                valor={
                  relatorio.perguntas
                    ?.length ||
                  0
                }
              />

              <Card
                titulo="Média geral"
                valor={
                  Number(
                    relatorio.mediaGeral ||
                      0
                  ).toFixed(
                    1
                  )
                }
              />
            </div>


            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-5 text-lg font-black text-slate-900">
                Resultado por pergunta
              </h2>


              {relatorio.perguntasComResumo
                ?.length >
              0 ? (
                <div className="space-y-4">
                  {relatorio.perguntasComResumo.map(
                    (
                      item: any
                    ) => (
                      <div
                        key={
                          item.pergunta.id
                        }
                        className="rounded-2xl border border-slate-200 p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Pergunta{" "}
                              {
                                item.pergunta
                                  .ordem
                              }{" "}
                              ·{" "}
                              {
                                item.pergunta
                                  .tipo
                              }
                            </p>

                            <h3 className="mt-1 font-bold text-slate-900">
                              {
                                item.pergunta
                                  .titulo
                              }
                            </h3>
                          </div>

                          <div className="flex gap-2">
                            <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
                              {
                                item.totalRespostas
                              }{" "}
                              respostas
                            </span>

                            {item.pergunta
                              .tipo ===
                              "NOTA" && (
                              <span className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700">
                                Média{" "}
                                {Number(
                                  item.media ||
                                    0
                                ).toFixed(
                                  1
                                )}
                              </span>
                            )}
                          </div>
                        </div>


                        {item.pergunta
                          .tipo !==
                          "NOTA" &&
                          item.respostas
                            ?.length >
                            0 && (
                            <div className="mt-4 space-y-2">
                              {item.respostas.map(
                                (
                                  resposta: any,
                                  index: number
                                ) => (
                                  <div
                                    key={
                                      resposta.id ||
                                      index
                                    }
                                    className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700"
                                  >
                                    {
                                      resposta.valor
                                    }
                                  </div>
                                )
                              )}
                            </div>
                          )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Ainda não existem respostas para esta aplicação.
                </p>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}


function Header({
  modulo,
  titulo,
  descricao,
  children,
}: {
  modulo: string;
  titulo: string;
  descricao: string;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
            {
              modulo
            }
          </p>

          <h1 className="mt-2 text-2xl font-black text-slate-900">
            {
              titulo
            }
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {
              descricao
            }
          </p>
        </div>

        {children && (
          <div className="flex flex-wrap gap-3">
            {
              children
            }
          </div>
        )}
      </div>
    </header>
  );
}


function Card({
  titulo,
  valor,
}: {
  titulo: string;
  valor:
    | string
    | number;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-bold text-slate-500">
        {
          titulo
        }
      </p>

      <p className="mt-2 text-3xl font-black text-slate-900">
        {
          valor
        }
      </p>
    </div>
  );
}


function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-500">
        {
          titulo
        }
      </p>

      <p className="mt-1 break-words font-black text-slate-900">
        {
          valor
        }
      </p>
    </div>
  );
}


function Status({
  valor,
}: {
  valor: string;
}) {
  const classe =
    valor === "ABERTA"
      ? "bg-green-100 text-green-700"
      : valor === "FECHADA"
        ? "bg-slate-200 text-slate-700"
        : "bg-yellow-100 text-yellow-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${classe}`}
    >
      {
        valor
      }
    </span>
  );
}


function Erro({
  mensagem,
}: {
  mensagem?: string | null;
}) {
  if (!mensagem) {
    return null;
  }

  return (
    <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
      {
        mensagem
      }
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
      className={`px-4 py-4 text-left text-sm font-bold text-slate-600 ${
        direita
          ? "text-right"
          : ""
      }`}
    >
      {
        children
      }
    </th>
  );
}


function Vazia({
  colSpan,
  texto,
}: {
  colSpan: number;
  texto: string;
}) {
  return (
    <tr>
      <td
        colSpan={
          colSpan
        }
        className="px-6 py-12 text-center text-sm text-slate-500"
      >
        {
          texto
        }
      </td>
    </tr>
  );
}


function Campo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange:
    (
      valor: string
    ) => void;
}) {
  return (
    <label className="mb-5 block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {
          label
        }
      </span>

      <input
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className={
          inputClass
        }
      />
    </label>
  );
}


function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange:
    (
      valor: string
    ) => void;
}) {
  return (
    <label className="mb-5 block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {
          label
        }
      </span>

      <textarea
        rows={
          4
        }
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className={
          inputClass
        }
      />
    </label>
  );
}


function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange:
    (
      valor: string
    ) => void;
  children: ReactNode;
}) {
  return (
    <label className="mb-5 block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {
          label
        }
      </span>

      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className={
          inputClass
        }
      >
        {
          children
        }
      </select>
    </label>
  );
}
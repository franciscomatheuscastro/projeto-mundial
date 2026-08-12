"use client";

import Link from "next/link";

import {
  FormEvent,
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

  pesquisaId?: string;
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
}: Props) {
  const router =
    useRouter();

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
      modo === "lista"
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
      modo === "nova"
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
    const confirmado =
      confirm(
        "Excluir esta aplicação e todas as respostas?"
      );

    if (
      !confirmado
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

    await carregarPesquisaPorId(
      pesquisaSelecionada.id
    );

    router.refresh();
  }

  async function gerarLinks() {
    if (
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

    setQuantidadeConvites(
      quantidade
    );

    await gerarConvites(
      pesquisaSelecionada.id,
      quantidade
    );

    await carregarPesquisaPorId(
      pesquisaSelecionada.id
    );

    router.refresh();
  }

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
          item.totalRespostas,
        0
      );

    return (
      <main className="min-h-screen bg-slate-100">
        <Header
          modulo={
            tituloModulo
          }
          titulo="Aplicações"
          descricao={`Gerencie questionários e resultados de ${tituloModulo.toLowerCase()}.`}
        >
          <Link
            href={`${baseHref}/relatorio`}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
          >
            Relatório
          </Link>

          <Link
            href={`${baseHref}/nova`}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
          >
            + Nova aplicação
          </Link>
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
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50">
                <tr>
                  <Th>
                    Aplicação
                  </Th>

                  <Th>
                    Cliente
                  </Th>

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
                      6
                    }
                    texto="Carregando..."
                  />
                ) : pesquisas.length ===
                  0 ? (
                  <Vazia
                    colSpan={
                      6
                    }
                    texto="Nenhuma aplicação cadastrada."
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

                        <td className="px-4 py-4 text-sm text-slate-700">
                          {
                            pesquisa.cliente.nome
                          }
                        </td>

                        <td className="px-4 py-4 text-sm text-slate-700">
                          {
                            pesquisa.modelo.titulo
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
                            className="text-sm font-bold text-blue-600"
                          >
                            Abrir
                          </Link>

                          <Link
                            href={`${baseHref}/${pesquisa.id}/relatorio`}
                            className="ml-4 text-sm font-bold text-slate-700"
                          >
                            Relatório
                          </Link>

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
                            className="ml-4 text-sm font-bold text-red-600"
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
        </section>
      </main>
    );
  }

  if (
    modo === "nova"
  ) {
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
                      modelo.perguntas.length
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

  if (
    modo === "detalhe"
  ) {
    const convites =
      pesquisaSelecionada?.convites ||
      [];

    const totalConvites =
      pesquisaSelecionada?.totalConvites ??
      convites.length;

    const totalConvitesRespondidos =
      pesquisaSelecionada?.totalConvitesRespondidos ??
      convites.filter(
        (
          convite: any
        ) =>
          convite.respondido
      ).length;

    return (
      <main className="min-h-screen bg-slate-100">
        <Header
          modulo={
            tituloModulo
          }
          titulo={
            pesquisaSelecionada?.titulo ||
            "Carregando..."
          }
          descricao={
            pesquisaSelecionada
              ? `${pesquisaSelecionada.cliente.nome} · ${pesquisaSelecionada.modelo.titulo}`
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
          <div className="lg:col-span-2">
            <Erro
              mensagem={
                erro
              }
            />
          </div>

          {!pesquisaSelecionada ||
          carregando ? (
            <div className="lg:col-span-2 rounded-3xl bg-white p-10 text-center">
              Carregando...
            </div>
          ) : (
            <>
              <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-lg font-black">
                  Painel
                </h2>

                <div className="mb-4 break-all rounded-2xl bg-slate-50 p-4 text-sm">
                  {
                    linkPublico
                  }
                </div>

                {linkPublico && (
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
                )}

                <Link
                  href={`${baseHref}/${pesquisaSelecionada.id}/relatorio`}
                  className="mb-5 block rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white"
                >
                  Ver relatório
                </Link>

                <div className="grid grid-cols-2 gap-3">
                  <Info
                    titulo="Status"
                    valor={
                      pesquisaSelecionada.status
                    }
                  />

                  <Info
                    titulo="Respostas"
                    valor={String(
                      pesquisaSelecionada.totalRespostas
                    )}
                  />

                  <Info
                    titulo="Convites"
                    valor={String(
                      totalConvites
                    )}
                  />

                  <Info
                    titulo="Respondidos"
                    valor={String(
                      totalConvitesRespondidos
                    )}
                  />

                  <Info
                    titulo="Perguntas"
                    valor={String(
                      pesquisaSelecionada.perguntas.length
                    )}
                  />

                  <Info
                    titulo="Cliente"
                    valor={
                      pesquisaSelecionada.cliente.nome
                    }
                  />
                </div>

                <button
                  type="button"
                  disabled={
                    processando
                  }
                  onClick={() =>
                    void alternarStatus()
                  }
                  className={`mt-5 min-h-12 w-full rounded-2xl px-4 py-3 text-sm font-bold text-white disabled:opacity-60 ${
                    pesquisaSelecionada.status ===
                    StatusPesquisaCliente.ABERTA
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {pesquisaSelecionada.status ===
                  StatusPesquisaCliente.ABERTA
                    ? "Fechar aplicação"
                    : "Reabrir aplicação"}
                </button>
              </aside>

              <div className="space-y-6">
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
                  <div className="mb-4">
                    <h2 className="text-lg font-black text-slate-900">
                      Links individuais
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Cada link individual só pode ser respondido uma vez.
                    </p>
                  </div>

                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Quantidade de links
                      </label>

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
                            Math.min(
                              500,
                              Math.max(
                                1,
                                Number(
                                  event.target.value
                                ) || 1
                              )
                            )
                          )
                        }
                        className={
                          inputClass
                        }
                      />
                    </div>

                    <button
                      type="button"
                      disabled={
                        processando
                      }
                      onClick={() =>
                        void gerarLinks()
                      }
                      className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processando
                        ? "Gerando..."
                        : "Gerar links"}
                    </button>
                  </div>

                  {convites.length ===
                  0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
                      Nenhum link individual foi gerado para esta aplicação.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full min-w-[720px] border-collapse">
                        <thead className="bg-slate-50">
                          <tr>
                            <Th>
                              Participante
                            </Th>

                            <Th>
                              Status
                            </Th>

                            <Th>
                              Link
                            </Th>
                          </tr>
                        </thead>

                        <tbody>
                          {convites.map(
                            (
                              convite: any
                            ) => {
                              const linkConvite =
                                montarLink(
                                  convite.token
                                );

                              return (
                                <tr
                                  key={
                                    convite.id
                                  }
                                  className="border-t border-slate-100"
                                >
                                  <td className="px-4 py-4">
                                    <div className="text-sm font-bold text-slate-900">
                                      {convite.nome ||
                                        "Participante"}
                                    </div>

                                    <div className="text-xs text-slate-500">
                                      {convite.email ||
                                        convite.setor ||
                                        "Sem identificação"}
                                    </div>
                                  </td>

                                  <td className="px-4 py-4">
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
                                  </td>

                                  <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="max-w-[380px] truncate text-xs text-slate-500">
                                        {
                                          linkConvite
                                        }
                                      </div>

                                      <a
                                        href={
                                          linkConvite
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 text-sm font-bold text-blue-600 hover:text-blue-800"
                                      >
                                        Abrir
                                      </a>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <h2 className="mb-4 text-lg font-black">
                    Perguntas
                  </h2>

                  <div className="space-y-3">
                    {pesquisaSelecionada.perguntas.map(
                      (
                        pergunta: any
                      ) => (
                        <div
                          key={
                            pergunta.id
                          }
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
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
                            <p className="mt-1 text-sm text-slate-500">
                              {
                                pergunta.descricao
                              }
                            </p>
                          )}

                          {Array.isArray(
                            pergunta.opcoes
                          ) &&
                            pergunta.opcoes.length >
                              0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {pergunta.opcoes.map(
                                  (
                                    opcao: string,
                                    index: number
                                  ) => (
                                    <span
                                      key={`${pergunta.id}-${index}`}
                                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                                    >
                                      {
                                        opcao
                                      }
                                    </span>
                                  )
                                )}
                              </div>
                            )}
                        </div>
                      )
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

  return (
    <main className="min-h-screen bg-slate-100">
      <Header
        modulo={
          tituloModulo
        }
        titulo="Relatório da aplicação"
        descricao={
          relatorio
            ? `${relatorio.titulo} · ${relatorio.cliente.nome}`
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

      <section className="mx-auto max-w-7xl px-4 py-6">
        <Erro
          mensagem={
            erro
          }
        />

        {!relatorio ||
        carregando ? (
          <div className="rounded-3xl bg-white p-10 text-center">
            Carregando...
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <Card
                titulo="Respostas"
                valor={
                  relatorio.totalRespostas
                }
              />

              <Card
                titulo="Perguntas"
                valor={
                  relatorio.perguntas.length
                }
              />

              <Card
                titulo="Média geral"
                valor={
                  Number(
                    relatorio.mediaGeral
                  ).toFixed(
                    1
                  )
                }
              />
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-2 text-lg font-black">
                Indicadores consolidados
              </h2>

              <p className="mb-6 text-sm text-slate-500">
                Resultados agregados para preservar a confidencialidade dos participantes.
              </p>

              <div className="space-y-5">
                {relatorio.perguntasComResumo.map(
                  (
                    item: any,
                    index: number
                  ) => (
                    <div
                      key={
                        item.pergunta.id
                      }
                      className="rounded-2xl border border-slate-200 p-5"
                    >
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="font-black">
                            {index +
                              1}
                            .{" "}
                            {
                              item.pergunta.titulo
                            }
                          </p>

                          <p className="text-sm text-slate-500">
                            {
                              item.totalRespostas
                            }{" "}
                            respostas
                          </p>
                        </div>

                        {item.pergunta.tipo ===
                          "NOTA" && (
                          <div className="rounded-xl bg-slate-50 px-4 py-2">
                            <span className="text-xs text-slate-500">
                              Média
                            </span>

                            <strong className="block text-xl">
                              {Number(
                                item.media
                              ).toFixed(
                                1
                              )}
                            </strong>
                          </div>
                        )}
                      </div>

                      <Distribuicao
                        respostas={
                          item.respostas
                        }
                      />
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Distribuicao({
  respostas,
}: {
  respostas: {
    valor: string;
  }[];
}) {
  const mapa =
    new Map<
      string,
      number
    >();

  respostas.forEach(
    (
      item
    ) => {
      const valor =
        item.valor ||
        "Sem resposta";

      mapa.set(
        valor,
        (mapa.get(
          valor
        ) ||
          0) +
          1
      );
    }
  );

  return (
    <div className="mt-4 space-y-2">
      {Array.from(
        mapa.entries()
      ).map(
        ([
          valor,
          quantidade,
        ]) => {
          const percentual =
            respostas.length >
            0
              ? (quantidade /
                  respostas.length) *
                100
              : 0;

          return (
            <div
              key={
                valor
              }
            >
              <div className="flex justify-between text-sm">
                <span>
                  {
                    valor
                  }
                </span>

                <strong>
                  {percentual.toFixed(
                    1
                  )}
                  %
                </strong>
              </div>

              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{
                    width: `${percentual}%`,
                  }}
                />
              </div>
            </div>
          );
        }
      )}
    </div>
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
  children?: React.ReactNode;
}) {
  return (
    <header className="bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
            {
              modulo
            }
          </p>

          <h1 className="mt-1 text-2xl font-black text-slate-900">
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

        <div className="flex flex-wrap gap-3">
          {
            children
          }
        </div>
      </div>
    </header>
  );
}

function Campo({
  label,
  value,
  onChange,
}: any) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-sm font-semibold">
        {
          label
        }
      </label>

      <input
        required
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className={
          inputClass
        }
      />
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
}: any) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-sm font-semibold">
        {
          label
        }
      </label>

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
            event.target.value
          )
        }
        className={
          inputClass
        }
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: any) {
  return (
    <div className="mb-5">
      <label className="mb-2 block text-sm font-semibold">
        {
          label
        }
      </label>

      <select
        required
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
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
    </div>
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
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold text-slate-500">
        {
          titulo
        }
      </p>

      <strong className="mt-2 block text-3xl font-black">
        {
          valor
        }
      </strong>
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
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">
        {
          titulo
        }
      </p>

      <strong className="break-words text-sm text-slate-900">
        {
          valor
        }
      </strong>
    </div>
  );
}

function Status({
  valor,
}: {
  valor: string;
}) {
  const classes =
    valor ===
    "ABERTA"
      ? "bg-green-100 text-green-700"
      : valor ===
        "FECHADA"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${classes}`}
    >
      {
        valor
      }
    </span>
  );
}

function Th({
  children,
  direita,
}: {
  children:
    React.ReactNode;

  direita?:
    boolean;
}) {
  return (
    <th
      className={`px-4 py-3 text-sm font-bold text-slate-600 ${
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

function Vazia({
  colSpan,
  texto,
}: {
  colSpan:
    number;

  texto:
    string;
}) {
  return (
    <tr>
      <td
        colSpan={
          colSpan
        }
        className="px-4 py-10 text-center text-sm text-slate-500"
      >
        {
          texto
        }
      </td>
    </tr>
  );
}

function Erro({
  mensagem,
}: {
  mensagem:
    | string
    | null;
}) {
  if (
    !mensagem
  ) {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
      {
        mensagem
      }
    </div>
  );
}
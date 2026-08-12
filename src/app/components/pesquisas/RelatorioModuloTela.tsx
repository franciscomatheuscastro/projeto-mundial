"use client";

import Link from "next/link";

type DadosRelatorio = {
  filtros: {
    dataInicio: string | null;
    dataFim: string | null;
    clienteId: string | null;
  };

  clientes: {
    id: string;
    nome: string;
    empresa: string | null;
  }[];

  resumo: {
    totalPesquisas: number;
    totalAbertas: number;
    totalFechadas: number;
    totalArquivadas: number;
    totalRespostas: number;
    totalConvites: number;
    totalConvitesRespondidos: number;
    taxaParticipacao: number | null;
    mediaGeral: number | null;
  };

  porCliente: {
    clienteId: string;
    clienteNome: string;
    empresa: string | null;

    totalPesquisas: number;
    totalRespostas: number;

    totalConvites: number;
    totalConvitesRespondidos: number;

    taxaParticipacao: number | null;
    mediaGeral: number | null;
  }[];

  pesquisas: {
    id: string;
    titulo: string;
    status: string;
    criadoEm: Date | string;

    cliente: {
      id: string;
      nome: string;
      empresa: string | null;
    };

    modelo: {
      id: string;
      titulo: string;
    };

    totalRespostas: number;

    totalConvites: number;

    totalConvitesRespondidos: number;

    taxaParticipacao: number | null;

    mediaGeral: number | null;
  }[];
};

export default function RelatorioModuloTela({
  dados,
  tituloModulo,
  baseHref,
}: {
  dados: DadosRelatorio;

  tituloModulo: string;

  baseHref: string;
}) {
  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-5 shadow-sm sm:px-6 lg:px-8 print:shadow-none">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
              {tituloModulo}
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-900">
              Relatório Consolidado
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Indicadores gerenciais das aplicações realizadas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 print:hidden">
            <Link
              href={
                baseHref
              }
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Voltar
            </Link>

            <button
              type="button"
              onClick={() =>
                window.print()
              }
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
            >
              Imprimir
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <form
          method="get"
          className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 print:hidden sm:p-6"
        >
          <div className="mb-4">
            <h2 className="text-lg font-black text-slate-900">
              Filtros
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Filtre os dados por período e cliente.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <CampoFiltro
              label="Data inicial"
              name="dataInicio"
              type="date"
              defaultValue={
                dados.filtros.dataInicio ||
                ""
              }
            />

            <CampoFiltro
              label="Data final"
              name="dataFim"
              type="date"
              defaultValue={
                dados.filtros.dataFim ||
                ""
              }
            />

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Cliente
              </label>

              <select
                name="clienteId"
                defaultValue={
                  dados.filtros.clienteId ||
                  ""
                }
                className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">
                  Todos os clientes
                </option>

                {dados.clientes.map(
                  (
                    cliente
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

                      {cliente.empresa
                        ? ` - ${cliente.empresa}`
                        : ""}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href={`${baseHref}/relatorio`}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700"
            >
              Limpar filtros
            </Link>

            <button
              type="submit"
              className="min-h-12 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Gerar relatório
            </button>
          </div>
        </form>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card
            titulo="Aplicações"
            valor={
              dados.resumo.totalPesquisas
            }
          />

          <Card
            titulo="Respostas"
            valor={
              dados.resumo.totalRespostas
            }
          />

          <Card
            titulo="Convites"
            valor={
              dados.resumo.totalConvites
            }
          />

          <Card
            titulo="Participação"
            valor={
              dados.resumo.taxaParticipacao ===
              null
                ? "—"
                : formatarPercentual(
                    dados.resumo.taxaParticipacao
                  )
            }
          />

          <Card
            titulo="Média geral"
            valor={
              dados.resumo.mediaGeral ===
              null
                ? "—"
                : formatarMedia(
                    dados.resumo.mediaGeral
                  )
            }
          />
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <h2 className="text-lg font-black text-slate-900">
              Situação das aplicações
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Distribuição por status.
            </p>

            <div className="mt-6 space-y-5">
              <Barra
                titulo="Abertas"
                valor={
                  dados.resumo.totalAbertas
                }
                total={
                  dados.resumo.totalPesquisas
                }
              />

              <Barra
                titulo="Fechadas"
                valor={
                  dados.resumo.totalFechadas
                }
                total={
                  dados.resumo.totalPesquisas
                }
              />

              <Barra
                titulo="Arquivadas"
                valor={
                  dados.resumo.totalArquivadas
                }
                total={
                  dados.resumo.totalPesquisas
                }
              />
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <h2 className="text-lg font-black text-slate-900">
              Participação
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Engajamento dos participantes convidados.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <Info
                titulo="Convites"
                valor={String(
                  dados.resumo.totalConvites
                )}
              />

              <Info
                titulo="Respondidos"
                valor={String(
                  dados.resumo.totalConvitesRespondidos
                )}
              />

              <Info
                titulo="Respostas"
                valor={String(
                  dados.resumo.totalRespostas
                )}
              />

              <Info
                titulo="Taxa"
                valor={
                  dados.resumo.taxaParticipacao ===
                  null
                    ? "—"
                    : formatarPercentual(
                        dados.resumo.taxaParticipacao
                      )
                }
              />
            </div>
          </section>
        </div>

        <section className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="text-lg font-black text-slate-900">
              Indicadores por cliente
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50">
                <tr>
                  <Th>
                    Cliente
                  </Th>

                  <Th direita>
                    Aplicações
                  </Th>

                  <Th direita>
                    Respostas
                  </Th>

                  <Th direita>
                    Convites
                  </Th>

                  <Th direita>
                    Participação
                  </Th>

                  <Th direita>
                    Média
                  </Th>
                </tr>
              </thead>

              <tbody>
                {dados.porCliente.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={
                        6
                      }
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Nenhum dado encontrado.
                    </td>
                  </tr>
                ) : (
                  dados.porCliente.map(
                    (
                      cliente
                    ) => (
                      <tr
                        key={
                          cliente.clienteId
                        }
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-900">
                            {
                              cliente.clienteNome
                            }
                          </p>

                          {cliente.empresa && (
                            <p className="text-xs text-slate-500">
                              {
                                cliente.empresa
                              }
                            </p>
                          )}
                        </td>

                        <TdNumero
                          valor={
                            cliente.totalPesquisas
                          }
                        />

                        <TdNumero
                          valor={
                            cliente.totalRespostas
                          }
                        />

                        <TdNumero
                          valor={
                            cliente.totalConvites
                          }
                        />

                        <TdNumero
                          valor={
                            cliente.taxaParticipacao ===
                            null
                              ? "—"
                              : formatarPercentual(
                                  cliente.taxaParticipacao
                                )
                          }
                        />

                        <TdNumero
                          destaque
                          valor={
                            cliente.mediaGeral ===
                            null
                              ? "—"
                              : formatarMedia(
                                  cliente.mediaGeral
                                )
                          }
                        />
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="text-lg font-black text-slate-900">
              Aplicações analisadas
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
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
                    Status
                  </Th>

                  <Th direita>
                    Respostas
                  </Th>

                  <Th direita>
                    Participação
                  </Th>

                  <Th direita>
                    Média
                  </Th>

                  <Th direita>
                    Ações
                  </Th>
                </tr>
              </thead>

              <tbody>
                {dados.pesquisas.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={
                        8
                      }
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Nenhuma aplicação encontrada.
                    </td>
                  </tr>
                ) : (
                  dados.pesquisas.map(
                    (
                      pesquisa
                    ) => (
                      <tr
                        key={
                          pesquisa.id
                        }
                        className="border-t border-slate-100"
                      >
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-900">
                            {
                              pesquisa.titulo
                            }
                          </p>

                          <p className="text-xs text-slate-500">
                            {formatarData(
                              pesquisa.criadoEm
                            )}
                          </p>
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

                        <td className="px-4 py-4">
                          <StatusBadge
                            status={
                              pesquisa.status
                            }
                          />
                        </td>

                        <TdNumero
                          valor={
                            pesquisa.totalRespostas
                          }
                        />

                        <TdNumero
                          valor={
                            pesquisa.taxaParticipacao ===
                            null
                              ? "—"
                              : formatarPercentual(
                                  pesquisa.taxaParticipacao
                                )
                          }
                        />

                        <TdNumero
                          destaque
                          valor={
                            pesquisa.mediaGeral ===
                            null
                              ? "—"
                              : formatarMedia(
                                  pesquisa.mediaGeral
                                )
                          }
                        />

                        <td className="px-4 py-4 text-right print:hidden">
                          <Link
                            href={`${baseHref}/${pesquisa.id}/relatorio`}
                            className="text-sm font-bold text-blue-600 hover:text-blue-800"
                          >
                            Ver relatório
                          </Link>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}

function CampoFiltro({
  label,
  name,
  type,
  defaultValue,
}: {
  label: string;
  name: string;
  type: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {
          label
        }
      </label>

      <input
        name={
          name
        }
        type={
          type
        }
        defaultValue={
          defaultValue
        }
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
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

      <strong className="mt-2 block text-3xl font-black text-slate-900">
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
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {
          titulo
        }
      </p>

      <strong className="mt-1 block text-lg text-slate-900">
        {
          valor
        }
      </strong>
    </div>
  );
}

function Barra({
  titulo,
  valor,
  total,
}: {
  titulo: string;

  valor: number;

  total: number;
}) {
  const percentual =
    total > 0
      ? (valor /
          total) *
        100
      : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-slate-700">
          {
            titulo
          }
        </span>

        <span className="text-sm font-black text-slate-900">
          {valor} ·{" "}
          {formatarPercentual(
            percentual
          )}
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{
            width: `${Math.min(
              100,
              percentual
            )}%`,
          }}
        />
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const classe =
    status ===
    "ABERTA"
      ? "bg-green-100 text-green-700"
      : status ===
        "FECHADA"
      ? "bg-red-100 text-red-700"
      : "bg-slate-100 text-slate-700";

  const texto =
    status ===
    "ABERTA"
      ? "Aberta"
      : status ===
        "FECHADA"
      ? "Fechada"
      : status ===
        "ARQUIVADA"
      ? "Arquivada"
      : status;

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${classe}`}
    >
      {
        texto
      }
    </span>
  );
}

function Th({
  children,
  direita = false,
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

function TdNumero({
  valor,
  destaque = false,
}: {
  valor:
    | string
    | number;

  destaque?:
    boolean;
}) {
  return (
    <td
      className={`px-4 py-4 text-right text-sm ${
        destaque
          ? "font-black text-slate-900"
          : "font-semibold text-slate-700"
      }`}
    >
      {
        valor
      }
    </td>
  );
}

function formatarPercentual(
  valor: number
) {
  return `${valor
    .toFixed(1)
    .replace(
      ".",
      ","
    )}%`;
}

function formatarMedia(
  valor: number
) {
  return valor
    .toFixed(2)
    .replace(
      ".",
      ","
    );
}

function formatarData(
  valor:
    | Date
    | string
) {
  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    new Date(
      valor
    )
  );
}
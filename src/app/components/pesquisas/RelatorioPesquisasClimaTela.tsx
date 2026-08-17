"use client";

import Link from "next/link";

import InformacoesAdicionaisRelatorio from "./InformacoesAdicionaisRelatorio";

import type {
  InformacaoAdicionalRelatorio,
} from "./InformacoesAdicionaisRelatorio";


export type DimensaoClima = {
  id: string;

  nome: string;

  totalRespostas: number;

  favoravel: number;

  neutro: number;

  desfavoravel: number;
};


export type AnaliseClima = {
  indiceGeralClima: number | null;

  dimensoes: DimensaoClima[];

  comentariosAbertos?: string[];

  historico?: {
    rotulo: string;
    indice: number;
  }[];
};


export type DadosRelatorioClima = {
  tipo?: string;

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

    /*
     * Legado.
     * Não representa oficialmente
     * o Índice Geral de Clima.
     */
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


  informacoesAdicionais: InformacaoAdicionalRelatorio[];

  analise?: AnaliseClima;
};


export default function RelatorioPesquisasClimaTela({
  dados,
}: {
  dados: DadosRelatorioClima;
}) {
  const analise =
    dados.analise;


  const dimensoesOrdenadas =
    [
      ...(
        analise?.dimensoes ||
        []
      ),
    ].sort(
      (
        a,
        b
      ) =>
        b.favoravel -
        a.favoravel
    );


  const melhores =
    dimensoesOrdenadas.slice(
      0,
      3
    );


  const piores =
    [
      ...dimensoesOrdenadas,
    ]
      .reverse()
      .slice(
        0,
        3
      );


  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-5 shadow-sm print:shadow-none sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
              Pesquisa de Clima
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-900">
              Relatório de Clima Organizacional
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Percepção dos colaboradores, favorabilidade e principais
              dimensões do clima.
            </p>
          </div>


          <div className="flex flex-wrap gap-3 print:hidden">
            <Link
              href="/pesquisas"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Voltar
            </Link>


            <Link
              href={montarUrlRelatorioImpressao(
                dados,
                "/relatorios/clima"
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-700"
            >
              Imprimir relatório
            </Link>
          </div>
        </div>
      </header>


      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Filtros
          dados={
            dados
          }
        />


        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card
            titulo="Pesquisas"
            valor={
              dados.resumo
                .totalPesquisas
            }
          />


          <Card
            titulo="Respostas"
            valor={
              dados.resumo
                .totalRespostas
            }
          />


          <Card
            titulo="Participação"
            valor={
              dados.resumo
                .taxaParticipacao ===
              null
                ? "—"
                : percentual(
                    dados.resumo
                      .taxaParticipacao
                  )
            }
          />


          <Card
            titulo="Clima Geral"
            valor={
              analise?.indiceGeralClima ==
              null
                ? "—"
                : percentual(
                    analise
                      .indiceGeralClima
                  )
            }
            destaque
          />
        </div>


        {!analise ? (
          <AvisoAnalise />
        ) : (
          <>
            <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Favorabilidade
              </p>

              <h2 className="mt-1 text-lg font-black text-slate-900">
                Resultado por dimensão
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Percentual de respostas favoráveis, neutras e desfavoráveis.
              </p>


              {analise.dimensoes.length ===
              0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  Ainda não existem dimensões com respostas suficientes para
                  apresentar resultados.
                </div>
              ) : (
                <div className="mt-6 space-y-5">
                  {analise.dimensoes.map(
                    dimensao => (
                      <DimensaoClimaCard
                        key={
                          dimensao.id
                        }
                        dimensao={
                          dimensao
                        }
                      />
                    )
                  )}
                </div>
              )}
            </section>


            {analise.dimensoes.length >
              0 && (
              <div className="mb-6 grid gap-6 lg:grid-cols-2">
                <Ranking
                  titulo="Melhores dimensões"
                  descricao="Aspectos mais bem percebidos pelos colaboradores."
                  itens={
                    melhores
                  }
                  tipo="melhores"
                />


                <Ranking
                  titulo="Pontos de atenção"
                  descricao="Dimensões com menor índice de favorabilidade."
                  itens={
                    piores
                  }
                  tipo="atencao"
                />
              </div>
            )}


            {!!analise.historico
              ?.length && (
              <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                    Histórico
                  </p>

                  <h2 className="mt-1 text-lg font-black text-slate-900">
                    Evolução do clima
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Evolução do índice geral entre as pesquisas consideradas.
                  </p>
                </div>


                <div className="mt-5 space-y-4">
                  {analise.historico.map(
                    (
                      item,
                      index
                    ) => (
                      <BarraPercentual
                        key={`${item.rotulo}-${index}`}
                        titulo={
                          item.rotulo
                        }
                        percentualValor={
                          item.indice
                        }
                      />
                    )
                  )}
                </div>
              </section>
            )}


          </>
        )}


        <InformacoesAdicionaisRelatorio
          itens={
            dados.informacoesAdicionais ||
            []
          }
          variante="clima"
        />


        <TabelaPesquisas
          pesquisas={
            dados.pesquisas
          }
        />
      </section>
    </main>
  );
}


function DimensaoClimaCard({
  dimensao,
}: {
  dimensao: DimensaoClima;
}) {
  const favoravel =
    limitarPercentual(
      dimensao.favoravel
    );

  const neutro =
    limitarPercentual(
      dimensao.neutro
    );

  const desfavoravel =
    limitarPercentual(
      dimensao.desfavoravel
    );


  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-black text-slate-900">
            {
              dimensao.nome
            }
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            {
              dimensao.totalRespostas
            }{" "}
            resposta(s)
          </p>
        </div>


        <div className="text-left sm:text-right">
          <strong className="block text-xl text-blue-700">
            {percentual(
              favoravel
            )}
          </strong>

          <span className="text-xs font-semibold text-slate-500">
            favorabilidade
          </span>
        </div>
      </div>


      <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
        <div
          className="bg-green-500"
          style={{
            width: `${favoravel}%`,
          }}
          title={`Favorável: ${percentual(
            favoravel
          )}`}
        />

        <div
          className="bg-amber-400"
          style={{
            width: `${neutro}%`,
          }}
          title={`Neutro: ${percentual(
            neutro
          )}`}
        />

        <div
          className="bg-red-500"
          style={{
            width: `${desfavoravel}%`,
          }}
          title={`Desfavorável: ${percentual(
            desfavoravel
          )}`}
        />
      </div>


      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold">
        <span className="text-green-700">
          Favorável{" "}
          {percentual(
            favoravel
          )}
        </span>

        <span className="text-amber-700">
          Neutro{" "}
          {percentual(
            neutro
          )}
        </span>

        <span className="text-red-700">
          Desfavorável{" "}
          {percentual(
            desfavoravel
          )}
        </span>
      </div>
    </div>
  );
}


function Ranking({
  titulo,
  descricao,
  itens,
  tipo,
}: {
  titulo: string;

  descricao: string;

  itens: DimensaoClima[];

  tipo:
    | "melhores"
    | "atencao";
}) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="text-lg font-black text-slate-900">
        {
          titulo
        }
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {
          descricao
        }
      </p>


      {itens.length ===
      0 ? (
        <p className="mt-5 text-sm text-slate-500">
          Nenhuma dimensão disponível.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {itens.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  item.id
                }
                className={`flex items-center justify-between gap-4 rounded-2xl p-4 ${
                  tipo ===
                  "melhores"
                    ? "bg-green-50"
                    : "bg-amber-50"
                }`}
              >
                <div>
                  <span
                    className={`mr-2 text-xs font-bold ${
                      tipo ===
                      "melhores"
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  >
                    #
                    {index +
                      1}
                  </span>

                  <strong className="text-sm text-slate-900">
                    {
                      item.nome
                    }
                  </strong>
                </div>


                <strong
                  className={
                    tipo ===
                    "melhores"
                      ? "text-green-700"
                      : "text-amber-700"
                  }
                >
                  {percentual(
                    item.favoravel
                  )}
                </strong>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}


function Filtros({
  dados,
}: {
  dados: DadosRelatorioClima;
}) {
  return (
    <form
      method="get"
      className="mb-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 print:hidden"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <CampoFiltro
          label="Data inicial"
          name="dataInicio"
          type="date"
          defaultValue={
            dados.filtros
              .dataInicio ||
            ""
          }
        />


        <CampoFiltro
          label="Data final"
          name="dataFim"
          type="date"
          defaultValue={
            dados.filtros
              .dataFim ||
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
              dados.filtros
                .clienteId ||
              ""
            }
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="">
              Todos os clientes
            </option>

            {dados.clientes.map(
              cliente => (
                <option
                  key={
                    cliente.id
                  }
                  value={
                    cliente.id
                  }
                >
                  {cliente.empresa ||
                    cliente.nome}
                </option>
              )
            )}
          </select>
        </div>
      </div>


      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/pesquisas/relatorio"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Limpar
        </Link>


        <button
          type="submit"
          className="min-h-12 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          Gerar relatório
        </button>
      </div>
    </form>
  );
}


function TabelaPesquisas({
  pesquisas,
}: {
  pesquisas: DadosRelatorioClima["pesquisas"];
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-100 p-6">
        <h2 className="text-lg font-black text-slate-900">
          Pesquisas consideradas
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Aplicações utilizadas na consolidação dos indicadores de clima.
        </p>
      </div>


      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-slate-50">
            <tr>
              <Th>
                Pesquisa
              </Th>

              <Th>
                Cliente
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
                Ações
              </Th>
            </tr>
          </thead>


          <tbody>
            {pesquisas.length ===
            0 ? (
              <tr>
                <td
                  colSpan={
                    6
                  }
                  className="p-10 text-center text-sm text-slate-500"
                >
                  Nenhuma pesquisa encontrada.
                </td>
              </tr>
            ) : (
              pesquisas.map(
                pesquisa => (
                  <tr
                    key={
                      pesquisa.id
                    }
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900">
                        {
                          pesquisa.titulo
                        }
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {
                          pesquisa.modelo
                            .titulo
                        }
                      </div>
                    </td>


                    <td className="px-4 py-4 text-sm text-slate-700">
                      {pesquisa.cliente
                        .empresa ||
                        pesquisa.cliente
                          .nome}
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
                          : percentual(
                              pesquisa.taxaParticipacao
                            )
                      }
                    />


                    <td className="px-4 py-4 text-right print:hidden">
                      <Link
                        href={`/pesquisas/${pesquisa.id}/relatorio`}
                        className="text-sm font-bold text-blue-600 transition hover:text-blue-800"
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
  );
}


function AvisoAnalise() {
  return (
    <div className="mb-6 rounded-3xl border border-blue-200 bg-blue-50 p-6">
      <h2 className="font-black text-blue-950">
        Dados analíticos ainda não calculados
      </h2>

      <p className="mt-2 text-sm leading-6 text-blue-800">
        O relatório operacional está disponível, mas ainda não foram encontrados
        indicadores de favorabilidade e resultados por dimensão.
      </p>
    </div>
  );
}


function BarraPercentual({
  titulo,
  percentualValor,
}: {
  titulo: string;

  percentualValor: number;
}) {
  const valor =
    limitarPercentual(
      percentualValor
    );


  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-slate-700">
          {
            titulo
          }
        </span>

        <strong className="text-sm text-blue-700">
          {percentual(
            valor
          )}
        </strong>
      </div>


      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{
            width: `${valor}%`,
          }}
        />
      </div>
    </div>
  );
}


function Card({
  titulo,
  valor,
  destaque = false,
}: {
  titulo: string;

  valor: string | number;

  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-5 shadow-sm ring-1 ${
        destaque
          ? "bg-blue-600 text-white ring-blue-600"
          : "bg-white text-slate-900 ring-slate-200"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          destaque
            ? "text-blue-100"
            : "text-slate-500"
        }`}
      >
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
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
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


  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${classe}`}
    >
      {status.replaceAll(
        "_",
        " "
      )}
    </span>
  );
}


function Th({
  children,
  direita = false,
}: {
  children: React.ReactNode;

  direita?: boolean;
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
}: {
  valor: string | number;
}) {
  return (
    <td className="px-4 py-4 text-right text-sm font-semibold text-slate-700">
      {
        valor
      }
    </td>
  );
}


function percentual(
  valor: number
) {
  return `${valor
    .toFixed(1)
    .replace(
      ".",
      ","
    )}%`;
}


function limitarPercentual(
  valor: number
) {
  if (
    !Number.isFinite(
      valor
    )
  ) {
    return 0;
  }


  return Math.min(
    100,
    Math.max(
      0,
      valor
    )
  );
}

function montarUrlRelatorioImpressao(
  dados: DadosRelatorioClima,
  pathname: string
) {
  const params =
    new URLSearchParams();


  if (
    dados.filtros.dataInicio
  ) {
    params.set(
      "dataInicio",
      dados.filtros.dataInicio
    );
  }


  if (
    dados.filtros.dataFim
  ) {
    params.set(
      "dataFim",
      dados.filtros.dataFim
    );
  }


  if (
    dados.filtros.clienteId
  ) {
    params.set(
      "clienteId",
      dados.filtros.clienteId
    );
  }


  const query =
    params.toString();


  return query
    ? `${pathname}?${query}`
    : pathname;
}

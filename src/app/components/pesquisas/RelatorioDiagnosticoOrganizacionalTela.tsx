"use client";

import Link from "next/link";

import InformacoesAdicionaisRelatorio from "./InformacoesAdicionaisRelatorio";

import type {
  InformacaoAdicionalRelatorio,
} from "./InformacoesAdicionaisRelatorio";


export type DimensaoDiagnostico = {
  id: string;
  nome: string;
  score: number;
  classificacao: string;
  totalRespostas: number;
};


export type AnaliseDiagnostico = {
  scoreOrganizacional: number | null;

  dimensoes: DimensaoDiagnostico[];

  forcas: string[];

  pontosAtencao: string[];

  prioridades: string[];
};


export type DadosRelatorioDiagnostico = {
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

  analise?: AnaliseDiagnostico;
};


export default function RelatorioDiagnosticoOrganizacionalTela({
  dados,
}: {
  dados: DadosRelatorioDiagnostico;
}) {
  const analise =
    dados.analise;


  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-5 shadow-sm print:shadow-none sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">
              Diagnóstico Organizacional
            </p>

            <h1 className="mt-1 text-2xl font-black text-slate-900">
              Relatório Executivo Organizacional
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Forças, gargalos e prioridades estratégicas da organização.
            </p>
          </div>


          <div className="flex gap-3 print:hidden">
            <Link
              href="/diagnostico-organizacional"
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Voltar
            </Link>

            <Link
              href={montarUrlRelatorioImpressao(
                dados,
                "/relatorios/diagnostico-organizacional"
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
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
            titulo="Diagnósticos"
            valor={
              dados.resumo
                .totalPesquisas
            }
          />

          <Card
            titulo="Participações"
            valor={
              dados.resumo
                .totalRespostas
            }
          />

          <Card
            titulo="Adesão"
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
            titulo="Score Organizacional"
            valor={
              analise?.scoreOrganizacional ==
              null
                ? "—"
                : `${formatarScore(
                    analise.scoreOrganizacional
                  )}/100`
            }
            destaque
          />
        </div>


        {!analise ? (
          <AvisoAnalise />
        ) : (
          <>
            <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
                Maturidade Organizacional
              </p>

              <h2 className="mt-1 text-lg font-black text-slate-900">
                Resultado por dimensão
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Consolidação dos indicadores organizacionais em uma escala de 0
                a 100.
              </p>


              {analise.dimensoes.length ===
              0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  Nenhuma dimensão com dados disponíveis.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {analise.dimensoes.map(
                    dimensao => (
                      <DimensaoDiagnosticoCard
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


            <div className="mb-6 grid gap-6 xl:grid-cols-3">
              <ListaExecutiva
                titulo="Forças"
                itens={
                  analise.forcas
                }
                vazio="Nenhuma força classificada."
                variante="forca"
              />

              <ListaExecutiva
                titulo="Pontos de atenção"
                itens={
                  analise.pontosAtencao
                }
                vazio="Nenhum ponto de atenção identificado."
                variante="atencao"
              />

              <ListaExecutiva
                titulo="Prioridades"
                itens={
                  analise.prioridades
                }
                vazio="Nenhuma prioridade classificada."
                variante="prioridade"
                destaque
              />
            </div>
          </>
        )}


        <InformacoesAdicionaisRelatorio
          itens={
            dados.informacoesAdicionais ||
            []
          }
          variante="diagnostico"
        />


        <TabelaAplicacoes
          pesquisas={
            dados.pesquisas
          }
        />
      </section>
    </main>
  );
}


function DimensaoDiagnosticoCard({
  dimensao,
}: {
  dimensao: DimensaoDiagnostico;
}) {
  const score =
    Math.min(
      100,
      Math.max(
        0,
        dimensao.score
      )
    );


  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <strong className="block text-xl text-indigo-700">
            {formatarScore(
              score
            )}
            /100
          </strong>

          <span className="text-xs font-bold uppercase text-slate-500">
            {formatarClassificacao(
              dimensao.classificacao
            )}
          </span>
        </div>
      </div>


      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-600"
          style={{
            width: `${score}%`,
          }}
        />
      </div>
    </div>
  );
}


function ListaExecutiva({
  titulo,
  itens,
  vazio,
  destaque = false,
  variante,
}: {
  titulo: string;

  itens: string[];

  vazio: string;

  destaque?: boolean;

  variante:
    | "forca"
    | "atencao"
    | "prioridade";
}) {
  const classeItem =
    variante ===
    "forca"
      ? "bg-emerald-50 text-emerald-800"
      : variante ===
          "atencao"
        ? "bg-amber-50 text-amber-800"
        : destaque
          ? "bg-white/10 text-white"
          : "bg-red-50 text-red-800";


  return (
    <section
      className={`rounded-3xl p-6 shadow-sm ring-1 ${
        destaque
          ? "bg-indigo-950 text-white ring-indigo-950"
          : "bg-white text-slate-900 ring-slate-200"
      }`}
    >
      <h2 className="text-lg font-black">
        {
          titulo
        }
      </h2>


      {itens.length ===
      0 ? (
        <p
          className={`mt-4 text-sm ${
            destaque
              ? "text-indigo-200"
              : "text-slate-500"
          }`}
        >
          {
            vazio
          }
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {itens.map(
            (
              item,
              index
            ) => (
              <div
                key={`${item}-${index}`}
                className={`rounded-2xl p-3 text-sm font-semibold ${classeItem}`}
              >
                {
                  item
                }
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
  dados: DadosRelatorioDiagnostico;
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
          defaultValue={
            dados.filtros
              .dataInicio ||
            ""
          }
        />

        <CampoFiltro
          label="Data final"
          name="dataFim"
          defaultValue={
            dados.filtros
              .dataFim ||
            ""
          }
        />


        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Organização
          </label>

          <select
            name="clienteId"
            defaultValue={
              dados.filtros
                .clienteId ||
              ""
            }
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          >
            <option value="">
              Todas
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
          href="/diagnostico-organizacional/relatorio"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Limpar
        </Link>

        <button
          type="submit"
          className="min-h-12 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
        >
          Gerar análise
        </button>
      </div>
    </form>
  );
}


function TabelaAplicacoes({
  pesquisas,
}: {
  pesquisas: DadosRelatorioDiagnostico["pesquisas"];
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-100 p-6">
        <h2 className="text-lg font-black text-slate-900">
          Diagnósticos considerados
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Aplicações incluídas no consolidado apresentado acima.
        </p>
      </div>


      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-slate-50">
            <tr>
              <Th>
                Diagnóstico
              </Th>

              <Th>
                Organização
              </Th>

              <Th>
                Status
              </Th>

              <Th direita>
                Participações
              </Th>

              <Th direita>
                Adesão
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
                  Nenhum diagnóstico encontrado.
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
                        href={`/diagnostico-organizacional/${pesquisa.id}/relatorio`}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        Ver diagnóstico
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
    <div className="mb-6 rounded-3xl border border-indigo-200 bg-indigo-50 p-6">
      <h2 className="font-black text-indigo-950">
        Score organizacional ainda não calculado
      </h2>

      <p className="mt-2 text-sm leading-6 text-indigo-800">
        O backend ainda precisa consolidar as dimensões do diagnóstico e aplicar
        as regras de interpretação definidas no modelo.
      </p>
    </div>
  );
}


function CampoFiltro({
  label,
  name,
  defaultValue,
}: {
  label: string;

  name: string;

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
        type="date"
        defaultValue={
          defaultValue
        }
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
      />
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
          ? "bg-indigo-600 text-white ring-indigo-600"
          : "bg-white text-slate-900 ring-slate-200"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          destaque
            ? "text-indigo-100"
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


function formatarScore(
  valor: number
) {
  return valor
    .toFixed(1)
    .replace(
      ".",
      ","
    );
}


function formatarClassificacao(
  valor: string
) {
  return valor
    .replaceAll(
      "_",
      " "
    )
    .toLocaleLowerCase(
      "pt-BR"
    )
    .replace(
      /^./,
      letra =>
        letra.toLocaleUpperCase(
          "pt-BR"
        )
    );
}

function montarUrlRelatorioImpressao(
  dados: DadosRelatorioDiagnostico,
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

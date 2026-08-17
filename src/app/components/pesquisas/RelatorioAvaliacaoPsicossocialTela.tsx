"use client";

import Link from "next/link";

import InformacoesAdicionaisRelatorio from "./InformacoesAdicionaisRelatorio";

import type {
  InformacaoAdicionalRelatorio,
} from "./InformacoesAdicionaisRelatorio";


export type FatorPsicossocial = {
  id: string;

  nome: string;

  fatorRisco: string | null;

  score: number | null;

  classificacao: string | null;

  totalRespostas: number;
};


export type CelulaHeatmapPsicossocial = {
  fator: string;

  score: number | null;

  classificacao: string | null;
};


export type LinhaHeatmapPsicossocial = {
  setor: string;

  totalRespondentes: number;

  fatores: CelulaHeatmapPsicossocial[];
};


export type HeatmapPsicossocial = {
  fatores: string[];

  setores: LinhaHeatmapPsicossocial[];
};


export type AnalisePsicossocial = {
  fatores: FatorPsicossocial[];

  heatmap: HeatmapPsicossocial;
};


export type DadosRelatorioPsicossocial = {
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

  analise?: AnalisePsicossocial;
};


export default function RelatorioAvaliacaoPsicossocialTela({
  dados,
}: {
  dados: DadosRelatorioPsicossocial;
}) {
  const analise =
    dados.analise;


  const pendentes =
    Math.max(
      0,
      dados.resumo.totalConvites -
        dados.resumo.totalConvitesRespondidos
    );


  const criticos =
    analise?.fatores.filter(
      fator =>
        normalizarClassificacao(
          fator.classificacao
        ) ===
        "CRITICO"
    ).length ||
    0;


  const altos =
    analise?.fatores.filter(
      fator =>
        normalizarClassificacao(
          fator.classificacao
        ) ===
        "ALTO"
    ).length ||
    0;


  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-4 py-5 shadow-sm print:shadow-none sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-600">
              Avaliação Psicossocial
            </p>


            <h1 className="mt-1 text-2xl font-black text-slate-900">
              Mapa de Riscos Psicossociais
            </h1>


            <p className="mt-1 text-sm text-slate-500">
              Fatores psicossociais relacionados ao trabalho, exposição e
              criticidade.
            </p>
          </div>


          <div className="flex gap-3 print:hidden">
            <Link
              href="/avaliacao-psicossocial"
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Voltar
            </Link>


            <Link
              href={
                montarUrlRelatorioImpressao(
                  dados
                )
              }
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
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


        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Card
            titulo="Avaliações"
            valor={
              dados.resumo.totalPesquisas
            }
          />


          <Card
            titulo="Respondentes"
            valor={
              dados.resumo.totalRespostas
            }
          />


          <Card
            titulo="Cobertura"
            valor={
              dados.resumo.taxaParticipacao ===
              null
                ? "—"
                : percentual(
                    dados.resumo.taxaParticipacao
                  )
            }
          />


          <Card
            titulo="Fatores altos"
            valor={
              altos
            }
            alerta
          />


          <Card
            titulo="Fatores críticos"
            valor={
              criticos
            }
            critico
          />
        </div>


        <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
            Cobertura
          </p>


          <h2 className="mt-1 text-lg font-black text-slate-900">
            Participação na avaliação
          </h2>


          <p className="mt-1 text-sm text-slate-500">
            Acompanhe a quantidade de convites e respostas recebidas.
          </p>


          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Info
              titulo="Convidados"
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
              titulo="Pendentes"
              valor={String(
                pendentes
              )}
            />
          </div>
        </section>


        {!analise ? (
          <AvisoAnalise />
        ) : (
          <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
              Mapa de exposição
            </p>


            <h2 className="mt-1 text-lg font-black text-slate-900">
              Fatores psicossociais
            </h2>


            <p className="mt-1 text-sm text-slate-500">
              Classificação dos fatores conforme as faixas de interpretação
              configuradas no instrumento.
            </p>


            {analise.fatores.length ===
            0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                Ainda não existem fatores psicossociais com resultados
                disponíveis.
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {analise.fatores.map(
                  (
                    fator,
                    index
                  ) => (
                    <FatorCard
                      /*
                       * Chave defensiva:
                       * mesmo que algum dado legado ainda possua id repetido,
                       * o React continuará recebendo uma key única.
                       */
                      key={`${fator.id}-${normalizarClassificacao(
                        fator.classificacao
                      )}-${index}`}
                      fator={
                        fator
                      }
                    />
                  )
                )}
              </div>
            )}
          </section>
        )}


        {analise &&
          analise.fatores.length >
            0 && (
          <RadarPsicossocial
            fatores={
              analise.fatores
            }
          />
        )}


        {analise && (
          <HeatmapPsicossocialCard
            heatmap={
              analise.heatmap
            }
            fatoresGerais={
              analise.fatores
            }
          />
        )}


        <InformacoesAdicionaisRelatorio
          itens={
            dados.informacoesAdicionais ||
            []
          }
          variante="psicossocial"
        />


        <TabelaAvaliacoes
          pesquisas={
            dados.pesquisas
          }
        />
      </section>
    </main>
  );
}



function montarUrlRelatorioImpressao(
  dados: DadosRelatorioPsicossocial
) {
  const parametros =
    new URLSearchParams();


  if (
    dados.filtros.dataInicio
  ) {
    parametros.set(
      "dataInicio",
      dados.filtros.dataInicio
    );
  }


  if (
    dados.filtros.dataFim
  ) {
    parametros.set(
      "dataFim",
      dados.filtros.dataFim
    );
  }


  if (
    dados.filtros.clienteId
  ) {
    parametros.set(
      "clienteId",
      dados.filtros.clienteId
    );
  }


  const query =
    parametros.toString();


  return query
    ? `/relatorios/avaliacao-psicossocial?${query}`
    : "/relatorios/avaliacao-psicossocial";
}



function FatorCard({
  fator,
}: {
  fator: FatorPsicossocial;
}) {
  const classe =
    normalizarClassificacao(
      fator.classificacao
    );


  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-black text-slate-900">
            {fator.fatorRisco ||
              fator.nome}
          </h3>


          {fator.fatorRisco &&
            fator.fatorRisco !==
              fator.nome && (
              <p className="mt-1 text-xs text-slate-500">
                Dimensão:{" "}
                {
                  fator.nome
                }
              </p>
            )}


          <p className="mt-1 text-xs text-slate-500">
            {
              fator.totalRespostas
            }{" "}
            respondente(s)
          </p>
        </div>


        <div className="flex items-center gap-3">
          <strong className="text-2xl text-slate-900">
            {fator.score ===
            null
              ? "—"
              : `${fator.score
                  .toFixed(
                    1
                  )
                  .replace(
                    ".",
                    ","
                  )}/100`}
          </strong>


          <ClassificacaoBadge
            classificacao={
              classe
            }
          />
        </div>
      </div>


      {fator.score !==
        null && (
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${classeBarra(
              classe
            )}`}
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  0,
                  fator.score
                )
              )}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}


function ClassificacaoBadge({
  classificacao,
}: {
  classificacao: string;
}) {
  const classe =
    classificacao ===
    "CRITICO"
      ? "bg-red-100 text-red-700"
      : classificacao ===
          "ALTO"
        ? "bg-orange-100 text-orange-700"
        : classificacao ===
            "MODERADO"
          ? "bg-amber-100 text-amber-700"
          : classificacao ===
              "BAIXO"
            ? "bg-green-100 text-green-700"
            : "bg-slate-100 text-slate-600";


  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${classe}`}
    >
      {classificacao ||
        "SEM CLASSIFICAÇÃO"}
    </span>
  );
}


function classeBarra(
  classificacao: string
) {
  if (
    classificacao ===
    "CRITICO"
  ) {
    return "bg-red-600";
  }


  if (
    classificacao ===
    "ALTO"
  ) {
    return "bg-orange-500";
  }


  if (
    classificacao ===
    "MODERADO"
  ) {
    return "bg-amber-400";
  }


  if (
    classificacao ===
    "BAIXO"
  ) {
    return "bg-green-500";
  }


  return "bg-slate-400";
}


function Filtros({
  dados,
}: {
  dados: DadosRelatorioPsicossocial;
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
            dados.filtros.dataInicio ||
            ""
          }
        />


        <CampoFiltro
          label="Data final"
          name="dataFim"
          defaultValue={
            dados.filtros.dataFim ||
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
              dados.filtros.clienteId ||
              ""
            }
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
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
          href="/avaliacao-psicossocial/relatorio"
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Limpar
        </Link>


        <button
          type="submit"
          className="min-h-12 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-bold text-white hover:bg-amber-700"
        >
          Gerar análise
        </button>
      </div>
    </form>
  );
}


function TabelaAvaliacoes({
  pesquisas,
}: {
  pesquisas: DadosRelatorioPsicossocial["pesquisas"];
}) {
  return (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-100 p-6">
        <h2 className="text-lg font-black text-slate-900">
          Avaliações consideradas
        </h2>


        <p className="mt-1 text-sm text-slate-500">
          Aplicações consideradas no mapa de riscos psicossociais.
        </p>
      </div>


      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-slate-50">
            <tr>
              <Th>
                Avaliação
              </Th>

              <Th>
                Organização
              </Th>

              <Th>
                Status
              </Th>

              <Th direita>
                Respondentes
              </Th>

              <Th direita>
                Cobertura
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
                  Nenhuma avaliação encontrada.
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
                          pesquisa.modelo.titulo
                        }
                      </div>
                    </td>


                    <td className="px-4 py-4 text-sm text-slate-700">
                      {pesquisa.cliente.empresa ||
                        pesquisa.cliente.nome}
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
                        href={`/avaliacao-psicossocial/${pesquisa.id}/relatorio`}
                        className="text-sm font-bold text-amber-700 hover:text-amber-900"
                      >
                        Ver avaliação
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



function RadarPsicossocial({
  fatores,
}: {
  fatores: FatorPsicossocial[];
}) {
  const fatoresValidos =
    fatores.filter(
      fator =>
        fator.score !==
        null
    );


  if (
    fatoresValidos.length <
    3
  ) {
    return (
      <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
          Panorama geral
        </p>


        <h2 className="mt-1 text-lg font-black text-slate-900">
          Radar de exposição
        </h2>


        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          O radar será exibido quando houver pelo menos 3 fatores psicossociais
          com score calculado.
        </div>
      </section>
    );
  }


  const tamanho =
    720;

  const centro =
    tamanho /
    2;

  const raio =
    235;

  const niveis = [
    25,
    50,
    75,
    100,
  ];


  const pontos =
    fatoresValidos.map(
      (
        fator,
        index
      ) => {
        const angulo =
          -Math.PI /
            2 +
          (
            index /
            fatoresValidos.length
          ) *
            Math.PI *
            2;


        const score =
          Math.min(
            100,
            Math.max(
              0,
              fator.score ??
              0
            )
          );


        const distancia =
          raio *
          (
            score /
            100
          );


        return {
          ...fator,

          x:
            centro +
            Math.cos(
              angulo
            ) *
              distancia,

          y:
            centro +
            Math.sin(
              angulo
            ) *
              distancia,

          eixoX:
            centro +
            Math.cos(
              angulo
            ) *
              raio,

          eixoY:
            centro +
            Math.sin(
              angulo
            ) *
              raio,

          labelX:
            centro +
            Math.cos(
              angulo
            ) *
              (
                raio +
                38
              ),

          labelY:
            centro +
            Math.sin(
              angulo
            ) *
              (
                raio +
                38
              ),
        };
      }
    );


  const poligono =
    pontos
      .map(
        ponto =>
          `${ponto.x},${ponto.y}`
      )
      .join(
        " "
      );


  return (
    <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
        Panorama geral
      </p>


      <h2 className="mt-1 text-lg font-black text-slate-900">
        Radar de exposição psicossocial
      </h2>


      <p className="mt-1 text-sm leading-6 text-slate-500">
        Visão consolidada dos fatores em escala de 0 a 100. Quanto mais distante
        do centro, maior a exposição ao risco.
      </p>


      <div className="mt-5 overflow-x-auto">
        <div className="mx-auto min-w-[720px] max-w-[820px]">
          <svg
            viewBox={`0 0 ${tamanho} ${tamanho}`}
            role="img"
            aria-label="Radar de exposição psicossocial"
            className="h-auto w-full"
          >
            {niveis.map(
              nivel => {
                const raioNivel =
                  raio *
                  (
                    nivel /
                    100
                  );


                const pontosNivel =
                  fatoresValidos
                    .map(
                      (
                        _,
                        index
                      ) => {
                        const angulo =
                          -Math.PI /
                            2 +
                          (
                            index /
                            fatoresValidos.length
                          ) *
                            Math.PI *
                            2;


                        return `${centro + Math.cos(
                          angulo
                        ) * raioNivel},${centro + Math.sin(
                          angulo
                        ) * raioNivel}`;
                      }
                    )
                    .join(
                      " "
                    );


                return (
                  <polygon
                    key={
                      nivel
                    }
                    points={
                      pontosNivel
                    }
                    className="fill-none stroke-slate-200"
                    strokeWidth="1.5"
                  />
                );
              }
            )}


            {pontos.map(
              (
                ponto,
                index
              ) => (
                <line
                  key={`eixo-${index}`}
                  x1={
                    centro
                  }
                  y1={
                    centro
                  }
                  x2={
                    ponto.eixoX
                  }
                  y2={
                    ponto.eixoY
                  }
                  className="stroke-slate-200"
                  strokeWidth="1.5"
                />
              )
            )}


            <polygon
              points={
                poligono
              }
              className="fill-amber-200/50 stroke-amber-500"
              strokeWidth="3"
            />


            {pontos.map(
              (
                ponto,
                index
              ) => (
                <circle
                  key={`ponto-${index}`}
                  cx={
                    ponto.x
                  }
                  cy={
                    ponto.y
                  }
                  r="5"
                  className="fill-amber-500 stroke-white"
                  strokeWidth="2"
                />
              )
            )}


            {niveis.map(
              nivel => (
                <text
                  key={`nivel-${nivel}`}
                  x={
                    centro +
                    5
                  }
                  y={
                    centro -
                    raio *
                      (
                        nivel /
                        100
                      ) +
                    14
                  }
                  className="fill-slate-400 text-[11px]"
                >
                  {
                    nivel
                  }
                </text>
              )
            )}


            {pontos.map(
              (
                ponto,
                index
              ) => (
                <text
                  key={`label-${index}`}
                  x={
                    ponto.labelX
                  }
                  y={
                    ponto.labelY
                  }
                  textAnchor={
                    ponto.labelX >
                    centro +
                      12
                      ? "start"
                      : ponto.labelX <
                          centro -
                            12
                        ? "end"
                        : "middle"
                  }
                  dominantBaseline="middle"
                  className="fill-slate-600 text-[11px] font-semibold"
                >
                  {abreviarTexto(
                    ponto.fatorRisco ||
                    ponto.nome,
                    22
                  )}
                </text>
              )
            )}
          </svg>
        </div>
      </div>


      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {fatoresValidos.map(
          (
            fator,
            index
          ) => (
            <div
              key={`${fator.id}-legenda-${index}`}
              className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3"
            >
              <span className="truncate text-xs font-semibold text-slate-600">
                {fator.fatorRisco ||
                  fator.nome}
              </span>


              <strong className="shrink-0 text-sm text-slate-900">
                {fator.score
                  ?.toFixed(
                    1
                  )
                  .replace(
                    ".",
                    ","
                  )}
              </strong>
            </div>
          )
        )}
      </div>
    </section>
  );
}


function HeatmapPsicossocialCard({
  heatmap,
  fatoresGerais,
}: {
  heatmap?: HeatmapPsicossocial;

  fatoresGerais: FatorPsicossocial[];
}) {
  const fatores =
    heatmap?.fatores ||
    [];


  const setores =
    heatmap?.setores ||
    [];


  if (
    fatores.length ===
      0 ||
    setores.length ===
      0
  ) {
    return (
      <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
          Mapa de calor
        </p>


        <h2 className="mt-1 text-lg font-black text-slate-900">
          Exposição por setor
        </h2>


        <p className="mt-1 text-sm leading-6 text-slate-500">
          O mapa será exibido quando as respostas possuírem o campo Setor
          preenchido.
        </p>


        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          Existem resultados gerais, mas ainda não há dados suficientes para o
          recorte Setor × Fator.
        </div>
      </section>
    );
  }


  return (
    <section className="mb-6 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-200 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
          Mapa de calor
        </p>


        <h2 className="mt-1 text-lg font-black text-slate-900">
          Setor × fator psicossocial
        </h2>


        <p className="mt-1 text-sm leading-6 text-slate-500">
          Comparação da intensidade de exposição entre os setores. Quanto maior
          o score, maior a exposição ao fator.
        </p>
      </div>


      <div className="overflow-x-auto">
        <table className="min-w-max border-collapse">
          <thead className="bg-slate-50">
            <tr>
              <th className="sticky left-0 z-20 min-w-[190px] border-b border-r border-slate-200 bg-slate-50 px-4 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-600">
                Setor
              </th>


              {fatores.map(
                fator => (
                  <th
                    key={
                      fator
                    }
                    className="min-w-[135px] border-b border-slate-200 px-3 py-4 text-center text-xs font-bold text-slate-600"
                  >
                    <span className="block max-w-[125px] whitespace-normal leading-4">
                      {abreviarTexto(
                        fator,
                        26
                      )}
                    </span>
                  </th>
                )
              )}
            </tr>
          </thead>


          <tbody>
            {setores.map(
              setor => (
                <tr
                  key={
                    setor.setor
                  }
                  className="border-b border-slate-100"
                >
                  <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-4">
                    <div className="font-bold text-slate-900">
                      {
                        setor.setor
                      }
                    </div>


                    <div className="mt-1 text-xs text-slate-500">
                      n={
                        setor.totalRespondentes
                      }
                    </div>
                  </td>


                  {fatores.map(
                    fator => {
                      const celula =
                        setor.fatores.find(
                          item =>
                            item.fator ===
                            fator
                        );


                      return (
                        <td
                          key={`${setor.setor}-${fator}`}
                          className="px-2 py-2 text-center"
                        >
                          <HeatmapCelula
                            score={
                              celula?.score ??
                              null
                            }
                            classificacao={
                              celula?.classificacao ??
                              null
                            }
                          />
                        </td>
                      );
                    }
                  )}
                </tr>
              )
            )}


            <tr className="border-t-2 border-slate-300 bg-slate-50">
              <td className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50 px-4 py-4">
                <div className="font-black text-slate-900">
                  Empresa (Geral)
                </div>
              </td>


              {fatores.map(
                fator => {
                  const geral =
                    fatoresGerais.find(
                      item =>
                        (
                          item.fatorRisco ||
                          item.nome
                        ) ===
                        fator
                    );


                  return (
                    <td
                      key={`geral-${fator}`}
                      className="px-2 py-2 text-center"
                    >
                      <HeatmapCelula
                        score={
                          geral?.score ??
                          null
                        }
                        classificacao={
                          geral?.classificacao ??
                          null
                        }
                        destaque
                      />
                    </td>
                  );
                }
              )}
            </tr>
          </tbody>
        </table>
      </div>


      <div className="flex flex-wrap gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
        <LegendaHeatmap
          classe="bg-green-100 text-green-700"
          texto="Baixo"
        />

        <LegendaHeatmap
          classe="bg-amber-100 text-amber-700"
          texto="Moderado"
        />

        <LegendaHeatmap
          classe="bg-orange-100 text-orange-700"
          texto="Alto"
        />

        <LegendaHeatmap
          classe="bg-red-100 text-red-700"
          texto="Crítico"
        />


        <span className="text-xs text-slate-500">
          As cores seguem a classificação das faixas configuradas quando
          disponível; na ausência dela, usam a intensidade do score.
        </span>
      </div>
    </section>
  );
}


function HeatmapCelula({
  score,
  classificacao,
  destaque = false,
}: {
  score: number | null;

  classificacao: string | null;

  destaque?: boolean;
}) {
  if (
    score ===
    null
  ) {
    return (
      <div className="rounded-xl bg-slate-100 px-3 py-3 text-sm font-bold text-slate-400">
        —
      </div>
    );
  }


  const classe =
    classeHeatmap(
      score,
      classificacao
    );


  return (
    <div
      className={`rounded-xl px-3 py-3 text-sm font-black ${classe} ${
        destaque
          ? "ring-2 ring-slate-300"
          : ""
      }`}
      title={`${score
        .toFixed(
          1
        )
        .replace(
          ".",
          ","
        )}/100${
        classificacao
          ? ` — ${classificacao}`
          : ""
      }`}
    >
      {score
        .toFixed(
          1
        )
        .replace(
          ".",
          ","
        )}
    </div>
  );
}


function LegendaHeatmap({
  classe,
  texto,
}: {
  classe: string;

  texto: string;
}) {
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


function classeHeatmap(
  score: number,
  classificacao?: string | null
) {
  const classe =
    normalizarClassificacao(
      classificacao
    );


  if (
    classe ===
    "CRITICO"
  ) {
    return "bg-red-100 text-red-700";
  }


  if (
    classe ===
    "ALTO"
  ) {
    return "bg-orange-100 text-orange-700";
  }


  if (
    classe ===
    "MODERADO"
  ) {
    return "bg-amber-100 text-amber-700";
  }


  if (
    classe ===
    "BAIXO"
  ) {
    return "bg-green-100 text-green-700";
  }


  /*
   * Fallback visual quando não há faixas compatíveis.
   */
  if (
    score >=
    75
  ) {
    return "bg-red-100 text-red-700";
  }


  if (
    score >=
    50
  ) {
    return "bg-orange-100 text-orange-700";
  }


  if (
    score >=
    25
  ) {
    return "bg-amber-100 text-amber-700";
  }


  return "bg-green-100 text-green-700";
}


function abreviarTexto(
  texto: string,
  limite: number
) {
  if (
    texto.length <=
    limite
  ) {
    return texto;
  }


  return `${texto.slice(
    0,
    Math.max(
      0,
      limite -
        1
    )
  )}…`;
}


function AvisoAnalise() {
  return (
    <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">
      <h2 className="font-black text-amber-950">
        Mapa de riscos ainda não calculado
      </h2>


      <p className="mt-2 text-sm leading-6 text-amber-800">
        O backend ainda precisa consolidar as dimensões e aplicar as faixas de
        interpretação configuradas no instrumento.
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
        className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
      />
    </div>
  );
}


function Card({
  titulo,
  valor,
  alerta = false,
  critico = false,
}: {
  titulo: string;

  valor: string | number;

  alerta?: boolean;

  critico?: boolean;
}) {
  const classe =
    critico
      ? "bg-red-600 text-white ring-red-600"
      : alerta
        ? "bg-orange-500 text-white ring-orange-500"
        : "bg-white text-slate-900 ring-slate-200";


  return (
    <div
      className={`rounded-3xl p-5 shadow-sm ring-1 ${classe}`}
    >
      <p className="text-sm font-semibold opacity-70">
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
    <div className="rounded-2xl bg-amber-50 p-4">
      <p className="text-xs font-semibold uppercase text-amber-700">
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


function normalizarClassificacao(
  valor?: string | null
) {
  return (
    valor ||
    ""
  )
    .trim()
    .toUpperCase()
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );
}


function percentual(
  valor: number
) {
  return `${valor
    .toFixed(
      1
    )
    .replace(
      ".",
      ","
    )}%`;
}
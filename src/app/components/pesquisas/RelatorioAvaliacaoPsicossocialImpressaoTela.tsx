"use client";

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


export default function RelatorioAvaliacaoPsicossocialImpressaoTela({
  dados,
  analise,
  altos,
  criticos,
  pendentes,
}: {
  dados: DadosRelatorioPsicossocial;

  analise?: AnalisePsicossocial;

  altos: number;

  criticos: number;

  pendentes: number;
}) {
  const fatores =
    analise?.fatores.filter(
      fator =>
        fator.score !==
        null
    ) ??
    [];


  const ranking =
    [...fatores].sort(
      (
        a,
        b
      ) =>
        (
          b.score ??
          -1
        ) -
        (
          a.score ??
          -1
        )
    );


  const fatoresAtencao =
    ranking.filter(
      fator => {
        const classe =
          normalizarClassificacao(
            fator.classificacao
          );


        return (
          classe ===
            "CRITICO" ||
          classe ===
            "ALTO" ||
          classe ===
            "MODERADO"
        );
      }
    );


  const fatoresProtecao =
    [...ranking]
      .reverse()
      .filter(
        fator => {
          const classe =
            normalizarClassificacao(
              fator.classificacao
            );


          return (
            classe ===
              "BAIXO" ||
            classe ===
              ""
          );
        }
      )
      .slice(
        0,
        5
      );


  const organizacao =
    nomeOrganizacaoRelatorio(
      dados
    );


  const periodo =
    periodoRelatorio(
      dados
    );


  const heatmap =
    analise?.heatmap;


  const gruposHeatmap =
    dividirArray(
      heatmap?.fatores ??
        [],
      6
    );


  return (
    <main className="min-h-screen bg-white p-6 text-slate-950 print:min-h-0 print:p-0">
      <div className="mx-auto mb-6 flex max-w-[210mm] justify-end gap-3 print:hidden">
        <button
          type="button"
          onClick={() =>
            window.close()
          }
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Fechar
        </button>

        <button
          type="button"
          onClick={() =>
            window.print()
          }
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Imprimir / salvar PDF
        </button>
      </div>

      <div className="bg-white text-slate-950">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 11mm 13mm 11mm;
          }

          html,
          body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .relatorio-print {
            display: block !important;
            width: 100%;
            font-size: 10.5px;
            line-height: 1.45;
            color: #0f172a;
          }

          .pagina-print {
            break-after: page;
            page-break-after: always;
          }

          .pagina-print:last-child {
            break-after: auto;
            page-break-after: auto;
          }

          .quebra-antes {
            break-before: page;
            page-break-before: always;
          }

          .evitar-quebra {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .tabela-print {
            width: 100%;
            border-collapse: collapse;
          }

          .tabela-print th,
          .tabela-print td {
            border: 1px solid #dbe3ee;
            padding: 6px 7px;
            vertical-align: top;
          }

          .tabela-print th {
            background: #f8fafc !important;
            font-weight: 800;
            color: #334155;
          }

          .rodape-print {
            position: fixed;
            bottom: -7mm;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #e2e8f0;
            padding-top: 3px;
            font-size: 8px;
            color: #94a3b8;
          }
        }
      `}</style>


      <article className="relatorio-print">
        <div className="rodape-print">
          <span>
            MundialRH · Avaliação Psicossocial
          </span>

          <span>
            Relatório gerado pelo sistema
          </span>
        </div>


        {/* =================================================
         * CAPA
         * =============================================== */}
        <section className="pagina-print flex min-h-[250mm] flex-col justify-between">
          <div>
            <div className="h-2 w-24 rounded-full bg-amber-500" />


            <p className="mt-10 text-[11px] font-black uppercase tracking-[0.28em] text-amber-600">
              MundialRH
            </p>


            <h1 className="mt-4 max-w-[155mm] text-[32px] font-black leading-[1.05] text-slate-950">
              Relatório Consolidado de Avaliação Psicossocial
            </h1>


            <p className="mt-5 max-w-[145mm] text-[14px] leading-6 text-slate-600">
              Panorama executivo dos fatores psicossociais relacionados ao
              trabalho, com consolidação de exposição, participação, comparação
              setorial e informações complementares.
            </p>


            <div className="mt-14 grid grid-cols-2 gap-4">
              <BlocoCapa
                titulo="Organização"
                valor={
                  organizacao
                }
              />

              <BlocoCapa
                titulo="Período analisado"
                valor={
                  periodo
                }
              />

              <BlocoCapa
                titulo="Avaliações consideradas"
                valor={String(
                  dados.resumo.totalPesquisas
                )}
              />

              <BlocoCapa
                titulo="Respondentes"
                valor={String(
                  dados.resumo.totalRespostas
                )}
              />
            </div>
          </div>


          <div className="border-t border-slate-200 pt-5">
            <p className="text-[11px] font-bold text-slate-700">
              Documento para apresentação dos resultados consolidados
            </p>


            <p className="mt-1 text-[9px] leading-4 text-slate-500">
              Este relatório apresenta os resultados produzidos pela metodologia
              configurada no instrumento utilizado. A interpretação técnica e a
              definição de medidas devem considerar o contexto organizacional e
              profissional da empresa.
            </p>
          </div>
        </section>


        {/* =================================================
         * RESUMO EXECUTIVO
         * =============================================== */}
        <section className="pagina-print">
          <TituloPrint
            numero="1"
            titulo="Resumo executivo"
            descricao="Síntese dos resultados consolidados da avaliação."
          />


          <div className="mt-5 grid grid-cols-5 gap-2">
            <MetricaPrint
              titulo="Avaliações"
              valor={String(
                dados.resumo.totalPesquisas
              )}
            />

            <MetricaPrint
              titulo="Respondentes"
              valor={String(
                dados.resumo.totalRespostas
              )}
            />

            <MetricaPrint
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

            <MetricaPrint
              titulo="Fatores altos"
              valor={String(
                altos
              )}
              destaque="alto"
            />

            <MetricaPrint
              titulo="Fatores críticos"
              valor={String(
                criticos
              )}
              destaque="critico"
            />
          </div>


          <div className="mt-6 rounded-2xl border border-slate-200 p-5">
            <h3 className="text-[14px] font-black">
              Leitura executiva
            </h3>


            <p className="mt-2 text-[10.5px] leading-5 text-slate-700">
              {textoResumoExecutivo(
                dados,
                fatores,
                altos,
                criticos
              )}
            </p>
          </div>


          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="evitar-quebra rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <h3 className="text-[12px] font-black text-orange-900">
                Fatores prioritários
              </h3>


              {fatoresAtencao.length ===
              0 ? (
                <p className="mt-3 text-[10px] text-orange-800">
                  Nenhum fator classificado como moderado, alto ou crítico no
                  consolidado atual.
                </p>
              ) : (
                <ol className="mt-3 space-y-2">
                  {fatoresAtencao
                    .slice(
                      0,
                      5
                    )
                    .map(
                      (
                        fator,
                        index
                      ) => (
                        <li
                          key={`${fator.id}-prioridade-print-${index}`}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="font-semibold text-slate-800">
                            {index +
                              1}
                            .{" "}
                            {fator.fatorRisco ||
                              fator.nome}
                          </span>

                          <strong className="shrink-0 text-orange-800">
                            {formatarScore(
                              fator.score
                            )}
                          </strong>
                        </li>
                      )
                    )}
                </ol>
              )}
            </div>


            <div className="evitar-quebra rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <h3 className="text-[12px] font-black text-emerald-900">
                Menores exposições
              </h3>


              {fatoresProtecao.length ===
              0 ? (
                <p className="mt-3 text-[10px] text-emerald-800">
                  Não há fatores classificados como baixo para destacar neste
                  momento.
                </p>
              ) : (
                <ol className="mt-3 space-y-2">
                  {fatoresProtecao.map(
                    (
                      fator,
                      index
                    ) => (
                      <li
                        key={`${fator.id}-protecao-print-${index}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="font-semibold text-slate-800">
                          {index +
                            1}
                          .{" "}
                          {fator.fatorRisco ||
                            fator.nome}
                        </span>

                        <strong className="shrink-0 text-emerald-800">
                          {formatarScore(
                            fator.score
                          )}
                        </strong>
                      </li>
                    )
                  )}
                </ol>
              )}
            </div>
          </div>


          <div className="mt-6">
            <h3 className="text-[13px] font-black">
              Escopo considerado
            </h3>


            <table className="tabela-print mt-3">
              <tbody>
                <tr>
                  <th className="w-[35%] text-left">
                    Organização
                  </th>

                  <td>
                    {
                      organizacao
                    }
                  </td>
                </tr>

                <tr>
                  <th className="text-left">
                    Período
                  </th>

                  <td>
                    {
                      periodo
                    }
                  </td>
                </tr>

                <tr>
                  <th className="text-left">
                    Convites
                  </th>

                  <td>
                    {dados.resumo.totalConvites} enviados ·{" "}
                    {dados.resumo.totalConvitesRespondidos} respondidos ·{" "}
                    {pendentes} pendentes
                  </td>
                </tr>

                <tr>
                  <th className="text-left">
                    Dimensões/fatores com score
                  </th>

                  <td>
                    {
                      fatores.length
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>


        {/* =================================================
         * PARTICIPAÇÃO
         * =============================================== */}
        <section className="pagina-print">
          <TituloPrint
            numero="2"
            titulo="Participação e cobertura"
            descricao="Indicadores de coleta e distribuição dos respondentes."
          />


          <div className="mt-5 grid grid-cols-4 gap-3">
            <MetricaPrint
              titulo="Convidados"
              valor={String(
                dados.resumo.totalConvites
              )}
            />

            <MetricaPrint
              titulo="Respondidos"
              valor={String(
                dados.resumo.totalConvitesRespondidos
              )}
            />

            <MetricaPrint
              titulo="Pendentes"
              valor={String(
                pendentes
              )}
            />

            <MetricaPrint
              titulo="Taxa"
              valor={
                dados.resumo.taxaParticipacao ===
                null
                  ? "—"
                  : percentual(
                      dados.resumo.taxaParticipacao
                    )
              }
            />
          </div>


          <h3 className="mt-7 text-[13px] font-black">
            Distribuição por setor
          </h3>


          {heatmap &&
          heatmap.setores.length >
            0 ? (
            <table className="tabela-print mt-3">
              <thead>
                <tr>
                  <th className="text-left">
                    Setor
                  </th>

                  <th className="w-[25%] text-right">
                    Respondentes
                  </th>

                  <th className="w-[25%] text-right">
                    Participação no total
                  </th>
                </tr>
              </thead>

              <tbody>
                {heatmap.setores.map(
                  setor => (
                    <tr
                      key={`${setor.setor}-participacao-print`}
                    >
                      <td className="font-semibold">
                        {
                          setor.setor
                        }
                      </td>

                      <td className="text-right">
                        {
                          setor.totalRespondentes
                        }
                      </td>

                      <td className="text-right">
                        {dados.resumo.totalRespostas >
                        0
                          ? percentual(
                              (
                                setor.totalRespondentes /
                                dados.resumo.totalRespostas
                              ) *
                                100
                            )
                          : "—"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          ) : (
            <p className="mt-3 rounded-xl bg-slate-50 p-4 text-[10px] text-slate-600">
              Não há respostas com setor informado para detalhamento setorial.
            </p>
          )}


          <h3 className="mt-7 text-[13px] font-black">
            Avaliações incluídas
          </h3>


          <table className="tabela-print mt-3">
            <thead>
              <tr>
                <th className="text-left">
                  Avaliação
                </th>

                <th className="text-left">
                  Organização
                </th>

                <th>
                  Respondentes
                </th>

                <th>
                  Cobertura
                </th>
              </tr>
            </thead>

            <tbody>
              {dados.pesquisas.map(
                pesquisa => (
                  <tr
                    key={`${pesquisa.id}-escopo-print`}
                  >
                    <td>
                      <strong>
                        {
                          pesquisa.titulo
                        }
                      </strong>

                      <div className="text-[8.5px] text-slate-500">
                        {
                          pesquisa.modelo.titulo
                        }
                      </div>
                    </td>

                    <td>
                      {pesquisa.cliente.empresa ||
                        pesquisa.cliente.nome}
                    </td>

                    <td className="text-center">
                      {
                        pesquisa.totalRespostas
                      }
                    </td>

                    <td className="text-center">
                      {pesquisa.taxaParticipacao ===
                      null
                        ? "—"
                        : percentual(
                            pesquisa.taxaParticipacao
                          )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </section>


        {/* =================================================
         * RANKING
         * =============================================== */}
        <section className="pagina-print">
          <TituloPrint
            numero="3"
            titulo="Ranking de exposição psicossocial"
            descricao="Ordenação dos fatores do maior para o menor score de exposição."
          />


          {ranking.length ===
          0 ? (
            <p className="mt-5 rounded-xl bg-slate-50 p-4 text-slate-600">
              Ainda não existem fatores com score calculado.
            </p>
          ) : (
            <table className="tabela-print mt-5">
              <thead>
                <tr>
                  <th className="w-[8%]">
                    #
                  </th>

                  <th className="text-left">
                    Fator
                  </th>

                  <th className="w-[18%]">
                    Score
                  </th>

                  <th className="w-[22%]">
                    Classificação
                  </th>

                  <th className="w-[18%]">
                    Respondentes
                  </th>
                </tr>
              </thead>

              <tbody>
                {ranking.map(
                  (
                    fator,
                    index
                  ) => (
                    <tr
                      key={`${fator.id}-ranking-print-${index}`}
                    >
                      <td className="text-center font-bold">
                        {index +
                          1}
                      </td>

                      <td>
                        <strong>
                          {fator.fatorRisco ||
                            fator.nome}
                        </strong>

                        {fator.fatorRisco &&
                          fator.fatorRisco !==
                            fator.nome && (
                            <div className="text-[8.5px] text-slate-500">
                              Dimensão:{" "}
                              {
                                fator.nome
                              }
                            </div>
                          )}
                      </td>

                      <td className="text-center font-black">
                        {formatarScore(
                          fator.score
                        )}
                      </td>

                      <td className="text-center">
                        <BadgePrint
                          classificacao={
                            fator.classificacao
                          }
                        />
                      </td>

                      <td className="text-center">
                        {
                          fator.totalRespostas
                        }
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </section>


        {/* =================================================
         * RADAR
         * =============================================== */}
        {fatores.length >=
          3 && (
          <section className="pagina-print">
            <TituloPrint
              numero="4"
              titulo="Panorama geral — Radar"
              descricao="Visão 360° dos fatores. Quanto mais distante do centro, maior a exposição."
            />


            <RadarPrint
              fatores={
                fatores
              }
            />
          </section>
        )}


        {/* =================================================
         * HEATMAP
         * =============================================== */}
        {gruposHeatmap.map(
          (
            grupo,
            index
          ) => (
            <section
              key={`grupo-heatmap-print-${index}`}
              className="pagina-print"
            >
              <TituloPrint
                numero={
                  fatores.length >=
                  3
                    ? String(
                        5 +
                          index
                      )
                    : String(
                        4 +
                          index
                      )
                }
                titulo={
                  index ===
                  0
                    ? "Mapa de calor — Setor × fator"
                    : "Mapa de calor — continuação"
                }
                descricao="Comparação setorial dos scores de exposição."
              />


              <HeatmapPrint
                heatmap={
                  heatmap
                }
                fatoresGerais={
                  fatores
                }
                fatores={
                  grupo
                }
              />
            </section>
          )
        )}


        {/* =================================================
         * DETALHAMENTO
         * =============================================== */}
        {ranking.length >
          0 && (
          <section className="pagina-print">
            <TituloPrint
              numero={String(
                (
                  fatores.length >=
                  3
                    ? 5
                    : 4
                ) +
                  gruposHeatmap.length
              )}
              titulo="Detalhamento dos fatores"
              descricao="Leitura individual dos resultados consolidados."
            />


            <div className="mt-5 grid grid-cols-2 gap-3">
              {ranking.map(
                (
                  fator,
                  index
                ) => (
                  <div
                    key={`${fator.id}-detalhe-print-${index}`}
                    className="evitar-quebra rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[11px] font-black">
                          {fator.fatorRisco ||
                            fator.nome}
                        </h3>

                        {fator.fatorRisco &&
                          fator.fatorRisco !==
                            fator.nome && (
                            <p className="mt-0.5 text-[8.5px] text-slate-500">
                              Dimensão:{" "}
                              {
                                fator.nome
                              }
                            </p>
                          )}
                      </div>

                      <strong className="shrink-0 text-[15px]">
                        {formatarScore(
                          fator.score
                        )}
                      </strong>
                    </div>


                    <div className="mt-3 flex items-center justify-between gap-3">
                      <BadgePrint
                        classificacao={
                          fator.classificacao
                        }
                      />

                      <span className="text-[8.5px] text-slate-500">
                        {
                          fator.totalRespostas
                        }{" "}
                        respondente(s)
                      </span>
                    </div>


                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full ${classeBarra(
                          normalizarClassificacao(
                            fator.classificacao
                          )
                        )}`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              fator.score ??
                                0
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </section>
        )}


        {/* =================================================
         * INFORMAÇÕES ADICIONAIS
         * =============================================== */}
        {dados.informacoesAdicionais.length >
          0 && (
          <section className="pagina-print">
            <TituloPrint
              numero={String(
                (
                  fatores.length >=
                  3
                    ? 6
                    : 5
                ) +
                  gruposHeatmap.length
              )}
              titulo="Informações adicionais"
              descricao="Respostas complementares que não interferem no score quantitativo."
            />


            <div className="mt-5 space-y-4">
              {dados.informacoesAdicionais.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={`${item.id}-adicional-print-${index}`}
                    className="evitar-quebra rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-[11px] font-black">
                          {
                            item.titulo
                          }
                        </h3>

                        {item.dimensao && (
                          <p className="mt-1 text-[8.5px] text-slate-500">
                            Dimensão:{" "}
                            {
                              item.dimensao.nome
                            }
                          </p>
                        )}
                      </div>

                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[8px] font-bold text-slate-600">
                        {
                          item.totalRespostas
                        }{" "}
                        resposta(s)
                      </span>
                    </div>


                    {item.distribuicao.length >
                      0 && (
                      <table className="tabela-print mt-3">
                        <thead>
                          <tr>
                            <th className="text-left">
                              Resposta
                            </th>

                            <th className="w-[22%]">
                              Quantidade
                            </th>

                            <th className="w-[22%]">
                              Percentual
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {item.distribuicao.map(
                            opcao => (
                              <tr
                                key={`${item.id}-${opcao.valor}-print`}
                              >
                                <td>
                                  {
                                    opcao.valor
                                  }
                                </td>

                                <td className="text-center">
                                  {
                                    opcao.quantidade
                                  }
                                </td>

                                <td className="text-center">
                                  {percentual(
                                    opcao.percentual
                                  )}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    )}


                    {item.respostasTexto.length >
                      0 && (
                      <div className="mt-3 space-y-2">
                        {item.respostasTexto.map(
                          (
                            resposta,
                            respostaIndex
                          ) => (
                            <div
                              key={`${item.id}-texto-${respostaIndex}`}
                              className="rounded-lg bg-slate-50 px-3 py-2 text-[9px] leading-4 text-slate-700"
                            >
                              “
                              {
                                resposta
                              }
                              ”
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </section>
        )}


        {/* =================================================
         * METODOLOGIA E CONCLUSÃO
         * =============================================== */}
        <section className="pagina-print">
          <TituloPrint
            numero="Final"
            titulo="Metodologia, interpretação e conclusão"
            descricao="Critérios efetivamente utilizados pelo sistema para consolidar os resultados."
          />


          <div className="mt-5 space-y-4">
            <BlocoTextoPrint
              titulo="Escala de score"
              texto="As respostas quantitativas do tipo Nota são normalizadas para uma escala de 0 a 100. No módulo psicossocial, o resultado é orientado para risco: quanto maior o score consolidado, maior a exposição. Perguntas formuladas em sentido positivo são invertidas pelo motor analítico antes da normalização."
            />


            <BlocoTextoPrint
              titulo="Classificação"
              texto="A classificação exibida em cada fator utiliza as faixas de interpretação cadastradas no instrumento. Em relatórios consolidados com mais de uma aplicação, as faixas somente são aplicadas quando as configurações são compatíveis entre as aplicações consideradas."
            />


            <BlocoTextoPrint
              titulo="Peso das dimensões"
              texto="Quando uma dimensão possui peso configurado, esse peso é utilizado na consolidação dos fatores. Perguntas não quantitativas não alteram os scores."
            />


            <BlocoTextoPrint
              titulo="Recorte por setor"
              texto="O mapa de calor utiliza apenas respostas que possuem setor informado. Respostas sem setor permanecem no consolidado geral, mas não são atribuídas a uma linha setorial."
            />


            <BlocoTextoPrint
              titulo="Informações adicionais"
              texto="Perguntas de Sim/Não e Múltipla Escolha são apresentadas por distribuição de respostas. Perguntas de Texto e Texto Longo são apresentadas qualitativamente. Esses conteúdos são complementares e não interferem na classificação quantitativa dos fatores."
            />
          </div>


          <div className="mt-7 rounded-2xl border-2 border-slate-900 p-5">
            <h3 className="text-[14px] font-black">
              Conclusão executiva
            </h3>


            <p className="mt-3 text-[10.5px] leading-5 text-slate-700">
              {textoConclusao(
                dados,
                fatores,
                altos,
                criticos
              )}
            </p>
          </div>


          <div className="mt-10 grid grid-cols-2 gap-10">
            <div className="border-t border-slate-400 pt-2 text-center text-[9px] text-slate-500">
              Responsável pela apresentação dos resultados
            </div>

            <div className="border-t border-slate-400 pt-2 text-center text-[9px] text-slate-500">
              Organização
            </div>
          </div>


          <p className="mt-8 text-[8.5px] leading-4 text-slate-500">
            Observação: este documento consolida as informações disponíveis no
            sistema e não adiciona, por conta própria, critérios de severidade,
            probabilidade, matriz de risco ocupacional ou conclusões normativas
            que não estejam configurados no instrumento e validados pelo
            responsável técnico.
          </p>
        </section>
      </article>
      </div>
    </main>
  );
}


function BlocoCapa({
  titulo,
  valor,
}: {
  titulo: string;

  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
        {
          titulo
        }
      </p>

      <p className="mt-2 text-[15px] font-black text-slate-950">
        {
          valor
        }
      </p>
    </div>
  );
}


function TituloPrint({
  numero,
  titulo,
  descricao,
}: {
  numero: string;

  titulo: string;

  descricao: string;
}) {
  return (
    <div className="border-b-2 border-slate-900 pb-3">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">
        Seção {
          numero
        }
      </p>

      <h2 className="mt-1 text-[20px] font-black">
        {
          titulo
        }
      </h2>

      <p className="mt-1 text-[9.5px] text-slate-500">
        {
          descricao
        }
      </p>
    </div>
  );
}


function MetricaPrint({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;

  valor: string;

  destaque?:
    | "alto"
    | "critico";
}) {
  const classe =
    destaque ===
    "critico"
      ? "border-red-300 bg-red-50 text-red-900"
      : destaque ===
          "alto"
        ? "border-orange-300 bg-orange-50 text-orange-900"
        : "border-slate-200 bg-white text-slate-950";


  return (
    <div
      className={`evitar-quebra rounded-xl border p-3 ${classe}`}
    >
      <p className="text-[8px] font-bold uppercase tracking-wide opacity-70">
        {
          titulo
        }
      </p>

      <strong className="mt-1 block text-[20px] font-black">
        {
          valor
        }
      </strong>
    </div>
  );
}


function BadgePrint({
  classificacao,
}: {
  classificacao?: string | null;
}) {
  const classe =
    normalizarClassificacao(
      classificacao
    );


  const estilos =
    classe ===
    "CRITICO"
      ? "bg-red-100 text-red-700"
      : classe ===
          "ALTO"
        ? "bg-orange-100 text-orange-700"
        : classe ===
            "MODERADO"
          ? "bg-amber-100 text-amber-700"
          : classe ===
              "BAIXO"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-100 text-slate-600";


  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[8px] font-black ${estilos}`}
    >
      {classe ||
        "SEM CLASSIFICAÇÃO"}
    </span>
  );
}


function RadarPrint({
  fatores,
}: {
  fatores: FatorPsicossocial[];
}) {
  const validos =
    fatores.filter(
      fator =>
        fator.score !==
        null
    );


  if (
    validos.length <
    3
  ) {
    return null;
  }


  const tamanho =
    620;

  const centro =
    310;

  const raio =
    190;


  const pontos =
    validos.map(
      (
        fator,
        index
      ) => {
        const angulo =
          -Math.PI /
            2 +
          (
            index /
            validos.length
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
          fator,

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
        };
      }
    );


  return (
    <div className="mt-5">
      <div className="mx-auto w-[150mm]">
        <svg
          viewBox={`0 0 ${tamanho} ${tamanho}`}
          className="h-auto w-full"
        >
          {[25, 50, 75, 100].map(
            nivel => {
              const raioNivel =
                raio *
                (
                  nivel /
                  100
                );


              const pontosNivel =
                validos
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
                          validos.length
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
                  key={`nivel-print-${nivel}`}
                  points={
                    pontosNivel
                  }
                  fill="none"
                  stroke="#dbe3ee"
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
                key={`eixo-print-${index}`}
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
                stroke="#dbe3ee"
                strokeWidth="1.2"
              />
            )
          )}


          <polygon
            points={
              pontos
                .map(
                  ponto =>
                    `${ponto.x},${ponto.y}`
                )
                .join(
                  " "
                )
            }
            fill="#fde68a"
            fillOpacity="0.55"
            stroke="#f59e0b"
            strokeWidth="3"
          />


          {pontos.map(
            (
              ponto,
              index
            ) => (
              <circle
                key={`ponto-print-${index}`}
                cx={
                  ponto.x
                }
                cy={
                  ponto.y
                }
                r="4.5"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="2"
              />
            )
          )}
        </svg>
      </div>


      <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-1">
        {validos.map(
          (
            fator,
            index
          ) => (
            <div
              key={`${fator.id}-radar-legenda-print-${index}`}
              className="flex items-center justify-between gap-2 border-b border-slate-100 py-1 text-[8px]"
            >
              <span className="truncate">
                {index +
                  1}
                .{" "}
                {fator.fatorRisco ||
                  fator.nome}
              </span>

              <strong>
                {formatarScore(
                  fator.score
                )}
              </strong>
            </div>
          )
        )}
      </div>
    </div>
  );
}


function HeatmapPrint({
  heatmap,
  fatoresGerais,
  fatores,
}: {
  heatmap?: HeatmapPsicossocial;

  fatoresGerais: FatorPsicossocial[];

  fatores: string[];
}) {
  if (
    !heatmap ||
    heatmap.setores.length ===
      0 ||
    fatores.length ===
      0
  ) {
    return (
      <p className="mt-5 rounded-xl bg-slate-50 p-4 text-slate-600">
        Não há dados setoriais suficientes para exibir o mapa de calor.
      </p>
    );
  }


  return (
    <table className="tabela-print mt-5 text-[8.5px]">
      <thead>
        <tr>
          <th className="w-[26mm] text-left">
            Setor
          </th>

          {fatores.map(
            fator => (
              <th
                key={`${fator}-cabecalho-heatmap-print`}
                className="text-center"
              >
                {abreviarTexto(
                  fator,
                  18
                )}
              </th>
            )
          )}
        </tr>
      </thead>

      <tbody>
        {heatmap.setores.map(
          setor => (
            <tr
              key={`${setor.setor}-heatmap-print`}
            >
              <td>
                <strong>
                  {
                    setor.setor
                  }
                </strong>

                <div className="text-[7.5px] text-slate-500">
                  n=
                  {
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
                      key={`${setor.setor}-${fator}-heatmap-print`}
                      className="text-center"
                    >
                      <HeatmapValorPrint
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


        <tr>
          <td>
            <strong>
              Empresa (Geral)
            </strong>
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
                  key={`${fator}-geral-heatmap-print`}
                  className="text-center"
                >
                  <HeatmapValorPrint
                    score={
                      geral?.score ??
                      null
                    }
                    classificacao={
                      geral?.classificacao ??
                      null
                    }
                  />
                </td>
              );
            }
          )}
        </tr>
      </tbody>
    </table>
  );
}


function HeatmapValorPrint({
  score,
  classificacao,
}: {
  score: number | null;

  classificacao?: string | null;
}) {
  if (
    score ===
    null
  ) {
    return (
      <span className="text-slate-400">
        —
      </span>
    );
  }


  return (
    <span
      className={`inline-block min-w-[34px] rounded-md px-1.5 py-1 font-black ${classeHeatmap(
        score,
        classificacao
      )}`}
    >
      {score
        .toFixed(
          0
        )}
    </span>
  );
}


function BlocoTextoPrint({
  titulo,
  texto,
}: {
  titulo: string;

  texto: string;
}) {
  return (
    <div className="evitar-quebra rounded-xl border border-slate-200 p-4">
      <h3 className="text-[11px] font-black">
        {
          titulo
        }
      </h3>

      <p className="mt-2 text-[9.5px] leading-4 text-slate-600">
        {
          texto
        }
      </p>
    </div>
  );
}


function nomeOrganizacaoRelatorio(
  dados: DadosRelatorioPsicossocial
) {
  if (
    dados.filtros.clienteId
  ) {
    const cliente =
      dados.clientes.find(
        item =>
          item.id ===
          dados.filtros.clienteId
      );


    if (
      cliente
    ) {
      return (
        cliente.empresa ||
        cliente.nome
      );
    }
  }


  const organizacoes =
    new Set(
      dados.pesquisas.map(
        pesquisa =>
          pesquisa.cliente.empresa ||
          pesquisa.cliente.nome
      )
    );


  if (
    organizacoes.size ===
    1
  ) {
    return (
      Array.from(
        organizacoes
      )[0] ||
      "Organização"
    );
  }


  return "Relatório consolidado de organizações";
}


function periodoRelatorio(
  dados: DadosRelatorioPsicossocial
) {
  if (
    dados.filtros.dataInicio ||
    dados.filtros.dataFim
  ) {
    return `${formatarDataFiltro(
      dados.filtros.dataInicio
    )} a ${formatarDataFiltro(
      dados.filtros.dataFim
    )}`;
  }


  const datas =
    dados.pesquisas
      .map(
        pesquisa =>
          new Date(
            pesquisa.criadoEm
          )
      )
      .filter(
        data =>
          !Number.isNaN(
            data.getTime()
          )
      )
      .sort(
        (
          a,
          b
        ) =>
          a.getTime() -
          b.getTime()
      );


  if (
    datas.length ===
    0
  ) {
    return "Período não informado";
  }


  const primeira =
    datas[0];

  const ultima =
    datas[
      datas.length -
        1
    ];


  return `${formatarData(
    primeira
  )} a ${formatarData(
    ultima
  )}`;
}


function formatarDataFiltro(
  valor?: string | null
) {
  if (
    !valor
  ) {
    return "início";
  }


  const partes =
    valor.split(
      "-"
    );


  if (
    partes.length !==
    3
  ) {
    return valor;
  }


  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


function formatarData(
  data: Date
) {
  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    data
  );
}


function formatarScore(
  score?: number | null
) {
  if (
    score ===
      null ||
    score ===
      undefined
  ) {
    return "—";
  }


  return `${score
    .toFixed(
      1
    )
    .replace(
      ".",
      ","
    )}/100`;
}


function textoResumoExecutivo(
  dados: DadosRelatorioPsicossocial,
  fatores: FatorPsicossocial[],
  altos: number,
  criticos: number
) {
  if (
    fatores.length ===
    0
  ) {
    return "As aplicações selecionadas ainda não possuem fatores psicossociais com score quantitativo disponível para consolidação.";
  }


  const principal =
    [...fatores].sort(
      (
        a,
        b
      ) =>
        (
          b.score ??
          -1
        ) -
        (
          a.score ??
          -1
        )
    )[0];


  const cobertura =
    dados.resumo.taxaParticipacao ===
    null
      ? "A cobertura não pôde ser calculada porque não há convites suficientes para formar o denominador."
      : `A taxa consolidada de cobertura foi de ${percentual(
          dados.resumo.taxaParticipacao
        )}.`;


  return `Foram consolidadas ${dados.resumo.totalPesquisas} avaliação(ões), com ${dados.resumo.totalRespostas} respondente(s) e ${fatores.length} fator(es) com score calculado. ${cobertura} O maior score de exposição foi observado em “${principal.fatorRisco || principal.nome}”, com ${formatarScore(
    principal.score
  )}. O consolidado apresenta ${criticos} fator(es) crítico(s) e ${altos} fator(es) alto(s), conforme as faixas configuradas no instrumento.`;
}


function textoConclusao(
  dados: DadosRelatorioPsicossocial,
  fatores: FatorPsicossocial[],
  altos: number,
  criticos: number
) {
  if (
    fatores.length ===
    0
  ) {
    return "Não há dados quantitativos suficientes para emitir uma conclusão executiva consolidada. Recomenda-se ampliar a coleta e revisar o preenchimento das dimensões do instrumento.";
  }


  const ordenados =
    [...fatores].sort(
      (
        a,
        b
      ) =>
        (
          b.score ??
          -1
        ) -
        (
          a.score ??
          -1
        )
    );


  const principais =
    ordenados
      .slice(
        0,
        3
      )
      .map(
        fator =>
          `${fator.fatorRisco || fator.nome} (${formatarScore(
            fator.score
          )})`
      )
      .join(
        ", "
      );


  const prioridade =
    criticos >
    0
      ? "Há fatores em classificação crítica, devendo estes receber prioridade na análise técnica e na definição de medidas."
      : altos >
          0
        ? "Há fatores classificados como altos, que merecem priorização na análise técnica e no plano de melhoria."
        : "Não foram identificados fatores críticos ou altos no consolidado atual; ainda assim, os resultados devem ser acompanhados periodicamente e interpretados em conjunto com o contexto de trabalho.";


  return `A avaliação consolidou ${dados.resumo.totalRespostas} respondente(s). Os maiores níveis de exposição observados foram: ${principais}. ${prioridade} Recomenda-se utilizar o ranking, o mapa de calor por setor e as informações adicionais para orientar a investigação das causas organizacionais e apoiar a definição de ações compatíveis com a realidade da empresa.`;
}


function dividirArray<T>(
  itens: T[],
  tamanho: number
): T[][] {
  const grupos: T[][] =
    [];


  for (
    let index =
      0;
    index <
    itens.length;
    index +=
      tamanho
  ) {
    grupos.push(
      itens.slice(
        index,
        index +
          tamanho
      )
    );
  }


  return grupos;
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


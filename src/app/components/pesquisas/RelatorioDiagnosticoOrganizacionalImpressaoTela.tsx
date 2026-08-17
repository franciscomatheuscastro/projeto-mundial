"use client";

import type {
  DadosRelatorioDiagnostico,
  DimensaoDiagnostico,
} from "./RelatorioDiagnosticoOrganizacionalTela";


type Props = {
  dados: DadosRelatorioDiagnostico;
};


const CAMINHO_LOGO =
  "/logo-pessoas.png";


export default function RelatorioDiagnosticoOrganizacionalImpressaoTela({
  dados,
}: Props) {
  const analise =
    dados.analise;


  const organizacao =
    obterOrganizacao(
      dados
    );


  const ranking =
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
        b.score -
        a.score
    );


  return (
    <main className="min-h-screen bg-white p-6 text-slate-900 print:min-h-0 print:p-0">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 12mm;
        }

        @media print {
          html,
          body {
            background: #ffffff !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .relatorio-diagnostico {
            width: 100% !important;
            max-width: none !important;
          }

          .quebra-pagina {
            break-before: page;
            page-break-before: always;
          }

          .evitar-quebra {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .relatorio-diagnostico table {
            page-break-inside: auto;
          }

          .relatorio-diagnostico thead {
            display: table-header-group;
          }

          .relatorio-diagnostico tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>


      <div className="relatorio-diagnostico mx-auto max-w-[1050px]">
        <div className="mb-6 flex justify-end gap-3 print:hidden">
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
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Imprimir / salvar PDF
          </button>
        </div>


        <header className="evitar-quebra border-b-2 border-slate-900 pb-5">
          <img
            src={
              CAMINHO_LOGO
            }
            alt="Grupo Mundial RH"
            className="h-auto w-[150px] object-contain print:w-[135px]"
          />


          <p className="mt-5 text-xs font-bold uppercase tracking-[0.24em] text-indigo-600">
            Diagnóstico Organizacional
          </p>


          <h1 className="mt-2 text-3xl font-black leading-tight">
            Relatório Executivo Organizacional
          </h1>


          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Consolidação das dimensões organizacionais, forças, pontos de
            atenção e prioridades identificadas nas aplicações consideradas.
          </p>


          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <InfoCapa
              label="Organização"
              valor={
                organizacao
              }
            />

            <InfoCapa
              label="Período analisado"
              valor={
                formatarPeriodo(
                  dados.filtros.dataInicio,
                  dados.filtros.dataFim
                )
              }
            />

            <InfoCapa
              label="Diagnósticos considerados"
              valor={
                String(
                  dados.resumo.totalPesquisas
                )
              }
            />

            <InfoCapa
              label="Participações"
              valor={
                String(
                  dados.resumo.totalRespostas
                )
              }
            />
          </div>
        </header>


        <section className="mt-8 evitar-quebra">
          <TituloSecao
            indice="1"
            titulo="Resumo executivo"
            descricao="Visão consolidada dos principais indicadores organizacionais."
          />


          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Indicador
              label="Diagnósticos"
              valor={
                dados.resumo.totalPesquisas
              }
            />

            <Indicador
              label="Participações"
              valor={
                dados.resumo.totalRespostas
              }
            />

            <Indicador
              label="Adesão"
              valor={
                dados.resumo.taxaParticipacao ===
                null
                  ? "—"
                  : percentual(
                      dados.resumo.taxaParticipacao
                    )
              }
            />

            <Indicador
              label="Score organizacional"
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


          {analise && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {textoResumoExecutivo(
                analise
              )}
            </div>
          )}
        </section>


        <section className="mt-8">
          <TituloSecao
            indice="2"
            titulo="Resultado por dimensão"
            descricao="Scores consolidados em escala de 0 a 100, conforme a configuração do instrumento."
          />


          {!analise ||
          analise.dimensoes.length ===
            0 ? (
            <Aviso>
              Nenhuma dimensão possui dados suficientes para apresentação.
            </Aviso>
          ) : (
            <div className="mt-4 space-y-3">
              {analise.dimensoes.map(
                dimensao => (
                  <DimensaoCardImpressao
                    key={`${dimensao.id}-${dimensao.nome}`}
                    dimensao={
                      dimensao
                    }
                  />
                )
              )}
            </div>
          )}
        </section>


        {analise && (
          <section className="mt-8 evitar-quebra">
            <TituloSecao
              indice="3"
              titulo="Leitura executiva"
              descricao="Síntese das dimensões organizadas pela lógica analítica do diagnóstico."
            />


            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <ListaExecutiva
                titulo="Forças"
                itens={
                  analise.forcas
                }
                vazio="Nenhuma força classificada."
              />

              <ListaExecutiva
                titulo="Pontos de atenção"
                itens={
                  analise.pontosAtencao
                }
                vazio="Nenhum ponto de atenção identificado."
              />

              <ListaExecutiva
                titulo="Prioridades"
                itens={
                  analise.prioridades
                }
                vazio="Nenhuma prioridade classificada."
                destaque
              />
            </div>
          </section>
        )}


        {ranking.length >
          0 && (
          <section className="mt-8">
            <TituloSecao
              indice="4"
              titulo="Ranking das dimensões"
              descricao="Ordenação do maior para o menor score organizacional."
            />


            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <Th>#</Th>
                    <Th>Dimensão</Th>
                    <Th>Classificação</Th>
                    <Th direita>Score</Th>
                    <Th direita>Respostas</Th>
                  </tr>
                </thead>

                <tbody>
                  {ranking.map(
                    (
                      item,
                      index
                    ) => (
                      <tr
                        key={`${item.id}-${index}`}
                        className="border-t border-slate-200"
                      >
                        <Td>
                          {index +
                            1}
                        </Td>

                        <Td>
                          <strong>
                            {
                              item.nome
                            }
                          </strong>
                        </Td>

                        <Td>
                          {formatarClassificacao(
                            item.classificacao
                          )}
                        </Td>

                        <Td direita>
                          {formatarScore(
                            item.score
                          )}
                          /100
                        </Td>

                        <Td direita>
                          {
                            item.totalRespostas
                          }
                        </Td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}


        {dados.informacoesAdicionais.length >
          0 && (
          <section className="mt-8 quebra-pagina">
            <TituloSecao
              indice="5"
              titulo="Informações adicionais"
              descricao="Perguntas complementares que não compõem o score quantitativo do diagnóstico."
            />


            <div className="mt-4 space-y-4">
              {dados.informacoesAdicionais.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="evitar-quebra rounded-2xl border border-slate-200 p-4"
                  >
                    <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">
                      {formatarTipo(
                        item.tipo
                      )}
                    </p>


                    <h3 className="mt-1 font-black">
                      {
                        item.titulo
                      }
                    </h3>


                    {item.dimensao && (
                      <p className="mt-1 text-xs text-slate-500">
                        Dimensão:{" "}
                        {
                          item.dimensao.nome
                        }
                      </p>
                    )}


                    {item.distribuicao.length >
                      0 && (
                      <div className="mt-3 space-y-2">
                        {item.distribuicao.map(
                          opcao => (
                            <div
                              key={`${item.id}-${opcao.valor}`}
                              className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm"
                            >
                              <span>
                                {
                                  opcao.valor
                                }
                              </span>

                              <strong>
                                {
                                  opcao.quantidade
                                }{" "}
                                ·{" "}
                                {percentual(
                                  opcao.percentual
                                )}
                              </strong>
                            </div>
                          )
                        )}
                      </div>
                    )}


                    {item.respostasTexto.length >
                      0 && (
                      <div className="mt-3 space-y-2">
                        {item.respostasTexto.map(
                          (
                            resposta,
                            respostaIndex
                          ) => (
                            <p
                              key={`${item.id}-texto-${respostaIndex}`}
                              className="rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700"
                            >
                              {
                                resposta
                              }
                            </p>
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


        <section className="mt-8">
          <TituloSecao
            indice="6"
            titulo="Diagnósticos considerados"
            descricao="Aplicações utilizadas na consolidação deste documento."
          />


          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-slate-100">
                <tr>
                  <Th>Diagnóstico</Th>
                  <Th>Organização</Th>
                  <Th>Status</Th>
                  <Th direita>Participações</Th>
                  <Th direita>Adesão</Th>
                </tr>
              </thead>

              <tbody>
                {dados.pesquisas.map(
                  pesquisa => (
                    <tr
                      key={
                        pesquisa.id
                      }
                      className="border-t border-slate-200"
                    >
                      <Td>
                        <strong>
                          {
                            pesquisa.titulo
                          }
                        </strong>

                        <div className="mt-1 text-slate-500">
                          {
                            pesquisa.modelo.titulo
                          }
                        </div>
                      </Td>

                      <Td>
                        {pesquisa.cliente.empresa ||
                          pesquisa.cliente.nome}
                      </Td>

                      <Td>
                        {formatarClassificacao(
                          pesquisa.status
                        )}
                      </Td>

                      <Td direita>
                        {
                          pesquisa.totalRespostas
                        }
                      </Td>

                      <Td direita>
                        {pesquisa.taxaParticipacao ===
                        null
                          ? "—"
                          : percentual(
                              pesquisa.taxaParticipacao
                            )}
                      </Td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>


        <section className="mt-8 evitar-quebra rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-base font-black">
            Nota metodológica
          </h2>


          <p className="mt-2 text-sm leading-6 text-slate-600">
            Os resultados apresentados são consolidados a partir das perguntas
            quantitativas vinculadas às dimensões do instrumento. As
            classificações seguem as faixas configuradas no modelo utilizado.
            As listas de forças, pontos de atenção e prioridades respeitam a
            lógica analítica atualmente adotada pelo sistema.
          </p>
        </section>


        <footer className="mt-8 border-t border-slate-300 pt-4 text-xs leading-5 text-slate-500">
          Documento gerencial para apresentação dos resultados consolidados.
          Recomenda-se que a interpretação e a definição de ações considerem o
          contexto organizacional e a metodologia adotada.
        </footer>
      </div>
    </main>
  );
}


function InfoCapa({
  label,
  valor,
}: {
  label: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {
          label
        }
      </p>

      <strong className="mt-1 block text-sm text-slate-900">
        {
          valor
        }
      </strong>
    </div>
  );
}


function TituloSecao({
  indice,
  titulo,
  descricao,
}: {
  indice: string;
  titulo: string;
  descricao: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">
        {
          indice
        }
      </p>

      <h2 className="mt-1 text-xl font-black">
        {
          titulo
        }
      </h2>

      <p className="mt-1 text-sm leading-6 text-slate-500">
        {
          descricao
        }
      </p>
    </div>
  );
}


function Indicador({
  label,
  valor,
  destaque = false,
}: {
  label: string;
  valor: string | number;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        destaque
          ? "border-indigo-600 bg-indigo-600 text-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <p
        className={`text-xs font-semibold ${
          destaque
            ? "text-indigo-100"
            : "text-slate-500"
        }`}
      >
        {
          label
        }
      </p>

      <strong className="mt-1 block text-xl">
        {
          valor
        }
      </strong>
    </div>
  );
}


function DimensaoCardImpressao({
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
    <div className="evitar-quebra rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-black">
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

        <div className="text-right">
          <strong className="text-lg text-indigo-700">
            {formatarScore(
              score
            )}
            /100
          </strong>

          <p className="mt-1 text-xs font-bold uppercase text-slate-500">
            {formatarClassificacao(
              dimensao.classificacao
            )}
          </p>
        </div>
      </div>


      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
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
}: {
  titulo: string;
  itens: string[];
  vazio: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`evitar-quebra rounded-2xl border p-4 ${
        destaque
          ? "border-indigo-950 bg-indigo-950 text-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <h3 className="font-black">
        {
          titulo
        }
      </h3>

      {itens.length ===
      0 ? (
        <p
          className={`mt-3 text-sm ${
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
        <div className="mt-3 space-y-2">
          {itens.map(
            (
              item,
              index
            ) => (
              <div
                key={`${item}-${index}`}
                className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                  destaque
                    ? "bg-white/10"
                    : "bg-slate-50"
                }`}
              >
                {
                  item
                }
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}


function Aviso({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
      {
        children
      }
    </div>
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
      className={`border border-slate-200 px-3 py-2 font-bold ${
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


function Td({
  children,
  direita = false,
}: {
  children: React.ReactNode;
  direita?: boolean;
}) {
  return (
    <td
      className={`border border-slate-200 px-3 py-2 align-top ${
        direita
          ? "text-right"
          : "text-left"
      }`}
    >
      {
        children
      }
    </td>
  );
}


function obterOrganizacao(
  dados: DadosRelatorioDiagnostico
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


    return (
      cliente?.empresa ||
      cliente?.nome ||
      "Organização selecionada"
    );
  }


  if (
    dados.porCliente.length ===
    1
  ) {
    return (
      dados.porCliente[0].empresa ||
      dados.porCliente[0].clienteNome
    );
  }


  return "Consolidado de organizações";
}


function textoResumoExecutivo(
  analise: NonNullable<
    DadosRelatorioDiagnostico["analise"]
  >
) {
  const score =
    analise.scoreOrganizacional;


  const inicio =
    score == null
      ? "O consolidado ainda não possui score organizacional calculado."
      : `O score organizacional consolidado é ${formatarScore(
          score
        )}/100.`;


  const partes =
    [
      analise.forcas.length >
        0
        ? `Forças identificadas: ${analise.forcas.join(
            ", "
          )}.`
        : null,

      analise.pontosAtencao.length >
        0
        ? `Pontos de atenção: ${analise.pontosAtencao.join(
            ", "
          )}.`
        : null,

      analise.prioridades.length >
        0
        ? `Prioridades: ${analise.prioridades.join(
            ", "
          )}.`
        : null,
    ].filter(
      Boolean
    );


  return [
    inicio,
    ...partes,
  ].join(
    " "
  );
}


function formatarTipo(
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


function formatarScore(
  valor: number
) {
  return valor
    .toFixed(
      1
    )
    .replace(
      ".",
      ","
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


function formatarPeriodo(
  inicio: string | null,
  fim: string | null
) {
  if (
    !inicio &&
    !fim
  ) {
    return "Todos os períodos";
  }


  if (
    inicio &&
    fim
  ) {
    return `${formatarData(
      inicio
    )} até ${formatarData(
      fim
    )}`;
  }


  if (
    inicio
  ) {
    return `A partir de ${formatarData(
      inicio
    )}`;
  }


  return `Até ${formatarData(
    fim!
  )}`;
}


function formatarData(
  data: string
) {
  const [
    ano,
    mes,
    dia,
  ] =
    data.split(
      "-"
    );


  return `${dia}/${mes}/${ano}`;
}

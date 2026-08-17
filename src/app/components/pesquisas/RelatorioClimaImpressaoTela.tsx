"use client";

import type {
  DadosRelatorioClima,
  DimensaoClima,
} from "./RelatorioPesquisasClimaTela";


type Props = {
  dados: DadosRelatorioClima;
};


const CAMINHO_LOGO =
  "/logo-pessoas.png";


export default function RelatorioClimaImpressaoTela({
  dados,
}: Props) {
  const analise =
    dados.analise;


  const organizacao =
    obterOrganizacao(
      dados
    );


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

          .relatorio-clima {
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

          .relatorio-clima table {
            page-break-inside: auto;
          }

          .relatorio-clima thead {
            display: table-header-group;
          }

          .relatorio-clima tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>


      <div className="relatorio-clima mx-auto max-w-[1050px]">
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
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
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


          <p className="mt-5 text-xs font-bold uppercase tracking-[0.24em] text-blue-600">
            Pesquisa de Clima
          </p>


          <h1 className="mt-2 text-3xl font-black leading-tight">
            Relatório de Clima Organizacional
          </h1>


          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Consolidação da percepção dos colaboradores, índice geral de clima,
            favorabilidade por dimensão e informações complementares.
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
              label="Pesquisas consideradas"
              valor={
                String(
                  dados.resumo.totalPesquisas
                )
              }
            />

            <InfoCapa
              label="Respostas"
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
            descricao="Visão consolidada dos principais indicadores da pesquisa de clima."
          />


          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Indicador
              label="Pesquisas"
              valor={
                dados.resumo.totalPesquisas
              }
            />

            <Indicador
              label="Respostas"
              valor={
                dados.resumo.totalRespostas
              }
            />

            <Indicador
              label="Participação"
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
              label="Índice geral de clima"
              valor={
                analise?.indiceGeralClima ==
                null
                  ? "—"
                  : percentual(
                      analise.indiceGeralClima
                    )
              }
              destaque
            />
          </div>


          {analise && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {textoResumoExecutivo(
                analise.dimensoes,
                analise.indiceGeralClima
              )}
            </div>
          )}
        </section>


        <section className="mt-8">
          <TituloSecao
            indice="2"
            titulo="Favorabilidade por dimensão"
            descricao="Distribuição percentual entre respostas favoráveis, neutras e desfavoráveis."
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
                  <DimensaoClimaImpressao
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


        {dimensoesOrdenadas.length >
          0 && (
          <section className="mt-8 evitar-quebra">
            <TituloSecao
              indice="3"
              titulo="Destaques e pontos de atenção"
              descricao="Leitura comparativa das dimensões com maior e menor favorabilidade."
            />


            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Ranking
                titulo="Melhores dimensões"
                itens={
                  dimensoesOrdenadas.slice(
                    0,
                    3
                  )
                }
              />

              <Ranking
                titulo="Pontos de atenção"
                itens={
                  [
                    ...dimensoesOrdenadas,
                  ]
                    .reverse()
                    .slice(
                      0,
                      3
                    )
                }
                atencao
              />
            </div>
          </section>
        )}


        {!!analise?.historico?.length && (
          <section className="mt-8">
            <TituloSecao
              indice="4"
              titulo="Evolução do clima"
              descricao="Histórico do índice geral entre as pesquisas consideradas."
            />


            <div className="mt-4 space-y-3">
              {analise.historico.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={`${item.rotulo}-${index}`}
                    className="evitar-quebra rounded-2xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <strong className="text-sm">
                        {
                          item.rotulo
                        }
                      </strong>

                      <strong className="text-sm text-blue-700">
                        {percentual(
                          item.indice
                        )}
                      </strong>
                    </div>


                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width: `${limitarPercentual(
                            item.indice
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


        {dados.informacoesAdicionais.length >
          0 && (
          <section className="mt-8 quebra-pagina">
            <TituloSecao
              indice="5"
              titulo="Informações adicionais"
              descricao="Perguntas complementares que não compõem o índice quantitativo de clima."
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
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
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
            titulo="Pesquisas consideradas"
            descricao="Aplicações utilizadas na consolidação deste documento."
          />


          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-slate-100">
                <tr>
                  <Th>Pesquisa</Th>
                  <Th>Organização</Th>
                  <Th>Status</Th>
                  <Th direita>Respostas</Th>
                  <Th direita>Participação</Th>
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
                        {formatarTipo(
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
            O Índice Geral de Clima e os resultados por dimensão são calculados
            a partir das respostas quantitativas e da configuração de
            favorabilidade definida no instrumento. Perguntas abertas,
            Sim/Não e múltipla escolha são apresentadas separadamente como
            informações complementares.
          </p>
        </section>


        <footer className="mt-8 border-t border-slate-300 pt-4 text-xs leading-5 text-slate-500">
          Documento gerencial para apresentação dos resultados consolidados da
          pesquisa de clima organizacional.
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
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
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
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <p
        className={`text-xs font-semibold ${
          destaque
            ? "text-blue-100"
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


function DimensaoClimaImpressao({
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
          <strong className="text-lg text-blue-700">
            {percentual(
              favoravel
            )}
          </strong>

          <p className="mt-1 text-xs font-semibold text-slate-500">
            favorabilidade
          </p>
        </div>
      </div>


      <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-slate-100">
        <div
          className="bg-green-500"
          style={{
            width: `${favoravel}%`,
          }}
        />

        <div
          className="bg-amber-400"
          style={{
            width: `${neutro}%`,
          }}
        />

        <div
          className="bg-red-500"
          style={{
            width: `${desfavoravel}%`,
          }}
        />
      </div>


      <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold">
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
  itens,
  atencao = false,
}: {
  titulo: string;
  itens: DimensaoClima[];
  atencao?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <h3 className="font-black">
        {
          titulo
        }
      </h3>


      <div className="mt-3 space-y-2">
        {itens.map(
          (
            item,
            index
          ) => (
            <div
              key={`${item.id}-${index}`}
              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm ${
                atencao
                  ? "bg-amber-50"
                  : "bg-green-50"
              }`}
            >
              <span>
                <strong className="mr-2">
                  #
                  {index +
                    1}
                </strong>

                {
                  item.nome
                }
              </span>

              <strong>
                {percentual(
                  item.favoravel
                )}
              </strong>
            </div>
          )
        )}
      </div>
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
  dados: DadosRelatorioClima
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
  dimensoes: DimensaoClima[],
  indiceGeral: number | null
) {
  const ordenadas =
    [
      ...dimensoes,
    ].sort(
      (
        a,
        b
      ) =>
        b.favoravel -
        a.favoravel
    );


  const melhor =
    ordenadas[0];

  const pior =
    ordenadas[
      ordenadas.length -
      1
    ];


  const partes: string[] =
    [];


  if (
    indiceGeral !=
    null
  ) {
    partes.push(
      `O Índice Geral de Clima consolidado é ${percentual(
        indiceGeral
      )}.`
    );
  }


  if (
    melhor
  ) {
    partes.push(
      `A dimensão com maior favorabilidade é ${melhor.nome}, com ${percentual(
        melhor.favoravel
      )}.`
    );
  }


  if (
    pior &&
    pior.id !==
      melhor?.id
  ) {
    partes.push(
      `O principal ponto de atenção é ${pior.nome}, com ${percentual(
        pior.favoravel
      )} de favorabilidade.`
    );
  }


  return partes.length >
    0
    ? partes.join(
        " "
      )
    : "Ainda não existem dados quantitativos suficientes para gerar uma leitura executiva.";
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
